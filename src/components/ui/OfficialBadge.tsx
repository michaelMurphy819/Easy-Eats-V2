import React from 'react';
import { Star } from 'lucide-react';

export const OfficialBadge = () => {
  return (
    <span className="
      flex items-center gap-1 
      bg-primary text-background 
      text-[9px] font-black px-2 py-0.5 
      rounded-full uppercase tracking-widest 
      shadow-md shadow-primary/20
    ">
      <Star size={10} fill="currentColor" />
      Official
    </span>
  );
};