'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

export type ScaleMode = 'servings' | 'days';

interface ScaleControlsProps {
  baseServings: number;
  onChange: (factor: number) => void;
}

const SERVINGS_MIN = 1;
const SERVINGS_MAX = 20;
const DAYS_MIN = 1;
const DAYS_MAX = 14;

export function ScaleControls({ baseServings, onChange }: ScaleControlsProps) {
  const [mode, setMode] = useState<ScaleMode>('servings');
  const [servings, setServings] = useState(baseServings);
  const [days, setDays] = useState(5); 

  const currentVal = mode === 'servings' ? servings : days;
  const min = mode === 'servings' ? SERVINGS_MIN : DAYS_MIN;
  const max = mode === 'servings' ? SERVINGS_MAX : DAYS_MAX;

  const adjust = (delta: number) => {
    const next = Math.min(max, Math.max(min, currentVal + delta));
    if (mode === 'servings') {
      setServings(next);
      onChange(next / baseServings);
    } else {
      setDays(next);
      onChange(next / baseServings);
    }
  };

  const switchMode = (m: ScaleMode) => {
    setMode(m);
    const val = m === 'servings' ? servings : days;
    onChange(val / baseServings);
  };

  return (
    <div className="rounded-[24px] bg-white border border-border p-6 space-y-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[1.5px] text-foreground/30">
        Scale Ingredients
      </p>

      <div className="flex p-1 bg-foreground/5 rounded-2xl gap-1">
        {(['servings', 'days'] as ScaleMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`relative flex-1 rounded-[14px] py-2.5 text-[11px] font-black uppercase tracking-wider transition-colors ${
              mode === m
                ? 'text-white'
                : 'text-foreground/40 hover:text-foreground/70'
            }`}
          >
            {mode === m && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 rounded-[14px] bg-primary shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{m === 'servings' ? 'By Servings' : 'By Days'}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-2">
        <button
          type="button"
          onClick={() => adjust(-1)}
          disabled={currentVal <= min}
          className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center text-foreground/60 hover:border-primary hover:text-primary disabled:opacity-20 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
        >
          <Minus size={20} />
        </button>

        <div className="flex flex-col items-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={currentVal}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.15 }}
              className="text-5xl font-black text-primary tabular-nums leading-none tracking-tighter"
            >
              {currentVal}
            </motion.span>
          </AnimatePresence>
          <span className="text-[10px] text-foreground/30 font-black uppercase tracking-widest mt-1">
            {mode === 'servings' ? 'servings' : 'days'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => adjust(1)}
          disabled={currentVal >= max}
          className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center text-foreground/60 hover:border-primary hover:text-primary disabled:opacity-20 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>

      <p className="text-[11px] text-foreground/40 text-center font-medium">
        {mode === 'days'
          ? `Meal prepping for ${days} day${days !== 1 ? 's' : ''}`
          : `Perfect for ${servings} ${servings === 1 ? 'person' : 'people'}`}
      </p>
    </div>
  );
}