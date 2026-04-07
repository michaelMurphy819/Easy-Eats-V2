import React from 'react';

interface TagPillProps {
  label: string;
}

export const TagPill = ({ label }: TagPillProps) => {
  return (
    <span className="
      bg-foreground/[0.04] text-foreground/60 
      text-[11px] font-semibold px-2.5 py-[3px] 
      rounded-lg border border-border 
      whitespace-nowrap transition-colors
      hover:bg-foreground/[0.07] hover:text-foreground/80
    ">
      {label}
    </span>
  );
};