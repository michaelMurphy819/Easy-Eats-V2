'use client';

import { motion } from 'framer-motion';
import { ShoppingBasket } from 'lucide-react';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  order_index: number;
}

interface IngredientsListProps {
  ingredients: Ingredient[];
  scaleFactor?: number;
  loading?: boolean;
}

// ─── Quantity formatting ──────────────────────────────────────────────────────

const FRACTIONS: [number, string][] = [
  [0.125, '⅛'],
  [0.25, '¼'],
  [0.333, '⅓'],
  [0.5, '½'],
  [0.667, '⅔'],
  [0.75, '¾'],
];

function fmtQty(raw: number): string {
  if (raw === 0) return '0';
  const whole = Math.floor(raw);
  const frac = raw - whole;

  if (whole === 0) {
    for (const [val, sym] of FRACTIONS) {
      if (Math.abs(frac - val) < 0.04) return sym;
    }
    return raw.toFixed(1);
  }

  if (frac > 0.05) {
    for (const [val, sym] of FRACTIONS) {
      if (Math.abs(frac - val) < 0.04) return `${whole}${sym}`;
    }
    return raw.toFixed(1);
  }
  return String(whole);
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow({ opacity }: { opacity: number }) {
  return (
    <div
      className="flex items-center justify-between py-3 border-b border-border"
      style={{ opacity }}
    >
      <div className="h-3.5 bg-foreground/5 rounded-full animate-pulse w-32" />
      <div className="h-3.5 bg-foreground/5 rounded-full animate-pulse w-12" />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IngredientsList({
  ingredients,
  scaleFactor = 1,
  loading = false,
}: IngredientsListProps) {
  if (loading) {
    return (
      <div className="space-y-1">
        {[1, 0.8, 0.6, 0.45, 0.3].map((o, i) => (
          <SkeletonRow key={i} opacity={o} />
        ))}
      </div>
    );
  }

  if (ingredients.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-foreground/20">
        <ShoppingBasket size={32} strokeWidth={1} />
        <p className="text-sm italic font-medium">No ingredients listed</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {ingredients.map((ing, i) => {
        const scaled = ing.quantity * scaleFactor;
        const qtyStr = fmtQty(Math.round(scaled * 100) / 100);

        return (
          <motion.li
            key={ing.id}
            layout
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
            className="flex items-center justify-between py-4 gap-4"
          >
            {/* Name - text-foreground for high contrast */}
            <span className="text-sm text-foreground/80 font-medium leading-snug flex-1 min-w-0">
              {ing.name}
            </span>

            {/* Quantity — The "badge" now uses primary/10 background for a soft look */}
            <motion.span
              key={`${ing.id}-${scaleFactor}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              className="
                text-sm font-black text-primary tabular-nums
                whitespace-nowrap flex-shrink-0 bg-primary/10 
                px-2.5 py-1 rounded-lg
              "
            >
              {qtyStr}
              {ing.unit ? ` ${ing.unit}` : ''}
            </motion.span>
          </motion.li>
        );
      })}
    </ul>
  );
}