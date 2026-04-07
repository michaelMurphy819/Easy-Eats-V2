'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/db/queries/client';
import { ArrowLeft, Save, LogOut, Trash2, AlertTriangle, Camera, Loader2 } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient();

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  
  // Danger Zone States
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form State
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
      
      if (!authUser) {
        router.push('/auth');
        return;
      }
      
      setUserId(authUser.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

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

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${userId}-${Math.random()}.${fileExt}`;

      // Upload to your existing bucket
      const { error: uploadError } = await supabase.storage
        .from('recipe-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recipe-photos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: formData.display_name,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
        skill_level: formData.skill_level,
        is_vegetarian: formData.is_vegetarian,
        is_dairy_free: formData.is_dairy_free,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    setSaving(false);

    if (!error) {
      // Force hard reload to bust Next.js cache
      window.location.href = `/profile/${username}`;
    } else {
      alert("Error saving profile: " + error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    setIsDeleting(true);
    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (!error) {
      await supabase.auth.signOut();
      router.push('/auth');
    } else {
      alert("Error deleting account: " + error.message);
      setIsDeleting(false);
      setShowDeleteWarning(false);
    }
  };

  if (loading) return (
    <div className="h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-background pb-20 px-4 md:px-0 relative">
      <div className="max-w-2xl mx-auto pt-12">
        
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link href={`/profile/${username}`} className="p-2 -ml-2 text-foreground/60 hover:text-foreground">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="font-serif text-3xl font-bold text-foreground">Settings</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        <div className="space-y-8">
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center gap-4 p-8 bg-foreground/[0.02] rounded-2xl border border-dashed border-border">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-background shadow-md bg-muted flex items-center justify-center text-5xl">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                '👨‍🍳'
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <label className="cursor-pointer flex items-center gap-2 bg-background border border-border hover:bg-foreground/[0.02] px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">
              <Camera size={16} />
              {uploading ? 'Uploading...' : 'Change Photo'}
              <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
            </label>
          </div>

          <div className="space-y-4 bg-foreground/[0.02] p-6 rounded-2xl border border-border">
            <h2 className="font-serif text-xl font-bold mb-4">Basic Info</h2>
            <div>
              <label className="block text-sm font-bold text-foreground/70 mb-2">Display Name</label>
              <input 
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground outline-none focus:border-primary transition-all"
                placeholder="Chef Name"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground/70 mb-2">Bio</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                rows={3}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground outline-none focus:border-primary transition-all resize-none"
                placeholder="Tell us about your cooking..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground/70 mb-2">Skill Level</label>
              <select 
                value={formData.skill_level}
                onChange={(e) => setFormData({...formData, skill_level: e.target.value})}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground outline-none focus:border-primary transition-all"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 bg-foreground/[0.02] p-6 rounded-2xl border border-border">
            <h2 className="font-serif text-xl font-bold mb-4">Dietary Preferences</h2>
            <label className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl cursor-pointer hover:bg-foreground/[0.02]">
              <input type="checkbox" checked={formData.is_vegetarian} onChange={(e) => setFormData({...formData, is_vegetarian: e.target.checked})} className="w-5 h-5 accent-primary" />
              <span className="font-medium">Vegetarian</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl cursor-pointer hover:bg-foreground/[0.02]">
              <input type="checkbox" checked={formData.is_dairy_free} onChange={(e) => setFormData({...formData, is_dairy_free: e.target.checked})} className="w-5 h-5 accent-primary" />
              <span className="font-medium">Dairy-Free</span>
            </label>
          </div>

          <div className="space-y-4 bg-foreground/[0.02] p-6 rounded-2xl border border-border">
            <h2 className="font-serif text-xl font-bold mb-4 text-red-500">Danger Zone</h2>
            <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 p-4 bg-background border border-border hover:bg-red-50 hover:text-red-600 rounded-xl font-bold transition-colors">
              <LogOut size={18} /> Log Out
            </button>
            <button onClick={() => setShowDeleteWarning(true)} className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl font-bold transition-colors">
              <Trash2 size={18} /> Delete Account
            </button>
          </div>
        </div>
      </div>

      {showDeleteWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 text-red-500 mb-4">
              <AlertTriangle size={32} />
              <h3 className="font-serif text-2xl font-bold">Are you sure?</h3>
            </div>
            <p className="text-foreground/70 mb-6">This action is permanent. All recipes and profile data will be wiped.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleDeleteAccount} disabled={isDeleting} className="w-full py-3 bg-red-500 text-white rounded-xl font-bold disabled:opacity-50">
                {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
              <button onClick={() => setShowDeleteWarning(false)} disabled={isDeleting} className="w-full py-3 bg-background border border-border rounded-xl font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}