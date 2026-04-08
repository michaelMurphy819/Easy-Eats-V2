'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, Bookmark, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/db/queries/client';

interface ActionRowProps {
  recipeId: string;
  /** Layout variant: 'card' for the feed card, 'detail' for the overlay */
  variant?: 'card' | 'detail';
}

interface Counts {
  likes: number;
  saves: number;
}

export function ActionRow({ recipeId, variant = 'card' }: ActionRowProps) {
  const [supabase] = useState(() => createClient());
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [counts, setCounts] = useState<Counts>({ likes: 0, saves: 0 });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    };
    getSession();
  }, []);

  const hydrate = useCallback(async () => {
    if (!recipeId) return;

    const [{ count: likeCount }, { count: saveCount }] = await Promise.all([
      supabase
        .from('recipe_likes')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipeId),
      supabase
        .from('recipe_saves')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipeId),
    ]);

    setCounts({
      likes: likeCount ?? 0,
      saves: saveCount ?? 0,
    });

    if (!userId) return;

    const [{ data: likeRow }, { data: saveRow }] = await Promise.all([
      supabase
        .from('recipe_likes')
        .select('id')
        .eq('recipe_id', recipeId)
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('recipe_saves')
        .select('id')
        .eq('recipe_id', recipeId)
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    setLiked(!!likeRow);
    setSaved(!!saveRow);
  }, [recipeId, userId]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;

    const wasLiked = liked;
    setLiked(!wasLiked);
    setCounts((c) => ({ ...c, likes: c.likes + (wasLiked ? -1 : 1) }));

    if (wasLiked) {
      await supabase.from('recipe_likes').delete().eq('recipe_id', recipeId).eq('user_id', userId);
    } else {
      await supabase.from('recipe_likes').insert({ recipe_id: recipeId, user_id: userId });
    }
  };

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;

    const wasSaved = saved;
    setSaved(!wasSaved);
    setCounts((c) => ({ ...c, saves: c.saves + (wasSaved ? -1 : 1) }));

    if (wasSaved) {
      await supabase.from('recipe_saves').delete().eq('recipe_id', recipeId).eq('user_id', userId);
    } else {
      await supabase.from('recipe_saves').insert({ recipe_id: recipeId, user_id: userId });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/recipe/${recipeId}`;
    if (navigator.share) {
      await navigator.share({ title: 'Check out this recipe on Easy Eats.', url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const isDetail = variant === 'detail';

  return (
    <div
      className={`flex items-center gap-${isDetail ? '6' : '4'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Like */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={toggleLike}
        className="flex items-center gap-1.5 group"
        aria-label={liked ? 'Unlike recipe' : 'Like recipe'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={liked ? 'liked' : 'unliked'}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Heart
              size={isDetail ? 22 : 18}
              className={`transition-colors ${
                liked
                  ? 'text-primary fill-primary'
                  : 'text-foreground/40 group-hover:text-foreground/70'
              }`}
            />
          </motion.div>
        </AnimatePresence>
        <span
          className={`text-xs font-bold tabular-nums transition-colors ${
            liked ? 'text-primary' : 'text-foreground/30'
          }`}
        >
          {counts.likes > 0 ? counts.likes : ''}
        </span>
      </motion.button>

      {/* Save */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={toggleSave}
        className="flex items-center gap-1.5 group"
        aria-label={saved ? 'Remove from collection' : 'Save to collection'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={saved ? 'saved' : 'unsaved'}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Bookmark
              size={isDetail ? 22 : 18}
              className={`transition-colors ${
                saved
                  ? 'text-primary fill-primary'
                  : 'text-foreground/40 group-hover:text-foreground/70'
              }`}
            />
          </motion.div>
        </AnimatePresence>
        <span
          className={`text-xs font-bold tabular-nums transition-colors ${
            saved ? 'text-primary' : 'text-foreground/30'
          }`}
        >
          {counts.saves > 0 ? counts.saves : ''}
        </span>
      </motion.button>

      {/* Share */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handleShare}
        className="group"
        aria-label="Share recipe"
      >
        <Share2
          size={isDetail ? 22 : 18}
          className="text-foreground/40 group-hover:text-foreground/70 transition-colors"
        />
      </motion.button>
    </div>
  );
}