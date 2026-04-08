'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FilterBar } from '@/components/feed/FilterBar';
import { RecipeCard } from '@/components/feed/RecipeCard';
import { UploadMeal } from '@/components/upload/UploadMeal';
import { RecipeDetailOverlay } from '@/components/feed/RecipeDetailOverlay';
import { createClient } from '@/lib/db/queries/client';
import { useRouter } from 'next/navigation';

const BUCKET_URL = "https://mnakswmhlreuclyultdc.supabase.co/storage/v1/object/public/recipe-photos/";
const PAGE_SIZE = 10;

interface Recipe {
  id: string;
  title: string;
  author_name: string;
  time_estimate: number;
  cost_estimate: string;
  emoji: string;
  skill_level: string;
  is_official: boolean;
  created_at: string;
  image_url: string | null;
  profiles?: {
    display_name: string;
    username: string;
  } | null;
}

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const router = useRouter(); 
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());
  const { ref, inView } = useInView();

  const fetchRecipes = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    if (isInitial) setLoading(true);
    else setIsFetchingMore(true);

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        profiles:author_id (
          display_name,
          username
        )
      `)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRecipes(prev => isInitial ? data : [...prev, ...data]);
      if (data.length < PAGE_SIZE) setHasMore(false);
    }
    
    setLoading(false);
    setIsFetchingMore(false);
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user || authError) {
        router.push('/auth');
        return; 
      }
      setCurrentUserId(user.id);
      await fetchRecipes(0, true);
    };
    init();
  }, [fetchRecipes, router, supabase.auth]);

  // Load more when scrolled to bottom
  useEffect(() => {
    if (inView && hasMore && !loading && !isFetchingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRecipes(nextPage);
    }
  }, [inView, hasMore, loading, isFetchingMore, page, fetchRecipes]);

  const filtered = filter === 'All' 
    ? recipes 
    : recipes.filter(r => r.skill_level?.toLowerCase() === filter.toLowerCase());

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-background relative pb-20">
      <FilterBar active={filter} onChange={setFilter} />
      
      <motion.div layout className="flex flex-col gap-14 pt-8 pb-32 px-4 max-w-[600px] mx-auto">
        <AnimatePresence mode='popLayout'>
          {filtered.map(recipe => {
             const fullImageUrl = recipe.image_url 
              ? (recipe.image_url.startsWith('http') 
                  ? recipe.image_url 
                  : `${BUCKET_URL}${recipe.image_url.trim()}`)
              : undefined;

            return (
              <motion.div
                key={recipe.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <RecipeCard 
                  recipeId={recipe.id}
                  title={recipe.title}
                  author={recipe.profiles?.display_name ?? recipe.profiles?.username ?? "Chef"}
                  time={recipe.time_estimate}
                  cost={recipe.cost_estimate}
                  emoji={recipe.emoji}
                  skillLevel={recipe.skill_level}
                  imageUrl={fullImageUrl}
                  currentUserId={currentUserId}
                  onOpen={setSelectedRecipeId}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Sentry for Infinite Scroll */}
        <div ref={ref} className="h-10 w-full flex justify-center items-center">
          {isFetchingMore && (
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          )}
        </div>
      </motion.div>

      <UploadMeal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onRefresh={() => fetchRecipes(0, true)} 
      />
      
      <RecipeDetailOverlay 
        recipeId={selectedRecipeId} 
        onClose={() => setSelectedRecipeId(null)} 
      />
    </main>
  );
}