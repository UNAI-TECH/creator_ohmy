import React from 'react';
import { Users, Star, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onJoinClick: () => void;
  onLoginClick: () => void;
  onTermsClick: () => void;
  onPrivacyClick: () => void;
}

export default function LandingPage({ onJoinClick, onLoginClick, onTermsClick, onPrivacyClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827] font-sans">
      {/* Editorial Top Header */}
      <nav className="bg-[#141414] border-b-2 border-[#D4191F] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <img src="/logo-postsapp-dark.png" alt="PostsApp" className="h-8 sm:h-9 object-contain" />
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-[#D4191F] text-white text-[10px] font-extrabold tracking-widest uppercase">
              CREATORS
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onLoginClick}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-[#E5E7EB] hover:text-white transition-colors uppercase tracking-wider"
            >
              Sign In
            </button>
            <button
              onClick={onJoinClick}
              className="px-5 py-2 sm:py-2.5 bg-[#D4191F] text-white rounded text-xs sm:text-sm font-extrabold hover:bg-[#9E1111] transition-all active:scale-95 uppercase tracking-wider"
            >
              Join Studio
            </button>
          </div>
        </div>
      </nav>

      {/* Crimson Editorial Masthead Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#C4161C] to-[#9E1111] text-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#141414]/60 border border-white/15 rounded-full text-xs font-bold uppercase tracking-widest mb-7">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>PostsApp Creator Network</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.06]">
            Influence Millions<br />of Readers Across India
          </h1>

          <p className="text-base sm:text-xl text-white/85 max-w-2xl mb-10 font-medium leading-relaxed">
            Publish breaking news, deep-dive analysis, and video commentary on PostsApp. Grow your channel and monetize your journalism from one unified studio.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onJoinClick}
              className="group px-8 py-4 bg-[#141414] hover:bg-black text-white rounded-lg text-base font-bold transition-all shadow-lg flex items-center justify-center gap-3"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => document.getElementById('how-to-join')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/25 text-white rounded-lg text-base font-bold transition-all flex items-center justify-center"
            >
              How It Works
            </button>
          </div>
        </div>
      </section>

      {/* Step by Step Flow to Join */}
      <section id="how-to-join" className="bg-[#F5F5F7] py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#D4191F] mb-2">
              <span className="w-5 h-0.5 bg-[#D4191F]" />
              Onboarding Process
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] mb-3">How to Join PostsApp Studio</h2>
            <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl mx-auto">Start publishing and monetizing your stories in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-[#FEF2F2] border border-red-200 text-[#D4191F] rounded-xl flex items-center justify-center text-xl font-black mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-2.5">Apply Now</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Fill out the creator application form with your details and links to your previous work.
              </p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-[#FEF2F2] border border-red-200 text-[#D4191F] rounded-xl flex items-center justify-center text-xl font-black mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-2.5">Get Approved</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Our editorial team reviews your profile carefully. Once approved, you receive studio access.
              </p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-[#D4191F] text-white rounded-xl flex items-center justify-center text-xl font-black mx-auto mb-6 shadow-sm">
                3
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-2.5">Start Publishing</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Log into PostsApp Studio. Create posts, publish 24h stories, track analytics, and grow.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={onJoinClick}
              className="inline-flex items-center gap-2 text-[#D4191F] font-bold hover:text-[#9E1111] hover:underline underline-offset-4"
            >
              Submit your application today <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats/Features */}
      <section className="bg-white border-t border-[#E5E7EB] py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Users}
            title="Massive Reach"
            desc="Connect with an engaged audience across every state and language on PostsApp."
          />
          <FeatureCard
            icon={Star}
            title="Editorial Studio"
            desc="Streamlined dashboard to publish articles, manage videos, subtitles, and community."
          />
          <FeatureCard
            icon={CheckCircle2}
            title="Verified Status"
            desc="Build reader trust with verified creator profiles and live analytics."
          />
        </div>
      </section>

      {/* Dark Editorial Footer matching PostsApp Web */}
      <footer className="bg-[#141414] text-white border-t-2 border-[#D4191F] pt-14 pb-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          <img src="/logo-postsapp-dark.png" alt="PostsApp" className="h-9 object-contain mb-6" />
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-8 text-sm font-medium text-[#A3A3A3]">
            <button onClick={onLoginClick} className="hover:text-white transition-colors">Studio Login</button>
            <button onClick={onJoinClick} className="hover:text-white transition-colors">Apply as Creator</button>
            <button onClick={onTermsClick} className="hover:text-white transition-colors">Terms</button>
            <button onClick={onPrivacyClick} className="hover:text-white transition-colors">Privacy</button>
          </div>
          <p className="text-[#737373] text-xs font-medium tracking-wide">
            © 2026 PostsApp Digital Media. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="bg-[#F5F5F7] p-7 rounded-xl border border-[#E5E7EB] transition-all hover:border-[#D4191F]/40">
      <div className="w-12 h-12 bg-[#FEF2F2] text-[#D4191F] rounded-lg flex items-center justify-center mb-5">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-[#111827] mb-2">{title}</h3>
      <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
    </div>
  );
}
