'use client';

import { Settings, Grid, Bookmark, Tag, ChefHat, Leaf, MilkOff } from 'lucide-react';
import Link from 'next/link';

interface ProfileHeaderProps {
  user: any;
  recipeCount?: number;
  stats: { followers: number; following: number };
  isOwner: boolean;
  activeTab: 'posts' | 'saved' | 'tagged';
  setActiveTab: (tab: 'posts' | 'saved' | 'tagged') => void;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
  isFollowLoading?: boolean;
}

export function ProfileHeader({ 
  user, recipeCount, stats, isOwner, activeTab, setActiveTab,
  isFollowing, onToggleFollow, isFollowLoading 
}: ProfileHeaderProps) {
  
  return (
    <div className="bg-background pt-12 pb-0 border-b border-border">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16 mb-10">
          
          <div className="relative w-32 h-32 rounded-full p-[3px] bg-gradient-to-tr from-primary to-primary/20">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-5xl border-4 border-background overflow-hidden">
              {user?.avatar_url ? (
                 <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                 user?.avatar_emoji || '👨‍🍳'
              )}
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 text-center md:text-left">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground leading-tight">
                  {user?.display_name || user?.username}
                </h1>
                <p className="text-foreground/50 font-medium">@{user?.username}</p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider rounded-full border border-primary/20">
                    <ChefHat size={12} /> {user?.skill_level || 'Beginner'}
                  </span>
                  {user?.is_vegetarian && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-wider rounded-full border border-green-500/20">
                      <Leaf size={12} /> Veggie
                    </span>
                  )}
                  {user?.is_dairy_free && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-full border border-blue-500/20">
                      <MilkOff size={12} /> Dairy-Free
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 justify-center md:justify-start pt-1">
                {isOwner ? (
                  <>
                    <Link href="/settings" className="px-4 py-2 bg-foreground/[0.05] hover:bg-foreground/[0.1] text-foreground rounded-xl text-sm font-bold transition-colors border border-border">
                      Edit profile
                    </Link>
                    <Link href="/settings" className="p-2 text-foreground/40 hover:text-foreground transition-colors">
                      <Settings size={22} />
                    </Link>
                  </>
                ) : (
                  <button 
                    onClick={onToggleFollow}
                    disabled={isFollowLoading}
                    className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${
                      isFollowing 
                        ? 'bg-foreground/[0.05] text-foreground border border-border' 
                        : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02]'
                    }`}
                  >
                    {isFollowLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-8 mb-6">
              <div className="flex gap-1 items-baseline">
                <span className="font-bold text-lg text-foreground">{recipeCount ?? '-'}</span>
                <span className="text-foreground/50 text-sm">posts</span>
              </div>
              <div className="flex gap-1 items-baseline">
                <span className="font-bold text-lg text-foreground">{stats.followers}</span>
                <span className="text-foreground/50 text-sm">followers</span>
              </div>
              <div className="flex gap-1 items-baseline">
                <span className="font-bold text-lg text-foreground">{stats.following}</span>
                <span className="text-foreground/50 text-sm">following</span>
              </div>
            </div>

            <div className="text-center md:text-left">
              <p className="text-sm text-foreground/80 font-medium max-w-md whitespace-pre-wrap leading-relaxed">
                {user?.bio || "Welcome to my kitchen."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-12">
          <button onClick={() => setActiveTab('posts')} className={`flex items-center gap-2 pt-4 pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'posts' ? 'border-t-2 border-foreground -mt-[2px] text-foreground' : 'text-foreground/30 hover:text-foreground/60'}`}>
            <Grid size={16} /> Posts
          </button>
          {isOwner && (
            <button onClick={() => setActiveTab('saved')} className={`flex items-center gap-2 pt-4 pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'border-t-2 border-foreground -mt-[2px] text-foreground' : 'text-foreground/30 hover:text-foreground/60'}`}>
              <Bookmark size={16} /> Saved
            </button>
          )}
          <button onClick={() => setActiveTab('tagged')} className={`flex items-center gap-2 pt-4 pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'tagged' ? 'border-t-2 border-foreground -mt-[2px] text-foreground' : 'text-foreground/30 hover:text-foreground/60'}`}>
            <Tag size={16} /> Tagged
          </button>
        </div>
      </div>
    </div>
  );
}