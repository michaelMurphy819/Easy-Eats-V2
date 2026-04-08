'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/db/queries/client';
import { ArrowLeft, Save, Camera, Loader2, ChefHat, Leaf, MilkOff } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    skill_level: 'Beginner',
    is_vegetarian: false,
    is_dairy_free: false,
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/auth'); return; }
      setUserId(authUser.id);

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();

      if (profile) {
        setUsername(profile.username);
        setFormData({
          display_name: profile.display_name || '',
          bio: profile.bio || '',
          avatar_url: profile.avatar_url || '',
          skill_level: profile.skill_level || 'Beginner',
          is_vegetarian: profile.is_vegetarian || false,
          is_dairy_free: profile.is_dairy_free || false,
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      ...formData,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);

    if (!error) router.push(`/profile/${username}`);
    setSaving(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-foreground/5 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-serif text-2xl font-bold">Edit Profile</h1>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Done'}
          </button>
        </div>

        {/* Avatar Edit */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl bg-muted">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">👨‍🍳</div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
              <Camera size={18} />
              <input type="file" className="hidden" accept="image/*" />
            </label>
          </div>
          <p className="mt-4 text-xs font-bold text-primary uppercase tracking-widest">Change Profile Photo</p>
        </div>

        <div className="space-y-8">
          {/* Public Info */}
          <section className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-tighter text-foreground/30">Public Identity</h2>
            <div className="space-y-4">
              <div className="group">
                <label className="text-[10px] font-black uppercase ml-1 text-foreground/50">Display Name</label>
                <input 
                  type="text" 
                  value={formData.display_name} 
                  onChange={e => setFormData({...formData, display_name: e.target.value})}
                  className="w-full bg-foreground/[0.03] border-none rounded-2xl p-4 focus:ring-2 ring-primary/20 outline-none transition-all"
                  placeholder="Chef Name"
                />
              </div>
              <div className="group">
                <label className="text-[10px] font-black uppercase ml-1 text-foreground/50">Bio</label>
                <textarea 
                  value={formData.bio} 
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  className="w-full bg-foreground/[0.03] border-none rounded-2xl p-4 focus:ring-2 ring-primary/20 outline-none transition-all resize-none"
                  rows={3}
                  placeholder="The secret ingredient is..."
                />
              </div>
            </div>
          </section>

          {/* Kitchen Stats */}
          <section className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-tighter text-foreground/30">Kitchen Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-foreground/[0.03] p-4 rounded-2xl">
                <label className="text-[10px] font-black uppercase text-foreground/50 mb-2 block">Skill Level</label>
                <select 
                  value={formData.skill_level} 
                  onChange={e => setFormData({...formData, skill_level: e.target.value})}
                  className="w-full bg-transparent border-none p-0 outline-none font-bold text-foreground"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setFormData({...formData, is_vegetarian: !formData.is_vegetarian})}
                  className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${formData.is_vegetarian ? 'border-green-500 bg-green-500/5 text-green-600' : 'border-transparent bg-foreground/[0.03] text-foreground/40'}`}
                >
                  <Leaf size={20} className="mb-1" />
                  <span className="text-[10px] font-bold">Vegetarian</span>
                </button>
                <button 
                  onClick={() => setFormData({...formData, is_dairy_free: !formData.is_dairy_free})}
                  className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${formData.is_dairy_free ? 'border-blue-500 bg-blue-500/5 text-blue-600' : 'border-transparent bg-foreground/[0.03] text-foreground/40'}`}
                >
                  <MilkOff size={20} className="mb-1" />
                  <span className="text-[10px] font-bold">Dairy-Free</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}