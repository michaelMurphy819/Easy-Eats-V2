'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useRef } from 'react';

const CATEGORIES = [
  'All', 
  'Breakfast', 
  'Lunch', 
  'Dinner', 
  'Dessert', 
  'Snacks', 
  'Beginner', 
  'Quick'
];

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const activeTag = searchParams.get('tag') || 'All';

  const handleTagChange = (newTag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTag === 'All') {
      params.delete('tag');
    } else {
      params.set('tag', newTag);
    }
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div className="w-full border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30">
      <div 
        ref={scrollRef}
        className="max-w-screen-xl mx-auto flex items-center gap-2 px-4 py-4 overflow-x-auto no-scrollbar scroll-smooth"
      >
        {CATEGORIES.map((tag) => {
          const isActive = activeTag === tag;
          
          return (
            <button
              key={tag}
              onClick={() => handleTagChange(tag)}
              className={`
                relative px-6 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap outline-none
                ${isActive ? 'text-background' : 'text-foreground/40 hover:text-foreground/70'}
              `}
            >
              {/* The "Pill" Animation - Uses primary blue */}
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                />
              )}
              
              <span className="relative z-10">{tag}</span>
            </button>
          );
        })}
      </div>
      
      {/* Decorative gradient - Updated to fade to your light background */}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
    </div>
  );
}