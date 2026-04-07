"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useModals } from '@/components/providers/ModalProvider';
import { Plus } from 'lucide-react';

const navItems = [
  { label: 'Feed', icon: '⌂', href: '/' },
  { label: 'Explore', icon: '⊙', href: '/explore' },
  // The 'Post' button will be inserted manually in the middle
  { label: 'Collection', icon: '🔖', href: '/collection' },
  { label: 'Profile', icon: '◯', href: '/profile/me' },
];

export const MobileNav = () => {
  const pathname = usePathname();
  const { openUpload } = useModals();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border flex items-center pb-8 pt-3 z-50 px-2">
      {/* First half of nav items */}
      {navItems.slice(0, 2).map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.label} 
            href={item.href} 
            className={`flex-1 flex flex-col items-center gap-1 text-[10px] transition-colors ${isActive ? 'text-primary' : 'text-foreground/40'}`}
          >
            <span className="text-2xl leading-none">{item.icon}</span>
            <span className={isActive ? 'font-black' : 'font-bold'}>{item.label}</span>
          </Link>
        );
      })}

      {/* Center Action Button */}
      <div className="flex-1 flex justify-center -mt-8">
        <button 
          onClick={openUpload}
          className="w-14 h-14 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center active:scale-90 transition-all border-4 border-background"
          aria-label="Post Recipe"
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      </div>

      {/* Second half of nav items */}
      {navItems.slice(2).map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.label} 
            href={item.href} 
            className={`flex-1 flex flex-col items-center gap-1 text-[10px] transition-colors ${isActive ? 'text-primary' : 'text-foreground/40'}`}
          >
            <span className="text-2xl leading-none">{item.icon}</span>
            <span className={isActive ? 'font-black' : 'font-bold'}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};