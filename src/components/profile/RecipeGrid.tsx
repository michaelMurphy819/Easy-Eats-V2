'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

export function RecipeGrid({ recipes, onOpen }: { recipes: any[], onOpen: (id: string) => void }) {
  
  // Helper to build the full URL
  const getFullImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path; 
    
    // Replace 'YOUR_BUCKET_NAME' with your actual Supabase storage bucket name!
    return `https://mnakswmhlreuclyultdc.supabase.co/storage/v1/object/public/recipe-photos/${path}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {recipes.map((recipe) => (
        <motion.div
          key={recipe.id}
          whileHover={{ y: -5 }}
          onClick={() => onOpen(recipe.id)}
          className="aspect-square bg-background rounded-[24px] overflow-hidden border border-border cursor-pointer group relative shadow-sm hover:shadow-md transition-all"
        >
          {recipe.image_url ? (
            <Image 
              src={getFullImageUrl(recipe.image_url)}
              alt={recipe.title} 
              fill
              // Mobile: 2 columns (~50vw), Tablet/Desktop: 3 columns (~33vw)
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              // Add loading="lazy" (default) or priority for the first few items
              priority={false} 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-border/20 to-transparent group-hover:scale-110 transition-transform duration-500">
              {recipe.emoji || '🍽️'}
            </div>
          )}
          
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
            <p className="text-foreground font-serif font-bold text-sm leading-tight">
              {recipe.title}
            </p>
            {recipe.time_estimate && (
              <p className="text-primary text-[10px] font-black uppercase mt-2 tracking-widest">
                {recipe.time_estimate}m
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}