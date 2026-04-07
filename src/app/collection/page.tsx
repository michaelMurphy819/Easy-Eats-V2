'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, ChefHat } from 'lucide-react';
import { RecipeCard } from '@/components/feed/RecipeCard';
import { RecipeDetailOverlay } from '@/components/feed/RecipeDetailOverlay';
import { createClient } from '@/lib/db/queries/client';

const supabase = createClient();
const BUCKET_URL = "https://mnakswmhlreuclyultdc.supabase.co/storage/v1/object/public/recipe-photos/";

// ... interfaces stay the same ...

export default function CollectionPage() {
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const fetchSavedRecipes = useCallback(async () => {
    // Note: Don't set loading(true) on every refresh or the screen will flicker
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('recipe_saves')
      .select(`
        id,
        recipe_id,
        recipes:recipe_id (
          id, title, emoji, time_estimate, cost_estimate, difficulty, image_url, author_name,
          profiles:author_id (display_name, username)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setSavedRecipes(data || []);
    setLoading(false);
  }, []);

  // 1. Initial Fetch
  useEffect(() => {
    fetchSavedRecipes();
  }, [fetchSavedRecipes]);

  // 2. REALTIME FIX: Listen for saves/unsaves while the page is open
  useEffect(() => {
    const channel = supabase
      .channel('collection-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recipe_saves' },
        () => fetchSavedRecipes() // Re-fetch data whenever the save table changes
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSavedRecipes]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-background pb-24 pt-12 px-4">
      {/* Header Section - Fixed text-black to text-foreground */}
      <div className="max-w-[600px] mx-auto mb-12 space-y-2">
        <div className="flex items-center gap-3 text-primary">
          <Bookmark size={24} fill="currentColor" />
          <h1 className="font-serif text-4xl font-bold text-foreground tracking-tight">
            Your Collection
          </h1>
        </div>
        <p className="text-foreground/40 font-medium">
          Recipes you've saved to cook later
        </p>
      </div>

      <div className="max-w-[600px] mx-auto flex flex-col gap-14">
        {savedRecipes.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {savedRecipes.map(({ recipes: recipe }) => {
              if (!recipe) return null; // Safety check
              
              const fullImageUrl = recipe.image_url 
                ? (recipe.image_url.startsWith('http') 
                    ? recipe.image_url 
                    : `${BUCKET_URL}${recipe.image_url.trim()}`)
                : undefined;

              return (
                <motion.div
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <RecipeCard 
                    recipeId={recipe.id}
                    title={recipe.title}
                    author={recipe.profiles?.display_name ?? recipe.author_name ?? "Chef"}
                    time={recipe.time_estimate}
                    cost={recipe.cost_estimate}
                    emoji={recipe.emoji}
                    skillLevel={recipe.difficulty}
                    imageUrl={fullImageUrl}
                    onOpen={setSelectedRecipeId}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            {/* Fixed bg-black/5 to bg-foreground/5 */}
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/20">
              <ChefHat size={32} />
            </div>
            <p className="text-foreground/30 font-medium">
              Your collection is empty.<br/>Go explore some meals!
            </p>
          </div>
        )}
      </div>

      <RecipeDetailOverlay 
        recipeId={selectedRecipeId} 
        onClose={() => setSelectedRecipeId(null)} 
      />
    </main>
  );
}