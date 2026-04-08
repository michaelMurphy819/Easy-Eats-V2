'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react'; 
import { createClient } from '@/lib/db/queries/client';

import { PhotoDropzone } from './PhotoDropzone';
import { IngredientBuilder } from './IngredientBuilder';
import { StepBuilder } from './StepBuilder';
import { TagSelector } from './TagSelector';

const supabase = createClient();

interface Ingredient {
  id: string;
  item: string;
  amount: string;
}

interface UploadMealProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  initialRecipe?: any;
}

export function UploadMeal({ isOpen, onClose, onRefresh, initialRecipe }: UploadMealProps) {
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

  useEffect(() => {
    setMounted(true);
    if (initialRecipe && isOpen) {
      setFormData({
        title: initialRecipe.title || '',
        emoji: initialRecipe.emoji || '🍳',
        time_estimate: initialRecipe.time_estimate || 20,
        skill_level: initialRecipe.difficulty || 'Beginner',
        cost_estimate: initialRecipe.cost_estimate || '$$',
        base_servings: initialRecipe.base_servings || 2,
        ingredients: initialRecipe.ingredients?.map((ing: any) => ({
          id: ing.id || Math.random().toString(),
          item: ing.item || ing.name || '', 
          amount: ing.amount || ''
        })) || [],
        steps: initialRecipe.steps || [''],
        tags: initialRecipe.tags || [],
      });
      if (initialRecipe.image_url) {
        const url = initialRecipe.image_url.startsWith('http') 
          ? initialRecipe.image_url 
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipe-photos/${initialRecipe.image_url}`;
        setImagePreview(url);
      }
    } else if (!isOpen) {
      setFormData({ title: '', emoji: '🍳', time_estimate: 20, skill_level: 'Beginner', cost_estimate: '$$', base_servings: 2, ingredients: [], steps: [''], tags: [] });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [initialRecipe, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) throw new Error("Please log in.");

      let dbImageValue = initialRecipe?.image_url || null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${auth.user.id}/${Date.now()}.${fileExt}`;
        await supabase.storage.from('recipe-photos').upload(fileName, imageFile);
        dbImageValue = fileName;
      }

      const recipePayload = {
        title: formData.title, 
        emoji: formData.emoji,
        time_estimate: formData.time_estimate, 
        difficulty: formData.skill_level, 
        base_servings: formData.base_servings,
        author_id: auth.user.id, 
        image_url: dbImageValue,
        steps: formData.steps.filter(s => s.trim() !== ''),
        tags: formData.tags,
      };

      let recipeId = initialRecipe?.id;

      if (initialRecipe) {
        await supabase.from('recipes').update(recipePayload).eq('id', recipeId);
        await supabase.from('ingredients').delete().eq('recipe_id', recipeId);
      } else {
        const { data, error } = await supabase.from('recipes').insert([recipePayload]).select().single();
        if (error) throw error;
        recipeId = data.id;
      }

      const validIngredients = formData.ingredients.filter(i => i.item.trim() !== '');
      if (validIngredients.length > 0) {
        const ingredientsToInsert = validIngredients.map((i) => ({
          recipe_id: recipeId,
          name: i.item,
          amount: i.amount,
          quantity: 1, 
          unit: 'unit',
        }));
        await supabase.from('ingredients').insert(ingredientsToInsert);
      }

      onRefresh?.(); 
      onClose?.();   
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]" />
          <motion.div key="modal-content" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 inset-x-0 h-[94vh] bg-background rounded-t-[40px] z-[210] p-8 overflow-y-auto no-scrollbar shadow-2xl">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-10 pb-20">
              <div className="flex justify-between items-center sticky top-0 bg-background/90 py-2 z-10">
                <h2 className="font-serif text-3xl font-bold">{initialRecipe ? 'Edit Recipe' : 'New Recipe'}</h2>
                <button type="button" onClick={onClose} className="p-2.5 bg-foreground/5 rounded-full"><X size={20} /></button>
              </div>

              <PhotoDropzone imagePreview={imagePreview} onImageSelect={(file) => { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }} onClear={() => { setImageFile(null); setImagePreview(null); }} />

              <div className="space-y-8">
                <div className="flex gap-4 items-end">
                  <input value={formData.emoji} onChange={(e) => setFormData({...formData, emoji: e.target.value})} className="w-20 h-20 bg-foreground/5 rounded-3xl text-4xl text-center outline-none border border-border" maxLength={2} />
                  <div className="flex-1">
                     <label className="text-[10px] font-black uppercase opacity-30">Recipe Title</label>
                     <input required placeholder="What are we cooking?" value={formData.title} className="w-full bg-transparent border-b-2 border-border text-2xl font-serif outline-none focus:border-primary pb-2" onChange={(e) => setFormData({...formData, title: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase opacity-30">Yield</label>
                    <div className="flex items-center justify-between bg-foreground/5 p-2 rounded-2xl border border-border">
                      <button type="button" onClick={() => setFormData(p => ({...p, base_servings: Math.max(1, p.base_servings-1)}))} className="w-12 h-12 bg-background rounded-xl border border-border"><Minus size={18} /></button>
                      <span className="text-2xl font-black text-primary">{formData.base_servings}</span>
                      <button type="button" onClick={() => setFormData(p => ({...p, base_servings: p.base_servings+1}))} className="w-12 h-12 bg-background rounded-xl border border-border"><Plus size={18} /></button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase opacity-30">Time (mins)</label>
                    <input type="number" value={formData.time_estimate} onChange={(e) => setFormData({...formData, time_estimate: parseInt(e.target.value) || 0})} className="w-full h-[64px] bg-foreground/5 px-6 rounded-2xl border border-border font-bold text-xl outline-none" />
                  </div>
                </div>
              </div>

              <TagSelector selectedTags={formData.tags} onToggle={(tag) => setFormData(prev => ({ ...prev, tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag] }))} />
              <IngredientBuilder ingredients={formData.ingredients} setIngredients={(ings) => setFormData({...formData, ingredients: ings})} />
              <StepBuilder steps={formData.steps} setSteps={(steps) => setFormData({...formData, steps})} />

              <div className="sticky bottom-0 pt-6 bg-background">
                <button disabled={loading} type="submit" className="w-full py-5 bg-primary text-background font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all">
                  {loading ? 'Saving...' : initialRecipe ? 'Update Recipe' : 'Post Recipe'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}