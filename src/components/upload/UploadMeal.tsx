'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react'; 
import { createClient } from '@/lib/db/queries/client';

import { PhotoDropzone } from './PhotoDropzone';
import { IngredientBuilder } from './IngredientBuilder';
import { StepBuilder } from './StepBuilder';
import { TagSelector } from './TagSelector';

interface Ingredient {
  id: string;
  item: string;
  amount: string;
}

export function UploadMeal({ isOpen, onClose, onRefresh }: { isOpen: boolean, onClose: () => void, onRefresh?: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '', 
    emoji: '🍳', 
    time_estimate: 20,
    skill_level: 'Beginner', 
    cost_estimate: '$$',
    base_servings: 2,
    ingredients: [] as Ingredient[],
    steps: [''], 
    tags: [] as string[],
  });

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageSelect = (file: File) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const adjustServings = (delta: number) => {
    setFormData(prev => ({
      ...prev,
      base_servings: Math.max(1, Math.min(20, prev.base_servings + delta))
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (loading) return;
  setLoading(true);

  try {
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth.user) throw new Error("Please log in to share recipes.");

    let dbImageValue = null;
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${auth.user.id}/${Date.now()}.${fileExt}`;
      const { error: upErr } = await supabase.storage.from('recipe-photos').upload(fileName, imageFile);
      if (upErr) throw new Error("Image upload failed");
      dbImageValue = fileName;
    }

    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .insert([{
        title: formData.title, 
        emoji: formData.emoji,
        time_estimate: formData.time_estimate, 
        difficulty: formData.skill_level, 
        base_servings: formData.base_servings,
        author_id: auth.user.id, 
        image_url: dbImageValue,
        steps: formData.steps.filter(s => s.trim() !== ''),
        tags: formData.tags,
      }])
      .select().single();

    if (recipeError) throw recipeError;

    const validIngredients = formData.ingredients.filter(i => i.item.trim() !== '');

    if (validIngredients.length > 0) {
      const ingredientsToInsert = validIngredients.map((i) => {
        const match = i.amount.trim().match(/^([\d\/\.\s\-]+)?(.*)$/);
        const rawQty = match?.[1]?.trim() || "1";
        const unit = match?.[2]?.trim() || "unit"; // Default to "unit" instead of empty string
        
        const parseQty = (str: string) => {
          try {
            if (str.includes('/')) {
              const parts = str.split(' ');
              if (parts.length > 1) return parseFloat(parts[0]) + (eval(parts[1]));
              return eval(str);
            }
            return parseFloat(str);
          } catch { return 1; }
        };

        return {
          recipe_id: recipeData.id,
          name: i.item,
          amount: i.amount, 
          quantity: parseQty(rawQty) || 1,
          unit: unit,
        };
      });

      const { error: ingError } = await supabase.from('ingredients').insert(ingredientsToInsert);
      if (ingError) {
        await supabase.from('recipes').delete().eq('id', recipeData.id);
        throw ingError;
      }

      // CALLING THE MACRO API
      try {
        const macroRes = await fetch('/api/macros/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ingredients: ingredientsToInsert.map(ing => ({
              name: ing.name,
              amount: ing.quantity.toString(),
              unit: ing.unit || "unit" // Ensure the API always gets a unit string
            })) 
          }),
        });

        if (macroRes.ok) {
          const nutrition = await macroRes.json();
          
          // Check if we actually got data back (not all zeros)
          if (nutrition.calories > 0) {
            await supabase
              .from('recipes')
              .update({ nutrition })
              .eq('id', recipeData.id);
          } else {
            console.warn('[macros] API returned 0 calories. Check ingredient names or units.');
          }
        }
      } catch (macroErr) {
        console.warn('[macros] Macro calculation failed:', macroErr);
      }
    }

    onRefresh?.(); 
    onClose?.();   
  } catch (error: any) {
    console.error("Upload Error:", error);
    alert(error?.message || "Upload failed.");
  } finally {
    setLoading(false);
  }
};

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]" 
          />
          <motion.div 
            initial={{ y: '100%' }} 
            animate={{ y: 0 }} 
            exit={{ y: '100%' }} 
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 h-[94vh] bg-background rounded-t-[40px] z-[70] p-8 border-t border-border overflow-y-auto no-scrollbar shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-10 pb-20">
              <div className="flex justify-between items-center sticky top-0 bg-background/90 backdrop-blur-md z-20 py-2">
                <h2 className="font-serif text-3xl font-bold text-foreground">New Recipe</h2>
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="p-2.5 bg-foreground/[0.05] rounded-full text-foreground/50 hover:text-foreground hover:bg-foreground/[0.1] transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <PhotoDropzone 
                imagePreview={imagePreview} 
                onImageSelect={handleImageSelect} 
                onClear={() => { setImageFile(null); setImagePreview(null); }} 
              />

              <div className="space-y-8">
                <div className="flex gap-4 items-end">
                  <input 
                    value={formData.emoji} 
                    onChange={(e) => setFormData({...formData, emoji: e.target.value})} 
                    className="w-20 h-20 bg-foreground/[0.03] rounded-3xl text-4xl text-center border border-border outline-none focus:border-primary/50 transition-all" 
                    maxLength={2} 
                  />
                  <div className="flex-1 space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 pl-1">Recipe Title</label>
                     <input 
                      required 
                      placeholder="What are we cooking?"
                      value={formData.title} 
                      className="w-full bg-transparent border-b-2 border-border text-2xl font-serif text-foreground outline-none focus:border-primary pb-2 transition-colors placeholder:text-foreground/10" 
                      onChange={(e) => setFormData({...formData, title: e.target.value})} 
                     />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 pl-1">
                      Standard Yield
                    </label>
                    <div className="flex items-center justify-between bg-foreground/[0.03] p-2 rounded-2xl border border-border">
                      <button 
                        type="button"
                        onClick={() => adjustServings(-1)}
                        className="w-12 h-12 flex items-center justify-center bg-background rounded-xl border border-border text-foreground/40 hover:text-primary hover:border-primary transition-all active:scale-90"
                      >
                        <Minus size={18} />
                      </button>
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-primary leading-none">
                          {formData.base_servings}
                        </span>
                        <span className="text-[8px] font-bold uppercase text-foreground/30 tracking-tighter">Servings</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => adjustServings(1)}
                        className="w-12 h-12 flex items-center justify-center bg-background rounded-xl border border-border text-foreground/40 hover:text-primary hover:border-primary transition-all active:scale-90"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 pl-1">
                      Prep Time (mins)
                    </label>
                    <input 
                      type="number"
                      value={formData.time_estimate}
                      onChange={(e) => setFormData({...formData, time_estimate: parseInt(e.target.value) || 0})}
                      className="w-full h-[64px] bg-foreground/[0.03] px-6 rounded-2xl border border-border font-bold text-xl text-foreground focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <TagSelector 
                selectedTags={formData.tags} 
                onToggle={(tag) => setFormData(prev => ({ 
                  ...prev, 
                  tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag] 
                }))} 
              />

              <div className="h-px bg-border w-full opacity-50" />
              
              <IngredientBuilder 
                ingredients={formData.ingredients} 
                setIngredients={(ingredients) => setFormData({...formData, ingredients})} 
              />

              <div className="h-px bg-border w-full opacity-50" />
              
              <StepBuilder 
                steps={formData.steps} 
                setSteps={(steps) => setFormData({...formData, steps})} 
              />

              <div className="sticky bottom-0 pt-6 pb-2 bg-gradient-to-t from-background via-background to-transparent z-10">
                <button 
                  disabled={loading} 
                  type="submit" 
                  className="w-full py-5 bg-primary text-background font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding to Kitchen...' : 'Post Recipe'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}