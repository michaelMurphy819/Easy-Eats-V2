import React from 'react';

interface SkillLevelProps { level: 'Beginner' | 'Intermediate' | 'Advanced'; }

export const SkillLevelBadge = ({ level }: SkillLevelProps) => {
  // Updated styles: Soft background tints with vibrant text for light mode
  const styles = {
    Beginner: "text-emerald-600 bg-emerald-50 border-emerald-100",
    Intermediate: "text-amber-600 bg-amber-50 border-amber-100",
    Advanced: "text-rose-600 bg-rose-50 border-rose-100",
  };

  return (
    <span className={`
      text-[9px] font-black px-2 py-1 rounded-lg border 
      uppercase tracking-widest transition-colors
      ${styles[level]}
    `}>
      {level}
    </span>
  );
};