'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { RecipeCard } from '@/components/feed/RecipeCard';
import { RecipeDetailOverlay } from '@/components/feed/RecipeDetailOverlay';
import { createClient } from '@/lib/db/queries/client'; 
import { getRecipes } from '@/lib/db/queries/recipes';

const BUCKET_URL = "https://mnakswmhlreuclyultdc.supabase.co/storage/v1/object/public/recipe-photos/";
const PAGE_SIZE = 9;

interface Recipe {
  id: string;
  title: string;
  description: string;
  emoji: string;
  image_url: string | null;
  time_estimate: number;
  cost_estimate: string;
  skill_level: string;
  likes: number;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
  } | null;
}

interface ExploreClientProps {
  initialRecipes: Recipe[];
  activeSort: any;
  activeTag: string;
  activeQuery: string;
}

export function ExploreClient({ initialRecipes, activeSort, activeTag, activeQuery }: ExploreClientProps) {
  const [supabase] = useState(() => createClient());
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialRecipes.length >= PAGE_SIZE);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const { ref, inView } = useInView();

  // Reset when filters change (from server)
  useEffect(() => {
    setRecipes(initialRecipes);
    setPage(0);
    setHasMore(initialRecipes.length >= PAGE_SIZE);
  }, [initialRecipes]);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    }
    getUser();
  }, [supabase.auth]);

  const loadMore = useCallback(async () => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);
    
    const nextPage = page + 1;
    const nextRecipes = await getRecipes({
      sort: activeSort,
      tag: activeTag,
      query: activeQuery,
      page: nextPage,
      pageSize: PAGE_SIZE
    });

    if (nextRecipes.length < PAGE_SIZE) setHasMore(false);
    
    setRecipes(prev => [...prev, ...nextRecipes as Recipe[]]);
    setPage(nextPage);
    setIsFetching(false);
  }, [page, isFetching, hasMore, activeSort, activeTag, activeQuery]);

  useEffect(() => {
    if (inView && hasMore && !isFetching) {
      loadMore();
    }
  }, [inView, loadMore, hasMore, isFetching]);

  return (
    <>
      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">🍽️</span>
          <p className="text-white/40 text-sm font-medium">No recipes found.</p>
          <p className="text-white/20 text-xs mt-1">Try a different search or filter.</p>
        </div>
      ) : (
        <>
            <div className="columns-1 sm:columns-2 lg:columns-2 xl:columns-3 gap-4 px-4">
            {recipes.map((recipe) => {
                const fullImageUrl = recipe.image_url 
                ? (recipe.image_url.startsWith('http') 
                    ? recipe.image_url 
                    : `${BUCKET_URL}${recipe.image_url}`)
                : undefined;

                return (
                <div key={recipe.id} className="break-inside-avoid pb-4">
                    <RecipeCard
                    recipeId={recipe.id}
                    title={recipe.title}
                    author={recipe.profiles?.display_name ?? recipe.profiles?.username ?? 'Chef'}
                    authorUsername={recipe.profiles?.username} 
                    authorAvatar={recipe.profiles?.avatar_url} 
                    time={recipe.time_estimate}
                    cost={recipe.cost_estimate}
                    emoji={recipe.emoji}
                    skillLevel={recipe.skill_level}
                    imageUrl={fullImageUrl}
                    currentUserId={currentUserId} 
                    onOpen={(id) => setSelectedId(id)}
                    />
                </div>
                );
            })}
            </div>
            <div ref={ref} className="h-20 flex items-center justify-center">
                {isFetching && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />}
            </div>
        </>
      )}

      {selectedId && (
        <RecipeDetailOverlay
          recipeId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}