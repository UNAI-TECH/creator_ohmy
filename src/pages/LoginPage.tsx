import React, { useState, useEffect } from 'react';
import { Loader2, Mail, Lock, ArrowLeft, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { AuthIllustration } from '../components/AuthIllustrations';
import { logAndGetFriendlyError } from '../lib/errorHandler';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: () => void;
  pendingOtpEmail?: string;
  requirePasswordSetup?: boolean;
}

export default function LoginPage({
  onBack,
  onLoginSuccess,
  pendingOtpEmail = '',
  requirePasswordSetup = false,
}: LoginPageProps) {
  const [step, setStep] = useState<'signin' | 'set_password'>(requirePasswordSetup ? 'set_password' : 'signin');
  const [email, setEmail] = useState(pendingOtpEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (requirePasswordSetup) {
      setStep('set_password');
      if (pendingOtpEmail) setEmail(pendingOtpEmail);
    }
  }, [requirePasswordSetup, pendingOtpEmail]);

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
        setError(logAndGetFriendlyError(authError, 'Unable to sign in. Please try again.', 'StudioLogin:auth'));
        return;
      }

      if (!authData.user) {
        setError('Unable to verify your login session. Please try again.');
        return;
      }

      let { data: profile, error: profileError } = await supabase
        .from('User')
        .select('role, username, account_status')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (!profile && normalizedEmail) {
        const fallback = await supabase
          .from('User')
          .select('role, username, account_status')
          .ilike('email', normalizedEmail)
          .maybeSingle();
        profile = fallback.data;
        profileError = fallback.error;
      }

      if (profileError || !profile) {
        console.error('[StudioLogin] Profile check failed:', profileError);
        setError('Unable to verify your creator profile. Please contact support.');
        await supabase.auth.signOut();
        return;
      }

      const allowedRoles = ['ANALYST', 'CREATOR', 'ADMIN'];
      const normalizedRole = String(profile.role || '').trim().toUpperCase();
      if (!allowedRoles.includes(normalizedRole)) {
        setError('Access denied. This portal is for approved creators only.');
        await supabase.auth.signOut();
        return;
      }

      if ((profile.account_status || 'active') !== 'active') {
        setError('Your creator account is currently suspended. Contact an administrator.');
        await supabase.auth.signOut();
        return;
      }

      const mustChange = Boolean(authData.user.app_metadata?.must_change_password);
      if (mustChange) {
        setOtpCode(password);
        setStep('set_password');
        return;
      }

      onLoginSuccess();
    } catch (err: any) {
      setError(logAndGetFriendlyError(err, 'Something went wrong while signing in. Please try again.', 'StudioLogin'));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOtpSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setError('Please enter the one-time password provided by the administrator.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Session expired. Please sign in again with your one-time password.');
        setStep('signin');
        return;
      }

      const { data, error: fnErr } = await supabase.functions.invoke('account-lifecycle', {
        body: {
          action: 'completeCreatorOtpSetup',
          otp: cleanOtp,
          newPassword,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnErr || data?.error) {
        console.error('[StudioLogin] OTP password setup error:', fnErr || data?.error);
        const rawMsg = String(data?.error || fnErr?.message || '').toLowerCase();
        if (rawMsg.includes('expired')) {
          setError('Your one-time password has expired. Please request a new one from the administrator.');
        } else if (rawMsg.includes('match') || rawMsg.includes('403')) {
          setError('The one-time password does not match our records. Please double-check and try again.');
        } else {
          setError('Something went wrong while updating your password. Please try again.');
        }
        return;
      }

      // Sign in cleanly with the brand-new password so JWT claims reflect must_change_password = false
      const normalizedEmail = (email || session.user.email || '').trim().toLowerCase();
      if (normalizedEmail) {
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: newPassword,
        });
      } else {
        await supabase.auth.refreshSession();
      }

      onLoginSuccess();
    } catch (err: any) {
      setError(logAndGetFriendlyError(err, 'Something went wrong while saving your new password. Please try again.', 'StudioLogin:otpSetup'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col p-6 font-sans selection:bg-red-100 selection:text-[#D4191F]">
      <div className="max-w-6xl w-full mx-auto">
        <button
          onClick={async () => {
            if (step === 'set_password') {
              await supabase.auth.signOut().catch(() => {});
              setStep('signin');
              setPassword('');
              setOtpCode('');
              setNewPassword('');
              setConfirmPassword('');
              setError('');
              return;
            }
            onBack();
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#E5E7EB] text-[#18181B] hover:border-[#D4191F] hover:text-[#D4191F] transition-colors text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-6xl w-full mx-auto py-6">
        <div className="flex items-center justify-center gap-2.5 mb-5">
          <img src="/logo-postsapp-light.png" alt="PostsApp" className="h-10 object-contain" />
          <span className="px-2.5 py-0.5 rounded bg-[#D4191F] text-white text-[10px] font-extrabold tracking-widest uppercase">
            STUDIO
          </span>
        </div>

        <div className="w-full flex items-end justify-center relative">
          <div className="hidden lg:block -mr-7 -mb-2 z-0">
            <AuthIllustration side="left" />
          </div>

          <div className="w-full max-w-[440px] bg-white rounded-[20px] px-6 sm:px-8 py-9 shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-[#E5E7EB] relative z-10">
            {step === 'signin' ? (
              <>
                <div className="mb-6">
                  <h1 className="text-[28px] leading-[34px] font-extrabold text-[#111827] tracking-tight mb-2">
                    PostsApp<br />Creator Studio
                  </h1>
                  <p className="text-[13px] text-[#6B7280]">
                    Sign in with your password or admin-issued one-time password
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
                      className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#111827] placeholder:text-[#6B7280]"
                      placeholder="Your Email"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center bg-[#F3F4F6] border border-[#E5E7EB] focus-within:border-[#D4191F] focus-within:bg-white rounded-xl h-[52px] px-3.5 transition-colors">
                    <Lock size={18} className="text-[#18181B] mr-2.5 shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#111827] placeholder:text-[#6B7280]"
                      placeholder="Password / One-Time Password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="ml-2 text-gray-500 hover:text-gray-900 p-1 rounded-md focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
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
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="mb-5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Account Verified · Set Personal Password
                  </div>
                  <h1 className="text-[24px] leading-[30px] font-extrabold text-[#111827] tracking-tight mb-1.5">
                    Create Your Password
                  </h1>
                  <p className="text-[13px] text-[#6B7280]">
                    Verify your admin-issued one-time password for <strong>{email}</strong> and choose your personal password.
                  </p>
                </div>

                <form onSubmit={handleCompleteOtpSetup} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      One-Time Password
                    </label>
                    <div className="flex items-center bg-[#F3F4F6] border border-[#E5E7EB] focus-within:border-[#D4191F] focus-within:bg-white rounded-xl h-[48px] px-3.5 transition-colors">
                      <KeyRound size={17} className="text-[#18181B] mr-2.5 shrink-0" />
                      <input
                        type="text"
                        required
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        className="flex-1 min-w-0 bg-transparent outline-none text-sm font-mono text-[#111827] placeholder:text-[#6B7280]"
                        placeholder="Enter admin one-time password"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      New Password
                    </label>
                    <div className="flex items-center bg-[#F3F4F6] border border-[#E5E7EB] focus-within:border-[#D4191F] focus-within:bg-white rounded-xl h-[48px] px-3.5 transition-colors">
                      <Lock size={17} className="text-[#18181B] mr-2.5 shrink-0" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#111827] placeholder:text-[#6B7280]"
                        placeholder="Minimum 8 characters"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass((prev) => !prev)}
                        className="ml-2 text-gray-500 hover:text-gray-900 p-1 rounded-md focus:outline-none"
                      >
                        {showNewPass ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Confirm Password
                    </label>
                    <div className="flex items-center bg-[#F3F4F6] border border-[#E5E7EB] focus-within:border-[#D4191F] focus-within:bg-white rounded-xl h-[48px] px-3.5 transition-colors">
                      <Lock size={17} className="text-[#18181B] mr-2.5 shrink-0" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#111827] placeholder:text-[#6B7280]"
                        placeholder="Re-enter your new password"
                        disabled={loading}
                      />
                    </div>
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
                    className="w-full h-[50px] mt-2 bg-[#D4191F] hover:bg-[#9E1111] text-white rounded-xl text-[15px] font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify OTP & Save Password'}
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="hidden lg:block -ml-5 -mb-2 z-0">
            <AuthIllustration side="right" />
          </div>
        </div>
      </div>
    </div>
  );
}
