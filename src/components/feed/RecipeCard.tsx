'use client';
import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, Heart, Bookmark } from 'lucide-react'; // <-- Swapped Plus for Bookmark
import { createClient } from '@/lib/db/queries/client'; 
import { AuthorChip } from '@/components/feed/AuthorChip'; 
import Image from 'next/image';

interface RecipeCardProps {
  recipeId: string;
  title: string;
  author: string;
  authorUsername?: string; 
  authorAvatar?: string;   
  time: string | number;
  cost: string;
  emoji: string;
  skillLevel: string;
  imageUrl?: string;
  likes?: number; 
  currentUserId?: string | null; 
  onOpen: (id: string) => void;
}

export function RecipeCard({ 
  recipeId, 
  title, 
  author, 
  authorUsername, 
  authorAvatar, 
  time, 
  emoji, 
  skillLevel, 
  cost, 
  imageUrl, 
  likes = 0, 
  currentUserId, 
  onOpen 
}: RecipeCardProps) {
  const [supabase] = useState(() => createClient());
  
  const [imgError, setImgError] = useState(false);
  
  // States for Likes & Saves
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [isSaved, setIsSaved] = useState(false); // <-- NEW: Save state

  // --- Check if the user liked OR saved this recipe ---
  useEffect(() => {
    async function checkInteractions() {
      if (!currentUserId) return;

      // Using Promise.all to fetch both statuses at the exact same time!
      const [likeRes, saveRes] = await Promise.all([
        supabase.from('likes').select('id').eq('recipe_id', recipeId).eq('user_id', currentUserId).maybeSingle(),
        supabase.from('recipe_saves').select('id').eq('recipe_id', recipeId).eq('user_id', currentUserId).maybeSingle()
      ]);

      if (likeRes.data) setIsLiked(true);
      if (saveRes.data) setIsSaved(true); // Set save state if found
    }
    checkInteractions();
  }, [recipeId, currentUserId]); 

  // --- Handle Like ---
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!currentUserId) return; 

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : Math.max(0, prev - 1));

    if (newIsLiked) {
      await supabase.from('likes').insert({ recipe_id: recipeId, user_id: currentUserId });
    } else {
      await supabase.from('likes').delete().eq('recipe_id', recipeId).eq('user_id', currentUserId);
    }
  };

  // --- NEW: Handle Save/Bookmark ---
  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!currentUserId) {
      console.log("Please log in to save recipes!");
      return; 
    }

    // Optimistic UI update
    const newIsSaved = !isSaved;
    setIsSaved(newIsSaved);

    // Database update
    if (newIsSaved) {
      await supabase.from('recipe_saves').insert({ recipe_id: recipeId, user_id: currentUserId });
    } else {
      await supabase.from('recipe_saves').delete().eq('recipe_id', recipeId).eq('user_id', currentUserId);
    }
  };

  // ─── Image Path Logic ───
  const finalSrc = useMemo(() => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.includes('-556x370') || /^\d+\./.test(imageUrl)) {
       return `https://spoonacular.com/recipeImages/${imageUrl}`;
    }
    const bucketBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipe-photos/`;
    const cleanPath = imageUrl.replace(/^uploads\//, ''); 
    return `${bucketBase}${cleanPath}`;
  }, [imageUrl]);

  const showEmoji = !finalSrc || imgError;

  return (
    <motion.div 
      layoutId={`recipe-card-${recipeId}`}
      onClick={() => onOpen(recipeId)}
      className="group relative bg-background rounded-[32px] overflow-hidden border border-border hover:shadow-xl transition-all cursor-pointer w-full"
    >
      {/* ── Visual Area ── */}
      <div className="relative w-full bg-border/20 flex items-center justify-center overflow-hidden min-h-[300px] max-h-[70vh]">
        {showEmoji ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <span className="text-7xl filter drop-shadow-xl group-hover:scale-110 transition-transform duration-500 select-none">
              {emoji}
            </span>
          </div>
        ) : (
  <div className="relative w-full h-full min-h-[300px] max-h-[70vh]">
    <Image 
      src={finalSrc!} 
      alt={title} 
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="object-cover group-hover:scale-[1.03] transition-transform duration-1000 ease-out" 
      onError={() => {
        console.warn(`Card failed to load image: ${finalSrc}`);
        setImgError(true);
      }} 
    />
  </div>
)}
        
        {/* Floating Badge */}
        <div className="absolute top-6 left-6 z-10">
          <span className="px-3 py-1 bg-background/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-foreground/80 border border-border shadow-sm">
            {skillLevel}
          </span>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="p-8 space-y-6">
        <div>
          <h3 className="font-serif text-3xl font-bold text-foreground tracking-tight leading-tight line-clamp-2">
            {title}
          </h3>
          
          <div className="mt-4">
            <AuthorChip 
              username={authorUsername || author.replace(/\s+/g, '').toLowerCase()} 
              displayName={author}
              avatarUrl={authorAvatar}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-border/50">
          <div className="flex gap-5 text-foreground/60 text-sm font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <Clock size={18} className="text-primary" /> {time}m
            </span>
            <span className="flex items-center gap-2">
              <DollarSign size={18} className="text-primary" /> {cost}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
                isLiked ? 'text-red-500' : 'text-foreground/40 hover:text-red-500'
              }`}
            >
              <Heart size={22} className={isLiked ? "fill-current" : ""} />
              <span className="text-sm font-bold">{likeCount > 0 ? likeCount : ''}</span>
            </motion.button>

            {/* --- NEW: Bookmark/Save Button --- */}
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSave}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md border ${
                isSaved 
                  ? 'bg-foreground text-background border-foreground' 
                  : 'bg-border/30 text-foreground hover:bg-foreground hover:text-background border-transparent'
              }`}
            >
              <Bookmark size={20} className={isSaved ? "fill-current" : ""} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}