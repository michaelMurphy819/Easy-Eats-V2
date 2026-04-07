'use client';
import { motion } from 'framer-motion';

// Defined as a const to allow for type inference
const PRESET_TAGS = ['Quick', 'Vegan', 'Dinner', 'Dessert', 'Healthy', 'Budget'] as const;

// Create a type based on the preset tags
type Tag = typeof PRESET_TAGS[number];

interface TagSelectorProps {
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

export function TagSelector({ selectedTags, onToggle }: TagSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40">
        Categories & Tags
      </h3>

      <div className="flex flex-wrap gap-2">
        {PRESET_TAGS.map((tag) => {
          const isActive = selectedTags.includes(tag);
          
          return (
            <motion.button
              key={tag}
              type="button"
              whileTap={{ scale: 0.95 }}
              whileHover={{ y: -1 }}
              onClick={() => onToggle(tag)}
              className={`
                px-5 py-2.5 rounded-full text-xs font-bold transition-all border outline-none
                focus-visible:ring-2 focus-visible:ring-primary/50
                ${isActive 
                  ? 'bg-primary border-primary text-background shadow-lg shadow-primary/20' 
                  : 'bg-foreground/[0.03] border-border text-foreground/50 hover:border-primary/40 hover:text-primary'
                }
              `}
            >
              {tag}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}