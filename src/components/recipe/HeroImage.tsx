'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface HeroImageProps {
  imageUrl?: string | null;
  emoji?: string;
  title: string;
  authorName?: string;
  isOfficial?: boolean;
  onClose: () => void;
}

export function HeroImage({
  imageUrl,
  emoji,
  title,
  authorName,
  isOfficial = false,
  onClose,
}: HeroImageProps) {
  const [imgError, setImgError] = useState(false);

  const finalSrc = useMemo(() => {
    if (!imageUrl) return null;

    // 1. Full external URLs (Spoonacular API or absolute links)
    if (imageUrl.startsWith('http')) return imageUrl;

    // 2. Spoonacular ID-based legacy images
    if (imageUrl.includes('-556x370') || /^\d+\./.test(imageUrl)) {
       return `https://spoonacular.com/recipeImages/${imageUrl}`;
    }

    // 3. Supabase Storage (Nested Folders)
    // We point to the bucket root. If imageUrl is "user_id/123.jpg", 
    // it appends perfectly. We also strip legacy "uploads/" prefixes.
    const bucketBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipe-photos/`;
    const cleanPath = imageUrl.replace(/^uploads\//, ''); 
    
    return `${bucketBase}${cleanPath}`;
  }, [imageUrl]);

  const showEmoji = !finalSrc || imgError;

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        {showEmoji ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full h-full flex items-center justify-center bg-foreground/[0.02]"
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: 'radial-gradient(circle at center, var(--primary) 0%, transparent 70%)',
              }}
            />
            <span className="text-8xl relative z-10 drop-shadow-2xl">
              {emoji ?? '🍳'}
            </span>
          </motion.div>
        ) : (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={finalSrc!}
            alt={title}
            onError={() => {
              console.warn(`Failed to load image: ${finalSrc}`);
              setImgError(true);
            }}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="absolute bottom-0 inset-x-0 p-8 flex flex-col justify-end">
        {isOfficial && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="self-start mb-3 px-3 py-1 rounded-full bg-primary text-[10px] font-black uppercase tracking-[0.2em] text-background shadow-lg shadow-primary/20"
          >
            ★ Official Recipe
          </motion.span>
        )}

        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight drop-shadow-sm">
          {title}
        </h1>

        {authorName && (
          <p className="text-foreground/50 text-sm mt-2 font-medium">
            Shared by <span className="text-primary font-bold">{authorName}</span>
          </p>
        )}
      </div>

      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-11 h-11 bg-background/80 backdrop-blur-xl rounded-full flex items-center justify-center text-foreground/40 hover:text-primary border border-border transition-all z-30 shadow-xl active:scale-90"
      >
        <X size={20} />
      </button>
    </div>
  );
}