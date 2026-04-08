'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchRecipeById, deleteRecipe } from '@/lib/db/queries/recipes';
import { useScaleRecipe } from '@/hooks/useScaleRecipe';
import { StepByStep } from '@/components/recipe/StepByStep';
import { UploadMeal } from '@/components/upload/UploadMeal';
import { Recipe, Ingredient } from '@/types';
import { ChevronLeft, Heart, Trash2, Edit3 } from 'lucide-react';
import { createClient } from '@/lib/db/queries/client';

const supabase = createClient();

export default function RecipePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const { scale, adjustScale, getScaledQuantity } = useScaleRecipe(2);

  useEffect(() => {
    if (!id || id === 'new') {
      setIsInitialLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchRecipeById(id);
        if (!data) {
          setError("Recipe not found");
        } else {
          setRecipe(data);
          setLikeCount(data.likes || 0);
          
          // Check Ownership
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.id === data.author_id) {
            setIsOwner(true);
          }
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Unable to connect to the kitchen.");
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Check Like Status
  useEffect(() => {
    async function checkLikeStatus() {
      if (!recipe) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('recipe_id', recipe.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) setIsLiked(true);
    }
    checkLikeStatus();
  }, [recipe]);

  const handleLike = async () => {
    if (!recipe) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : Math.max(0, prev - 1));

    if (newIsLiked) {
      await supabase.from('likes').insert({ recipe_id: recipe.id, user_id: user.id });
    } else {
      await supabase.from('likes').delete().eq('recipe_id', recipe.id).eq('user_id', user.id);
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;
    const confirmDelete = confirm("Are you sure you want to delete this recipe? This cannot be undone.");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('recipes').delete().eq('id', recipe.id);
      if (error) throw error;
      router.push('/profile/me');
    } catch (err) {
      alert("Error deleting recipe.");
    }
  };

  if (id === 'new') return null;
  if (error) return <div className="p-20 text-center">{error}</div>;
  if (isInitialLoading || !recipe) return <div className="p-20 text-center animate-pulse">Loading...</div>;

  return (
    <div className="bg-background min-h-screen pb-24 text-foreground">
      <div className="fixed top-6 left-6 z-50 flex gap-2">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-background/80 backdrop-blur-xl border border-border rounded-full text-foreground hover:scale-110 active:scale-95 shadow-sm transition-all"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Owner Actions */}
      {isOwner && (
        <div className="fixed top-6 right-6 z-50 flex gap-2">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-background/80 backdrop-blur-xl border border-border rounded-full text-[10px] font-black uppercase tracking-widest hover:text-primary transition-all shadow-sm"
          >
            <Edit3 size={14} /> Edit
          </button>
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-3 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      <div className="h-[40vh] min-h-[320px] bg-border/10 flex items-center justify-center text-[100px] overflow-hidden relative">
        {recipe.image_url ? (
          <img 
            src={recipe.image_url.startsWith('http') ? recipe.image_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipe-photos/${recipe.image_url}`} 
            alt={recipe.title} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <span className="drop-shadow-2xl">{recipe.emoji}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-100" />
      </div>

      <div className="px-6 max-w-2xl mx-auto -mt-16 relative z-10">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div className="flex-1">
            <div className="flex gap-2 mb-3">
              <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
                {recipe.difficulty || 'Beginner'}
              </span>
            </div>
            <h1 className="font-serif text-5xl font-bold tracking-tight leading-tight">{recipe.title}</h1>
            <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-2">{likeCount} Likes</p>
          </div>
          
          <button 
            onClick={handleLike}
            className={`p-5 rounded-full border transition-all active:scale-90 shadow-xl backdrop-blur-md ${
              isLiked ? 'bg-red-500 border-red-500 text-white' : 'bg-background border-border text-foreground'
            }`}
          >
            <Heart size={26} className={isLiked ? "fill-current" : ""} />
          </button>
        </div>

        {/* Existing Scaler & Ingredients UI... */}
        <div className="bg-card border border-border rounded-[32px] p-8 my-10 shadow-sm text-white">
          <p className="text-[10px] opacity-60 uppercase tracking-[0.25em] font-black mb-6">Adjust Servings</p>
          <div className="flex items-center gap-10">
            <button onClick={() => adjustScale(-1)} className="w-14 h-14 rounded-full bg-white/10 text-2xl">−</button>
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black">{scale}</span>
              <span className="text-[10px] uppercase opacity-60 font-bold">People</span>
            </div>
            <button onClick={() => adjustScale(1)} className="w-14 h-14 rounded-full bg-white/10 text-2xl">＋</button>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-[11px] font-black opacity-40 uppercase tracking-[0.2em] mb-6 border-b border-border pb-3">Ingredients</h2>
          {recipe.ingredients.map((ing, i) => (
            <div key={i} className="flex justify-between items-center py-5 border-b border-border/50">
              <span className="font-medium">{ing.name}</span>
              <div className="text-right">
                <span className="text-primary font-black text-lg">{Math.round(getScaledQuantity(ing.quantity) * 100) / 100}</span>
                <span className="opacity-40 text-[10px] uppercase font-black ml-2">{ing.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <StepByStep steps={recipe.steps} />
      </div>

      <UploadMeal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        initialRecipe={recipe}
        onRefresh={() => window.location.reload()}
      />
    </div>
  );
}