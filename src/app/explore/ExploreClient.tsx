'use client';

import { useState, useEffect } from 'react';
import { RecipeCard } from '@/components/feed/RecipeCard';
import { RecipeDetailOverlay } from '@/components/feed/RecipeDetailOverlay';
import { createClient } from '@/lib/db/queries/client'; 

const supabase = createClient();
const BUCKET_URL = "https://mnakswmhlreuclyultdc.supabase.co/storage/v1/object/public/recipe-photos/";

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
    avatar_url?: string; // <-- Added this to the type!
  } | null;
}

interface ExploreClientProps {
  recipes: Recipe[];
}

export function ExploreClient({ recipes }: ExploreClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    }
    getUser();
  }, []);

  return (
    <>
      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">🍽️</span>
          <p className="text-white/40 text-sm font-medium">No recipes found.</p>
          <p className="text-white/20 text-xs mt-1">Try a different search or filter.</p>
        </div>
      ) : (
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
                  
                  // --- NEW: Passing data for the Author Chip ---
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