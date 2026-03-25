import React, { useState } from 'react';
import { LogIn, PlaySquare, Loader2, ArrowLeft } from 'lucide-react';
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

      // Check if user has creator role
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

      if (profile.role !== 'ANALYST') {
        setError('Access denied. This portal is for creators only. If you are a viewer, please use the Hindustan app.');
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-gray-400 hover:text-red-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-wider">Back</span>
        </button>

        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
            <PlaySquare className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900">Creator Studio</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight uppercase">Welcome Back</h1>
        <p className="text-xs sm:text-base text-gray-500 mb-10 font-bold uppercase tracking-widest opacity-60">Sign in with your creator credentials</p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-red-500 rounded-2xl outline-none transition-all"
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-red-500 rounded-2xl outline-none transition-all"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-red-600 text-white rounded-2xl text-lg font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><LogIn size={20} /> Sign In</>}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400 text-sm">
          Don't have credentials? Contact the admin or apply as a creator.
        </p>
      </div>
    </div>
  );
}
