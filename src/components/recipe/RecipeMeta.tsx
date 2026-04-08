'use client';

import { Clock, DollarSign, ChefHat } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecipeMetaProps {
  timeEstimate?: number | string | null;
  costEstimate?: string | null;
  skillLevel?: string | null;
  className?: string;
}

/** * High-contrast palette for Light Mode. 
 * Using 700-weight text on 50-weight backgrounds for maximum legibility.
 */
const SKILL_STYLES: Record<string, string> = {
  beginner:
    'text-emerald-700 bg-emerald-50 border-emerald-200',
  intermediate:
    'text-amber-700  bg-amber-50  border-amber-200',
  advanced:
    'text-rose-700   bg-rose-50   border-rose-200',
};

const DEFAULT_SKILL_STYLE = 'text-foreground/50 bg-foreground/5 border-border';

function Pill({
  icon,
  label,
  className = '',
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full
        border text-[10px] font-black uppercase tracking-widest
        transition-all duration-200
        ${className}
      `}
    >
      {icon}
      {label}
    </span>
  );
}

export function RecipeMeta({
  timeEstimate,
  costEstimate,
  skillLevel,
  className = '',
}: RecipeMetaProps) {
  // Normalize key to handle case-sensitivity and trailing spaces
  const skillKey = (skillLevel ?? '').toLowerCase().trim();
  const skillStyle = SKILL_STYLES[skillKey] ?? DEFAULT_SKILL_STYLE;
  
  const skillLabel = skillLevel
    ? skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1).toLowerCase()
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {/* Time Pill */}
      {timeEstimate != null && timeEstimate !== '' && (
        <Pill
          className="text-foreground/60 bg-background border-border shadow-sm"
          icon={<Clock size={13} className="text-primary" />}
          label={`${timeEstimate}m`}
        />
      )}

      {/* Cost Pill */}
      {costEstimate && (
        <Pill
          className="text-foreground/60 bg-background border-border shadow-sm"
          icon={<DollarSign size={13} className="text-primary" />}
          label={costEstimate}
        />
      )}

      {/* Skill Level Pill */}
      {skillLabel && (
        <Pill
          className={`${skillStyle} shadow-sm`}
          icon={<ChefHat size={13} />}
          label={skillLabel}
        />
      )}
    </motion.div>
  );
}