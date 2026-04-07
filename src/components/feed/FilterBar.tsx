'use client';

const CATEGORIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export function FilterBar({ active, onChange }: { active: string, onChange: (val: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-4 no-scrollbar">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-all项目 whitespace-nowrap border ${
            active === cat 
              ? 'bg-primary border-primary text-background' // Text-background provides high contrast against blue
              : 'bg-background border-border text-foreground/60 hover:border-primary/50'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}