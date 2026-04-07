'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/db/queries/client';

const supabase = createClient();

export default function AuthPage() {
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '', 
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) setError(error.message);
      else router.push('/');
    } else {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            avatar_emoji: '👨‍🍳',
          }
        }
      });

      if (error) setError(error.message);
      else {
        alert("Check your email for the confirmation link!");
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Updated Background Decor for Light Mode */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
            <Utensils className="text-background" size={32} />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
            {isLogin ? 'Welcome Back' : 'Join the Kitchen'}
          </h1>
          <p className="text-foreground/40 text-sm italic font-serif">
            {isLogin ? 'Your digital cookbook awaits.' : 'Start sharing your secret recipes today.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" size={18} />
                <input
                  required
                  placeholder="Username"
                  className="w-full bg-foreground/[0.03] border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase()})}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" size={18} />
            <input
              required
              type="email"
              placeholder="Email Address"
              className="w-full bg-foreground/[0.03] border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" size={18} />
            <input
              required
              type="password"
              placeholder="Password"
              className="w-full bg-foreground/[0.03] border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {error && (
            <p className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-200">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full bg-primary text-background font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 group active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center mt-8 text-foreground/40 text-sm">
          {isLogin ? "Don't have an account?" : "Already a member?"}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-primary font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </motion.div>
    </main>
  );
}