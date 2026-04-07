"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useModals } from '@/components/providers/ModalProvider'; // 1. Import the hook
import { Plus } from 'lucide-react';

const navItems = [
  { label: 'Feed', icon: '⌂', href: '/' },
  { label: 'Explore', icon: '⊙', href: '/explore' },
  { label: 'Collection', icon: '🔖', href: '/collection' },
  { label: 'Profile', icon: '◯', href: '/profile/me' },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { openUpload } = useModals(); // 2. Consume the context

  return (
    <aside className="flex flex-col h-full p-6 bg-background">
      {/* Brand Logo */}
      <div className="py-6">
        <h1 className="font-playfair text-2xl font-bold text-primary tracking-tight">
          Easy Eats
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label} 
              href={item.href} 
              className={`
                flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5' 
                  : 'text-foreground/50 hover:bg-foreground/5 hover:text-foreground'}
              `}
            >
              <span className={`
                text-2xl transition-transform duration-200 
                ${isActive ? 'scale-110' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}
              `}>
                {item.icon}
              </span>
              <span className={`text-sm tracking-wide ${isActive ? 'font-black' : 'font-bold'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Seamless Quick Action */}
      <div className="mt-auto pb-6">
        <button 
          type="button"
          onClick={openUpload} // 3. Trigger the modal state
          className="
            w-full flex justify-center items-center gap-2 
            bg-primary text-white py-4 rounded-2xl 
            text-sm font-black uppercase tracking-widest
            hover:brightness-105 hover:shadow-lg hover:shadow-primary/20 
            transition-all active:scale-[0.97]
          "
        >
          <Plus size={18} strokeWidth={3} /> Post Recipe
        </button>
      </div>
    </aside>
  );
}