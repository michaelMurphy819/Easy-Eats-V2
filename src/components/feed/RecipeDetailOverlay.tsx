'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/db/queries/client';
import { useState, useEffect, useCallback } from 'react';

import { ActionRow } from './ActionRow';
import { HeroImage } from '@/components/recipe/HeroImage';
import { RecipeMeta } from '@/components/recipe/RecipeMeta';
import { ScaleControls } from '@/components/recipe/ScaleControls';
import { IngredientsList, type Ingredient } from '@/components/recipe/IngredientsList';
import { CommentThread } from '@/components/recipe/CommentThread';

const supabase = createClient();

interface RecipeDetailProps {
  recipeId: string | null;
  onClose: () => void;
}

function parseSteps(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    return raw.split('|').map((s: string) => s.trim()).filter(Boolean);
  }
  return [];
}

export function RecipeDetailOverlay({ recipeId, onClose }: RecipeDetailProps) {
  const [recipe, setRecipe] = useState<any>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!recipeId || recipeId === 'new') {
      setRecipe(null);
      setIngredients([]);
      setScaleFactor(1);
      return;
    }

    setLoading(true);

    try {
      const [recipeRes, ingredientsRes] = await Promise.all([
        supabase.from('recipes').select('*').eq('id', recipeId).single(),
        supabase
          .from('ingredients')
          .select('*')
          .eq('recipe_id', recipeId)
          .order('id', { ascending: true }), 
      ]);

      if (recipeRes.error) throw new Error(recipeRes.error.message);

      const mappedIngredients = (ingredientsRes.data ?? []).map((ing: any) => ({
        id: ing.id,
        name: ing.name,           
        quantity: ing.quantity || parseFloat(ing.amount) || 0,     
        unit: ing.unit || '',
        order_index: ing.order_index ?? 0 
      }));

      setRecipe(recipeRes.data);
      setIngredients(mappedIngredients);
      setScaleFactor(1);
    } catch (err: any) {
      console.error('❌ RECIPE DETAIL ERROR:', err.message);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (recipeId && recipeId !== 'new') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [recipeId]);

  const steps = parseSteps(recipe?.steps);

  return (
    <AnimatePresence mode="wait">
      {recipeId && recipeId !== 'new' && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          <motion.div
            layoutId={`recipe-card-${recipeId}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="
              fixed inset-x-0 bottom-0 top-[5vh]
              bg-background rounded-t-[36px]
              z-[110] border-t border-border
              overflow-hidden flex flex-col
              md:inset-x-auto md:left-1/2 md:-translate-x-1/2
              md:max-w-2xl md:w-full md:rounded-[28px] md:bottom-[5vh]
            "
          >
            <div className="relative w-full h-[40vh] flex-shrink-0">
              <HeroImage
                imageUrl={recipe?.image_url}
                emoji={recipe?.emoji}
                title={recipe?.title ?? 'Loading...'}
                authorName={recipe?.author_name}
                isOfficial={recipe?.is_official}
                onClose={onClose}
              />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="px-7 py-8 space-y-10">
                <div className="flex items-start justify-between gap-4">
                  <RecipeMeta
                    timeEstimate={recipe?.time_estimate}
                    costEstimate={recipe?.cost_estimate}
                    skillLevel={recipe?.difficulty || recipe?.skill_level}
                  />
                  <ActionRow recipeId={recipeId} variant="detail" />
                </div>

                {recipe && (
                  <ScaleControls
                    baseServings={recipe.base_servings ?? 2}
                    onChange={setScaleFactor}
                  />
                )}

                <section className="space-y-4">
                  <SectionHeading>Ingredients</SectionHeading>
                  <IngredientsList
                    ingredients={ingredients}
                    scaleFactor={scaleFactor}
                    loading={loading}
                  />
                </section>

                <section className="space-y-5">
                  <SectionHeading>Instructions</SectionHeading>
                  <div className="space-y-6">
                    {steps.length > 0 ? (
                      steps.map((step, i) => (
                        <div key={i} className="flex gap-5 items-start group">
                          <span className="mt-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[11px] font-black text-background flex-shrink-0 shadow-sm shadow-primary/20">
                            {i + 1}
                          </span>
                          <p className="text-foreground/80 text-sm leading-relaxed flex-1 font-medium italic sm:not-italic">
                            {step}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-foreground/20 text-sm italic py-4">No steps provided.</p>
                    )}
                  </div>
                </section>

                <section className="pt-10 border-t border-border">
                  <SectionHeading icon={<MessageSquare size={16} />}>
                    Kitchen Talk
                  </SectionHeading>
                  <CommentThread recipeId={recipeId} />
                </section>

                <div className="h-12" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SectionHeading({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode; }) {
  return (
    <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2.5">
      {icon && <span className="text-primary">{icon}</span>}
      {children}
    </h2>
  );
}