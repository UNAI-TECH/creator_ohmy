import React, { useState } from 'react';
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { AuthIllustration } from '../components/AuthIllustrations';

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
      const normalizedEmail = email.trim().toLowerCase();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
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

      let { data: profile, error: profileError } = await supabase
        .from('User')
        .select('role, username')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (!profile && normalizedEmail) {
        const fallback = await supabase
          .from('User')
          .select('role, username')
          .ilike('email', normalizedEmail)
          .maybeSingle();
        profile = fallback.data;
        profileError = fallback.error;
      }

      if (profileError || !profile) {
        setError('Failed to verify account.');
        await supabase.auth.signOut();
        return;
      }

      const allowedRoles = ['ANALYST', 'CREATOR'];
      const normalizedRole = String(profile.role || '').trim().toUpperCase();
      if (!allowedRoles.includes(normalizedRole)) {
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
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col p-6 font-sans selection:bg-red-100 selection:text-[#D4191F]">
      <div className="max-w-6xl w-full mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#E5E7EB] text-[#18181B] hover:border-[#D4191F] hover:text-[#D4191F] transition-colors text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-6xl w-full mx-auto py-6">
        {/* Centered Logo & Badge directly above card */}
        <div className="flex items-center justify-center gap-2.5 mb-5">
          <img src="/logo-postsapp-light.png" alt="PostsApp" className="h-10 object-contain" />
          <span className="px-2.5 py-0.5 rounded bg-[#D4191F] text-white text-[10px] font-extrabold tracking-widest uppercase">
            STUDIO
          </span>
        </div>

        {/* Center Stage with flanking red illustrations */}
        <div className="w-full flex items-end justify-center relative">
          <div className="hidden lg:block -mr-7 -mb-2 z-0">
            <AuthIllustration side="left" />
          </div>

          <div className="w-full max-w-[420px] bg-white rounded-[20px] px-8 py-9 shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-[#E5E7EB] relative z-10">
            <div className="mb-6">
              <h1 className="text-[28px] leading-[34px] font-extrabold text-[#111827] tracking-tight mb-2">
                PostsApp<br />Creator Studio
              </h1>
              <p className="text-[13px] text-[#6B7280]">
                Log in to publish and manage your workspace
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="flex items-center bg-[#F3F4F6] border border-[#E5E7EB] focus-within:border-[#D4191F] focus-within:bg-white rounded-xl h-[52px] px-3.5 transition-colors">
                <Mail size={18} className="text-[#18181B] mr-2.5 shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-[#111827] placeholder:text-[#6B7280]"
                  placeholder="Your Email"
                  disabled={loading}
                />
              </div>

              <div className="flex items-center bg-[#F3F4F6] border border-[#E5E7EB] focus-within:border-[#D4191F] focus-within:bg-white rounded-xl h-[52px] px-3.5 transition-colors">
                <Lock size={18} className="text-[#18181B] mr-2.5 shrink-0" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-[#111827] placeholder:text-[#6B7280]"
                  placeholder="Your Password"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#D4191F] text-xs font-semibold flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4191F] shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] mt-1 bg-[#D4191F] hover:bg-[#9E1111] text-white rounded-xl text-[15px] font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          <div className="hidden lg:block -ml-5 -mb-2 z-0">
            <AuthIllustration side="right" />
          </div>
        </div>
      </div>
    </div>
  );
}
