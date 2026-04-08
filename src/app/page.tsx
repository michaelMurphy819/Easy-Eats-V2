'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterBar } from '@/components/feed/FilterBar';
import { RecipeCard } from '@/components/feed/RecipeCard';
import { UploadMeal } from '@/components/upload/UploadMeal';
import { RecipeDetailOverlay } from '@/components/feed/RecipeDetailOverlay';
import { createClient } from '@/lib/db/queries/client';
import { useRouter } from 'next/navigation';
import { seedSpoonacularRecipes } from '@/lib/utils/spoonacularSeeder';

const BUCKET_URL = "https://mnakswmhlreuclyultdc.supabase.co/storage/v1/object/public/recipe-photos/";

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
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const router = useRouter(); 
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        profiles:author_id (
          display_name,
          username
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching recipes:", error);
    } else {
      setRecipes(data as Recipe[] || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user || authError) {
        router.push('/auth');
        return; 
      }

      setCurrentUserId(user.id);
      await fetchRecipes();
    };

    init();
  }, [fetchRecipes, router]);

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
      </motion.div>

      <UploadMeal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onRefresh={fetchRecipes} 
      />
      
      <RecipeDetailOverlay 
        recipeId={selectedRecipeId} 
        onClose={() => setSelectedRecipeId(null)} 
      />
    </main>
  );
}