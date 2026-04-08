'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/db/queries/client';
import { 
  ArrowLeft, LogOut, Trash2, Bell, Shield, 
  Moon, CircleHelp, FileText, ChevronRight, AlertCircle, Sun 
} from 'lucide-react';

const supabase = createClient();

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  // State
  const [mounted, setMounted] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const handlePasswordReset = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) alert(error.message);
      else alert("Check your email for the reset link!");
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const handleDeleteAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
    if (!error) {
      await supabase.auth.signOut();
      router.push('/auth');
    } else {
      alert("Error: " + error.message);
    }
  };

  // Prevent rendering theme-specific UI until mounted to avoid flickering/errors
  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-background transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-20">
        
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-foreground/5 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-serif text-2xl font-bold">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Preferences Group */}
          <section className="bg-foreground/[0.02] border border-border rounded-3xl overflow-hidden shadow-sm">
            <SettingsItem 
              icon={<Shield size={20}/>} 
              label="Change Password" 
              onClick={handlePasswordReset}
            />
            <SettingsItem 
              icon={<Bell size={20}/>} 
              label="Push Notifications" 
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              detail={notificationsEnabled ? "On" : "Off"}
            />
            <SettingsItem 
              icon={resolvedTheme === 'dark' ? <Moon size={20}/> : <Sun size={20}/>} 
              label="Appearance" 
              onClick={toggleTheme}
              detail={resolvedTheme === 'dark' ? "Dark" : "Light"}
            />
          </section>

          {/* Support Group */}
          <section className="bg-foreground/[0.02] border border-border rounded-3xl overflow-hidden shadow-sm">
            <SettingsItem icon={<CircleHelp size={20}/>} label="Help & Support" onClick={() => window.location.href = 'mailto:easyeatsadmin@gmail.com'} />
            <SettingsItem icon={<FileText size={20}/>} label="Terms of Service" onClick={() => router.push('/terms')} />
            <SettingsItem icon={<FileText size={20}/>} label="Privacy Policy" onClick={() => router.push('/privacy')} />
          </section>

          {/* Logout/Delete Group */}
          <section className="bg-red-500/[0.02] border border-red-500/10 rounded-3xl overflow-hidden shadow-sm">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-5 hover:bg-red-500/5 transition-colors group"
            >
              <div className="flex items-center gap-4 text-red-500">
                <LogOut size={20} />
                <span className="font-bold">Log Out</span>
              </div>
            </button>
            <button 
              onClick={() => setShowDelete(true)}
              className="w-full flex items-center justify-between p-5 hover:bg-red-500/5 transition-colors border-t border-red-500/10"
            >
              <div className="flex items-center gap-4 text-red-500/60">
                <Trash2 size={20} />
                <span className="font-bold text-sm">Delete Account</span>
              </div>
            </button>
          </section>

          <footer className="text-center space-y-2 mt-8">
            <p className="text-[10px] text-foreground/20 font-black uppercase tracking-widest">
              Easy Eats v1.1.0 • Built with Next.js, Supabase, and a lot of ❤️
            </p>
          </footer>
        </div>
      </div>

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Wait, Chef!</h3>
            <p className="text-sm text-foreground/60 mb-8">This action is permanent. All your curated recipes and stats will be gone forever.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleDeleteAccount} className="bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase transition-colors">
                Delete Everything
              </button>
              <button onClick={() => setShowDelete(false)} className="bg-foreground/5 hover:bg-foreground/10 py-4 rounded-2xl font-black text-sm uppercase transition-colors">
                I'll Stay
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SettingsItem({ icon, label, detail, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-5 hover:bg-foreground/[0.03] cursor-pointer transition-colors border-b border-border/50 last:border-0"
    >
      <div className="flex items-center gap-4">
        <div className="text-foreground/40">{icon}</div>
        <span className="font-bold text-sm text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {detail && <span className="text-xs font-bold text-primary uppercase">{detail}</span>}
        <ChevronRight size={16} className="text-foreground/10" />
      </div>
    </button>
  );
}