'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react'; // If you don't have lucide, use 🔍 and ✕

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Beginner', 'Quick'];

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Local state for the search input to keep it snappy
  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '');
  const activeTag = searchParams.get('tags') || 'All';

  // Effect: Update URL when searchTerm changes (Debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) {
        params.set('query', searchTerm);
      } else {
        params.delete('query');
      }
      router.push(`/explore?${params.toString()}`);
    }, 400); // 400ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, router, searchParams]);

  const handleTagChange = (newTag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTag === 'All') {
      params.delete('tags');
    } else {
      params.set('tags', newTag);
    }
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div className="w-full space-y-5">
      {/* ── Search Input ── */}
      <div className="px-4">
        <div className="relative group max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search recipes, ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-foreground/[0.03] border border-border rounded-2xl py-3 pl-11 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-foreground/5 rounded-full"
            >
              <X className="w-4 h-4 text-foreground/40" />
            </button>
          )}
        </div>
      </div>

      {/* ── Tags Restructured Below Search ── */}
      <div className="relative">
        <div 
          ref={scrollRef}
          className="max-w-screen-xl mx-auto flex items-center gap-2 px-4 overflow-x-auto no-scrollbar scroll-smooth"
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
        {/* Gradient fade for scrolling on mobile */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
      </div>
    </div>
  );
}