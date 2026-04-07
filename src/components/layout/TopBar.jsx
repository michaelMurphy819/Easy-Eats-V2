// src/components/layout/TopBar.tsx
import React from 'react';

export function TopBar() {
  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-border transition-all">
      {/* Mobile & Desktop Logo - Using the theme primary blue */}
      <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
        Easy Eats<span className="text-primary">.</span>
      </h1>

      <div className="flex gap-3">
        {/* Notification Icon */}
        {/* Updated: Light background, subtle border, and adjusted "online" dot border */}
        <button className="relative w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center active:scale-90 transition-all shadow-sm hover:bg-slate-50">
          <span className="text-lg">🔔</span>
          {/* The dot now has a background-colored border so it blends with the light button */}
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
        </button>
        
        {/* Messages/Chat Icon */}
        <button className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center active:scale-90 transition-all shadow-sm hover:bg-slate-50">
          <span className="text-lg">💬</span>
        </button>
      </div>
    </div>
  );
}