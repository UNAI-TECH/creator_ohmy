import React, { useState } from 'react';
import { LogIn, PlaySquare, Loader2, Mail, Lock, Chrome, ChevronRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export default function LoginPage({ onBack, onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError('Login failed.');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('User')
        .select('role, username')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        setError('Failed to verify account.');
        await supabase.auth.signOut();
        return;
      }

      const allowedRoles = ['ANALYST', 'CREATOR'];
      if (!allowedRoles.includes(profile.role)) {
        setError('Access denied. This portal is for creators only.');
        await supabase.auth.signOut();
        return;
      }

      onLoginSuccess();
    } catch (err: any) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen soft-gradient flex flex-col items-center justify-center p-6 sm:p-12 font-sans selection:bg-red-100 selection:text-red-600">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
        
        {/* SECTION: TEXT CONTENT (LEFT) */}
        <div className="flex-1 text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
          <button 
            onClick={onBack}
            className="flex items-center justify-center lg:justify-start gap-2 text-gray-400 hover:text-red-600 transition-all font-bold text-xs uppercase tracking-widest group mb-8 w-full lg:w-auto"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>

          <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
            <img src="/logo%20omh.png" alt="OMH Logo" className="w-12 h-12 object-contain" />
            <span className="text-xl font-bold tracking-tight text-gray-900 font-sans">Creator Studio</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
            Manage your content.<br />
            <span className="text-red-600">Grow</span> your audience.
          </h1>
          
          <p className="text-gray-500 text-lg sm:text-xl max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
            Everything you need to publish, track, and optimize your creative work—all from one unified studio dashboard.
          </p>
        </div>

        {/* SECTION: LOGIN CARD (RIGHT) */}
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="bg-white rounded-[40px] p-8 sm:p-12 card-shadow border border-gray-50 relative">
            
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-400 font-medium">Log in to manage your workspace</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 focus:border-red-500/30 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-900 placeholder:text-gray-300"
                    placeholder="name@company.com"
                    disabled={loading}
                  />
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                </div>
                <div className="relative group">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 focus:border-red-500/30 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-900 placeholder:text-gray-300"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-red-600 text-white rounded-2xl text-lg font-black tracking-widest uppercase hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 disabled:opacity-70 group"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>Continue <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
