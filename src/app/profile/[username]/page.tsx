'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/db/queries/client';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { RecipeGrid } from '@/components/profile/RecipeGrid';
import { RecipeDetailOverlay } from '@/components/feed/RecipeDetailOverlay';

const supabase = createClient();

type TabType = 'posts' | 'saved' | 'tagged';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  
  const rawUsername = typeof params?.username === 'string' ? params.username : '';
  const username = decodeURIComponent(rawUsername);
  
  const [user, setUser] = useState<any>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  
  const [loading, setLoading] = useState(true);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  // --- NEW: States for following logic ---
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const isOwner = authUser?.id === user?.id;

  const fetchProfileData = useCallback(async () => {
    if (!username || username === 'me') return;
    setLoading(true);
    
    // 1. Fetch Profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', username)
      .single();

    if (profileError || !profileData) {
      setUser(null);
      setLoading(false);
      return;
    }

    setUser(profileData);

    // 2. Fetch Stats
    const [followersRes, followingRes] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileData.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileData.id)
    ]);
    
    setStats({
      followers: followersRes.count || profileData.follower_count || 0,
      following: followingRes.count || 0
    });

    // --- NEW: Check if the logged-in user is already following this profile ---
    if (authUser && profileData) {
      const { data: followData } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', authUser.id)
        .eq('following_id', profileData.id)
        .single();
        
      setIsFollowing(!!followData);
    }

    // 3. Fetch Recipes based on Active Tab
    if (activeTab === 'posts') {
      const { data: recipeData } = await supabase
        .from('recipes')
        .select('*')
        .eq('author_id', profileData.id) 
        .order('created_at', { ascending: false });
      setRecipes(recipeData || []);
      
    } else if (activeTab === 'saved' && isOwner) {
      const { data: savedData } = await supabase
        .from('recipe_saves')
        .select('recipes(*)')
        .eq('user_id', profileData.id);
      
      const savedRecipes = savedData?.map((d: any) => d.recipes).flat() || [];
      setRecipes(savedRecipes);
    } else {
      setRecipes([]); 
    }

    setLoading(false);
  }, [username, activeTab, isOwner, authUser]); // <-- Added authUser to dependencies

  // --- NEW: Function to handle the Follow/Unfollow button click ---
  const handleToggleFollow = async () => {
    if (!authUser || !user) {
      router.push('/auth');
      return;
    }

    setIsFollowLoading(true);

    if (isFollowing) {
      // Unfollow
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', authUser.id)
        .eq('following_id', user.id);
        
      setIsFollowing(false);
      setStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
    } else {
      // Follow
      await supabase
        .from('follows')
        .insert({ follower_id: authUser.id, following_id: user.id });
        
      setIsFollowing(true);
      setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
    }
    
    setIsFollowLoading(false);
  };

  useEffect(() => {
    async function checkUserSession() {
      const { data: { user: auth } } = await supabase.auth.getUser();
      setAuthUser(auth);
      
      if (auth && username === 'me') {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', auth.id).single();
        if (profile) router.push(`/profile/${profile.username}`);
      } else if (!auth && username === 'me') {
        router.push('/auth');
      }
    }
    checkUserSession();
  }, [username, router]);

  useEffect(() => {
    if (authUser !== undefined) fetchProfileData();
  }, [fetchProfileData, authUser]);

  if (loading) return (
    <div className="h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!user) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center space-y-4">
      <p className="font-serif italic text-xl text-foreground/40">This chef isn't in the kitchen...</p>
      <button onClick={() => router.push('/')} className="text-primary text-sm uppercase tracking-widest font-bold hover:underline">
        Return Home
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-background pb-20">
      <ProfileHeader 
        user={user} 
        recipeCount={activeTab === 'posts' ? recipes.length : undefined} 
        stats={stats}
        isOwner={isOwner}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isFollowing={isFollowing} // <-- Passing down new state
        onToggleFollow={handleToggleFollow} // <-- Passing down new function
        isFollowLoading={isFollowLoading} // <-- Passing down new loading state
      />

      <div className="max-w-4xl mx-auto px-4 mt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-3xl font-bold text-foreground capitalize">{activeTab}</h2>
          <div className="h-px flex-1 bg-border ml-6"></div>
        </div>
        
        {recipes.length > 0 ? (
          <RecipeGrid recipes={recipes} onOpen={setSelectedRecipeId} />
        ) : (
          <div className="py-20 text-center">
            <p className="text-foreground/40 text-sm">
              {activeTab === 'posts' ? "No recipes uploaded yet." : `No ${activeTab} recipes found.`}
            </p>
          </div>
        )}
      </div>

      <RecipeDetailOverlay recipeId={selectedRecipeId} onClose={() => setSelectedRecipeId(null)} />
    </main>
  );
}