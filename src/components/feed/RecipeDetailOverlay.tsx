'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, Edit3 } from 'lucide-react';
import { createClient } from '@/lib/db/queries/client';
import { useState, useEffect, useCallback } from 'react';

import { ActionRow } from './ActionRow';
import { HeroImage } from '@/components/recipe/HeroImage';
import { RecipeMeta } from '@/components/recipe/RecipeMeta';
import { ScaleControls } from '@/components/recipe/ScaleControls';
import { IngredientsList, type Ingredient } from '@/components/recipe/IngredientsList';
import { CommentThread } from '@/components/recipe/CommentThread';
import { UploadMeal } from '@/components/upload/UploadMeal';

const supabase = createClient();

interface RecipeDetailProps {
  recipeId: string | null;
  onClose: () => void;
}

// ─── UTILS ───
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
  const [isOwner, setIsOwner] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ─── DATA FETCHING ───
  const fetchData = useCallback(async () => {
    // If ID is null or "new", we don't fetch, but we clear the owner state
    if (!recipeId || recipeId === 'new') {
      setRecipe(null);
      setIsOwner(false);
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const [recipeRes, ingredientsRes] = await Promise.all([
        supabase.from('recipes').select('*').eq('id', recipeId).single(),
        supabase
          .from('ingredients')
          .select('*')
          .eq('recipe_id', recipeId)
          .order('id', { ascending: true }), 
      ]);

      if (recipeRes.error) throw new Error(recipeRes.error.message);

      // Set ownership
      setIsOwner(user?.id === recipeRes.data.author_id);

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

  // ─── ACTIONS ───
  const handleDelete = async () => {
    if (!recipeId) return;
    const confirmDelete = confirm("Are you sure you want to delete this recipe?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
      if (error) throw error;
      onClose();
      window.location.reload(); 
    } catch (err) {
      alert("Failed to delete recipe.");
    }
  };

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
      {/* CRITICAL FIX: We use a unique string key that is never empty.
        If recipeId is null, this branch won't render. 
      */}
      {recipeId && recipeId !== 'new' && (
        <div key={`wrapper-${recipeId}`}>
          <motion.div
            key={`backdrop-${recipeId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          <motion.div
            key={`content-${recipeId}`}
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
            {/* Action Bar for Owners */}
            {isOwner && (
              <div className="absolute top-6 right-16 z-[120] flex gap-2">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-xl border border-border rounded-full text-[10px] font-black uppercase tracking-widest hover:text-primary transition-all shadow-xl"
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}

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
                        <div key={`step-${recipeId}-${i}`} className="flex gap-5 items-start group">
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
        </div>
      )}

      {/* EDIT MODAL 
        We pass the original recipe data plus the mapped ingredients
      */}
      <UploadMeal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        initialRecipe={{
          ...recipe, 
          ingredients: ingredients.map(ing => ({
            id: ing.id, 
            item: ing.name, 
            amount: `${ing.quantity} ${ing.unit}`.trim()
          }))
        }} 
        onRefresh={() => { fetchData(); setIsEditModalOpen(false); }} 
      />
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