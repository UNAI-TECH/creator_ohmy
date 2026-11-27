import React from 'react';
import { ArrowRight, ArrowUpRight, Radio, Video, ShieldCheck, BarChart3, Newspaper, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onJoinClick: () => void;
  onLoginClick: () => void;
  onTermsClick: () => void;
  onPrivacyClick: () => void;
}

export default function LandingPage({
  onJoinClick,
  onLoginClick,
  onTermsClick,
  onPrivacyClick,
}: LandingPageProps) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-[#191A23] font-sans selection:bg-red-100 selection:text-[#D4191F]">
      {/* Minimal Crisp Editorial Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4 gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo-postsapp-light.png" alt="PostsApp" className="h-8 sm:h-9 object-contain" />
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-[#D4191F] text-white text-[10px] font-extrabold tracking-widest uppercase">
              CREATORS
            </span>
          </div>

          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-[#191A23]">
            <button onClick={() => scrollToSection('ecosystem')} className="hover:text-[#D4191F] transition-colors">
              About
            </button>
            <button onClick={() => scrollToSection('studio-suite')} className="hover:text-[#D4191F] transition-colors">
              Studio Suite
            </button>
            <button onClick={() => scrollToSection('how-to-join')} className="hover:text-[#D4191F] transition-colors">
              How It Works
            </button>
            <button onClick={onLoginClick} className="hover:text-[#D4191F] transition-colors font-semibold">
              Sign In
            </button>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={onLoginClick}
              className="md:hidden px-3 py-2 text-xs font-bold text-[#191A23] hover:text-[#D4191F] transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onJoinClick}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-[#191A23] text-xs sm:text-sm font-semibold text-[#191A23] hover:bg-[#D4191F] hover:border-[#D4191F] hover:text-white transition-all active:scale-95"
            >
              Join Studio
            </button>
          </div>
        </div>
      </nav>

      {/* Split Editorial Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-12 sm:pt-14 sm:pb-16">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#D4191F] text-xs font-bold uppercase tracking-wider mb-6">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4191F] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4191F]" />
              </span>
              <span>PostsApp Creator Network</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-[#191A23] leading-[1.08] mb-5">
              Influence Millions of Readers Across India
            </h1>

            <p className="text-base sm:text-[17px] text-[#4B5563] max-w-lg mb-8 leading-relaxed">
              Publish breaking news, deep-dive analysis, and video commentary on PostsApp. Grow your channel and monetize your journalism from one unified studio.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <button
                onClick={onJoinClick}
                className="group px-7 py-3.5 bg-[#191A23] hover:bg-[#D4191F] text-white rounded-xl text-sm sm:text-base font-semibold transition-all shadow-sm inline-flex items-center gap-2.5"
              >
                <span>Start Your Journey</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => scrollToSection('how-to-join')}
                className="px-6 py-3.5 bg-[#F3F3F3] hover:bg-gray-200 text-[#191A23] rounded-xl text-sm sm:text-base font-semibold transition-all"
              >
                How It Works
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <HeroMegaphoneIllustration />
          </div>
        </div>
      </section>

      {/* Monochrome Network Ecosystem Strip */}
      <section id="ecosystem" className="max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-6 border-y border-[#E5E7EB] text-[#6B7280]">
          <div className="flex items-center gap-2 font-extrabold tracking-tight text-base sm:text-lg hover:text-[#191A23] transition-colors">
            <Newspaper className="w-4 h-4 text-[#D4191F]" />
            <span>Breaking Wire</span>
          </div>
          <div className="flex items-center gap-2 font-extrabold tracking-tight text-base sm:text-lg hover:text-[#191A23] transition-colors">
            <Sparkles className="w-4 h-4 text-[#D4191F]" />
            <span>24h Stories</span>
          </div>
          <div className="flex items-center gap-2 font-extrabold tracking-tight text-base sm:text-lg hover:text-[#191A23] transition-colors">
            <Video className="w-4 h-4 text-[#D4191F]" />
            <span>Video Studio</span>
          </div>
          <div className="flex items-center gap-2 font-extrabold tracking-tight text-base sm:text-lg hover:text-[#191A23] transition-colors">
            <Radio className="w-4 h-4 text-[#D4191F]" />
            <span>Live Policy Desk</span>
          </div>
          <div className="flex items-center gap-2 font-extrabold tracking-tight text-base sm:text-lg hover:text-[#191A23] transition-colors">
            <BarChart3 className="w-4 h-4 text-[#D4191F]" />
            <span>Creator Analytics</span>
          </div>
          <div className="flex items-center gap-2 font-extrabold tracking-tight text-base sm:text-lg hover:text-[#191A23] transition-colors">
            <ShieldCheck className="w-4 h-4 text-[#D4191F]" />
            <span>Verified Press</span>
          </div>
        </div>
      </section>

      {/* Studio Capabilities — Alternating Light/Dark Bento Grid */}
      <section id="studio-suite" className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-10">
          <h2 className="inline-block w-fit bg-[#D4191F] text-white font-extrabold text-2xl sm:text-[32px] px-3.5 py-1 rounded-lg tracking-tight">
            Studio Suite
          </h2>
          <p className="text-sm text-[#4B5563] max-w-md leading-relaxed">
            Built for independent journalists, commentators, and digital newsrooms publishing across PostsApp web and mobile apps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-7">
          {/* Card 1: Light Card + Red Highlights */}
          <div className="bg-[#F3F3F3] rounded-[28px] border border-[#191A23] border-b-[5px] p-7 sm:p-8 flex items-center justify-between gap-4 min-h-[224px] transition-transform hover:-translate-y-0.5">
            <div className="flex flex-col justify-between h-full min-h-[160px]">
              <div className="flex flex-col items-start gap-1">
                <span className="bg-[#D4191F] text-white px-2.5 py-0.5 rounded-md font-bold text-lg sm:text-[22px] leading-snug">
                  Editorial Article
                </span>
                <span className="bg-[#D4191F] text-white px-2.5 py-0.5 rounded-md font-bold text-lg sm:text-[22px] leading-snug">
                  &amp; News Desk
                </span>
              </div>

              <button
                onClick={onJoinClick}
                className="group inline-flex items-center gap-3 mt-6 text-sm font-semibold text-[#191A23] hover:text-[#D4191F] transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-[#191A23] group-hover:bg-[#D4191F] text-white flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-[#FCA5A5] group-hover:text-white" />
                </span>
                <span>Start publishing</span>
              </button>
            </div>
            <div className="hidden sm:block shrink-0">
              <ServicePublishingSvg />
            </div>
          </div>

          {/* Card 2: Dark Card + White Highlights */}
          <div className="bg-[#191A23] text-white rounded-[28px] border border-[#191A23] border-b-[5px] p-7 sm:p-8 flex items-center justify-between gap-4 min-h-[224px] transition-transform hover:-translate-y-0.5">
            <div className="flex flex-col justify-between h-full min-h-[160px]">
              <div className="flex flex-col items-start gap-1">
                <span className="bg-white text-[#191A23] px-2.5 py-0.5 rounded-md font-bold text-lg sm:text-[22px] leading-snug">
                  Video Studio &amp;
                </span>
                <span className="bg-white text-[#191A23] px-2.5 py-0.5 rounded-md font-bold text-lg sm:text-[22px] leading-snug">
                  24h Stories
                </span>
              </div>

              <button
                onClick={onJoinClick}
                className="group inline-flex items-center gap-3 mt-6 text-sm font-semibold text-white hover:text-[#FCA5A5] transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-white text-[#191A23] group-hover:bg-[#D4191F] group-hover:text-white flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
                <span>Create rich media</span>
              </button>
            </div>
            <div className="hidden sm:block shrink-0">
              <ServiceVideoSvg />
            </div>
          </div>

          {/* Card 3: Dark Card + White Highlights */}
          <div className="bg-[#191A23] text-white rounded-[28px] border border-[#191A23] border-b-[5px] p-7 sm:p-8 flex items-center justify-between gap-4 min-h-[224px] transition-transform hover:-translate-y-0.5">
            <div className="flex flex-col justify-between h-full min-h-[160px]">
              <div className="flex flex-col items-start gap-1">
                <span className="bg-white text-[#191A23] px-2.5 py-0.5 rounded-md font-bold text-lg sm:text-[22px] leading-snug">
                  Verified Profile
                </span>
                <span className="bg-white text-[#191A23] px-2.5 py-0.5 rounded-md font-bold text-lg sm:text-[22px] leading-snug">
                  &amp; Massive Reach
                </span>
              </div>

              <button
                onClick={onJoinClick}
                className="group inline-flex items-center gap-3 mt-6 text-sm font-semibold text-white hover:text-[#FCA5A5] transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-white text-[#191A23] group-hover:bg-[#D4191F] group-hover:text-white flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
                <span>Get verified</span>
              </button>
            </div>
            <div className="hidden sm:block shrink-0">
              <ServiceReachSvg />
            </div>
          </div>

          {/* Card 4: Light Card + Red Highlights */}
          <div className="bg-[#F3F3F3] rounded-[28px] border border-[#191A23] border-b-[5px] p-7 sm:p-8 flex items-center justify-between gap-4 min-h-[224px] transition-transform hover:-translate-y-0.5">
            <div className="flex flex-col justify-between h-full min-h-[160px]">
              <div className="flex flex-col items-start gap-1">
                <span className="bg-[#D4191F] text-white px-2.5 py-0.5 rounded-md font-bold text-lg sm:text-[22px] leading-snug">
                  Live Analytics
                </span>
                <span className="bg-[#D4191F] text-white px-2.5 py-0.5 rounded-md font-bold text-lg sm:text-[22px] leading-snug">
                  &amp; Monetization
                </span>
              </div>

              <button
                onClick={onLoginClick}
                className="group inline-flex items-center gap-3 mt-6 text-sm font-semibold text-[#191A23] hover:text-[#D4191F] transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-[#191A23] group-hover:bg-[#D4191F] text-white flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-[#FCA5A5] group-hover:text-white" />
                </span>
                <span>Open studio login</span>
              </button>
            </div>
            <div className="hidden sm:block shrink-0">
              <ServiceAnalyticsSvg />
            </div>
          </div>
        </div>
      </section>

      {/* Mid-page Callout Card */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="bg-[#F3F3F3] rounded-[28px] px-7 py-9 sm:px-12 sm:py-11 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-lg">
            <h3 className="text-2xl sm:text-[28px] font-extrabold text-[#191A23] tracking-tight mb-3">
              Let’s launch your creator desk
            </h3>
            <p className="text-sm sm:text-base text-[#4B5563] mb-6 leading-relaxed">
              Submit your application to join the PostsApp Creator Network or sign in directly with credentials issued by our editorial administrators.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onJoinClick}
                className="px-7 py-3.5 bg-[#191A23] hover:bg-[#D4191F] text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
              >
                Submit your application
              </button>
              <button
                onClick={onLoginClick}
                className="px-6 py-3.5 bg-white border border-[#191A23]/20 hover:border-[#D4191F] text-[#191A23] hover:text-[#D4191F] rounded-xl text-sm font-semibold transition-all"
              >
                Studio Login
              </button>
            </div>
          </div>

          <div className="shrink-0">
            <ProposalOrbIllustration />
          </div>
        </div>
      </section>

      {/* Bottom 3-Column Dark Onboarding Strip */}
      <section id="how-to-join" className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-8">
          <h2 className="inline-block w-fit bg-[#D4191F] text-white font-extrabold text-2xl sm:text-[32px] px-3.5 py-1 rounded-lg tracking-tight">
            How to Join
          </h2>
          <p className="text-sm text-[#4B5563] max-w-md leading-relaxed">
            Start publishing and monetizing your stories in three simple steps across every state and category on PostsApp.
          </p>
        </div>

        <div className="bg-[#191A23] text-white rounded-[28px] p-8 sm:p-11 grid md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-white/20">
          <div className="md:pr-8 flex flex-col justify-between">
            <div>
              <span className="inline-block text-[11px] font-extrabold tracking-widest uppercase text-[#FCA5A5] mb-2">
                01 · Apply Now
              </span>
              <p className="text-sm sm:text-[15px] text-white/85 leading-relaxed mb-5">
                Fill out the creator application form with your beat, bio, and links to your previous work—for personal desks or newsroom teams.
              </p>
            </div>
            <button
              onClick={onJoinClick}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F87171] hover:text-white transition-colors w-fit"
            >
              <span>Apply now</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="md:px-8 flex flex-col justify-between">
            <div>
              <span className="inline-block text-[11px] font-extrabold tracking-widest uppercase text-[#FCA5A5] mb-2">
                02 · Get Approved
              </span>
              <p className="text-sm sm:text-[15px] text-white/85 leading-relaxed mb-5">
                Our editorial team reviews your profile carefully. Once approved or provisioned by admin, you receive instant studio credentials.
              </p>
            </div>
            <button
              onClick={onJoinClick}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F87171] hover:text-white transition-colors w-fit"
            >
              <span>Join Studio</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="md:pl-8 flex flex-col justify-between">
            <div>
              <span className="inline-block text-[11px] font-extrabold tracking-widest uppercase text-[#FCA5A5] mb-2">
                03 · Start Publishing
              </span>
              <p className="text-sm sm:text-[15px] text-white/85 leading-relaxed mb-5">
                Log into PostsApp Studio. Publish breaking articles, 24h stories, multilingual subtitles, and monitor audience earnings live.
              </p>
            </div>
            <button
              onClick={onLoginClick}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F87171] hover:text-white transition-colors w-fit"
            >
              <span>Studio Login</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Rounded Dark Footer */}
      <footer className="max-w-6xl mx-auto px-6">
        <div className="bg-[#191A23] text-white rounded-t-[28px] border-t-4 border-[#D4191F] px-7 sm:px-12 pt-11 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/15">
            <div className="flex items-center gap-3">
              <img src="/logo-postsapp-dark.png" alt="PostsApp" className="h-8 object-contain" />
              <span className="px-2 py-0.5 rounded bg-[#D4191F] text-white text-[10px] font-extrabold tracking-widest uppercase">
                CREATORS
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm font-medium text-[#D1D5DB]">
              <button onClick={onLoginClick} className="hover:text-white transition-colors">
                Studio Login
              </button>
              <button onClick={onJoinClick} className="hover:text-white transition-colors">
                Apply as Creator
              </button>
              <button onClick={onTermsClick} className="hover:text-white transition-colors">
                Terms
              </button>
              <button onClick={onPrivacyClick} className="hover:text-white transition-colors">
                Privacy
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9CA3AF]">
            <p>© 2026 PostsApp Digital Media. All rights reserved.</p>
            <p className="text-[#FCA5A5] font-semibold">Independent Journalism · India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Custom Editorial Red + Charcoal Geometric SVG Illustrations ---------- */

function HeroMegaphoneIllustration() {
  return (
    <svg
      viewBox="0 0 460 360"
      className="w-full max-w-[440px] h-auto select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Concentric tilted editorial orbit rings */}
      <ellipse cx="235" cy="195" rx="185" ry="62" transform="rotate(-18 235 195)" stroke="#191A23" strokeWidth="1.5" strokeOpacity="0.45" />
      <ellipse cx="235" cy="195" rx="150" ry="48" transform="rotate(-18 235 195)" stroke="#191A23" strokeWidth="1.5" strokeOpacity="0.3" />
      <ellipse cx="235" cy="195" rx="115" ry="34" transform="rotate(-18 235 195)" stroke="#191A23" strokeWidth="1.5" strokeOpacity="0.2" />

      {/* Handle */}
      <path d="M188 188 L206 238 L226 232 L209 182 Z" fill="#191A23" />

      {/* Megaphone cone body in crisp red & white */}
      <path
        d="M158 148 L272 82 L316 178 L184 198 C166 198 152 168 158 148 Z"
        fill="#FFFFFF"
        stroke="#191A23"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M158 148 L224 110 L248 188 L184 198 C166 198 152 168 158 148 Z"
        fill="#D4191F"
        stroke="#191A23"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Megaphone mouth ellipse */}
      <ellipse cx="294" cy="130" rx="22" ry="52" transform="rotate(-24 294 130)" fill="#FFFFFF" stroke="#191A23" strokeWidth="3" />
      <ellipse cx="294" cy="130" rx="11" ry="28" transform="rotate(-24 294 130)" fill="#D4191F" />
      {/* Tail cap */}
      <path d="M150 156 L162 150 L174 188 L161 193 Z" fill="#191A23" />

      {/* Sound / broadcast rays */}
      <path d="M322 86 L340 72" stroke="#191A23" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M332 108 L352 104" stroke="#D4191F" strokeWidth="2.5" strokeLinecap="round" />

      {/* Geometric stars & accent dots */}
      <path d="M98 76 L104 92 L120 98 L104 104 L98 120 L92 104 L76 98 L92 92 Z" fill="#191A23" />
      <path d="M108 260 L114 274 L128 280 L114 286 L108 300 L102 286 L88 280 L102 274 Z" fill="#191A23" />
      <path d="M236 286 L240 295 L249 299 L240 303 L236 312 L232 303 L223 299 L232 295 Z" fill="#D4191F" />
      <circle cx="94" cy="186" r="9" fill="#191A23" />
      <circle cx="352" cy="248" r="8" fill="#D4191F" fillOpacity="0.85" />
      <circle cx="300" cy="272" r="5" fill="#191A23" />

      {/* Floating circular badges (Heart, Share, Play, Pin) */}
      <g transform="translate(324, 34)">
        <circle cx="22" cy="22" r="22" fill="#191A23" />
        <path d="M22 30 C16 25 13 21.5 13 17.8 C13 15.2 15 13.5 17.5 13.5 C19.2 13.5 20.8 14.5 22 16 C23.2 14.5 24.8 13.5 26.5 13.5 C29 13.5 31 15.2 31 17.8 C31 21.5 28 25 22 30 Z" fill="#FFFFFF" />
      </g>

      <g transform="translate(384, 52)">
        <circle cx="22" cy="22" r="22" fill="#D4191F" />
        <circle cx="16" cy="22" r="2.6" fill="#FFFFFF" />
        <circle cx="27" cy="16" r="2.6" fill="#FFFFFF" />
        <circle cx="27" cy="28" r="2.6" fill="#FFFFFF" />
        <path d="M18 21 L25 17 M18 23 L25 27" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </g>

      <g transform="translate(376, 114)">
        <circle cx="22" cy="22" r="22" fill="#191A23" />
        <polygon points="18,15 30,22 18,29" fill="#FFFFFF" />
      </g>

      <g transform="translate(366, 174)">
        <circle cx="22" cy="22" r="22" fill="#D4191F" />
        <path d="M22 12 C17.6 12 14 15.6 14 20 C14 25.5 22 32 22 32 C22 32 30 25.5 30 20 C30 15.6 26.4 12 22 12 Z" fill="#FFFFFF" />
        <circle cx="22" cy="20" r="3" fill="#D4191F" />
      </g>
    </svg>
  );
}

function ServicePublishingSvg() {
  return (
    <svg width="132" height="106" viewBox="0 0 132 106" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="52" cy="54" r="36" stroke="#191A23" strokeWidth="1.5" strokeDasharray="3 3" />
      <rect x="20" y="20" width="68" height="50" rx="8" fill="#FFFFFF" stroke="#191A23" strokeWidth="2" />
      <line x1="30" y1="34" x2="72" y2="34" stroke="#D4191F" strokeWidth="4" strokeLinecap="round" />
      <line x1="30" y1="46" x2="76" y2="46" stroke="#191A23" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="30" y1="56" x2="60" y2="56" stroke="#191A23" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="98" cy="70" r="18" fill="#D4191F" fillOpacity="0.16" stroke="#191A23" strokeWidth="2" />
      <circle cx="96" cy="68" r="7" stroke="#191A23" strokeWidth="2.2" fill="#FFFFFF" />
      <line x1="101" y1="73" x2="108" y2="80" stroke="#191A23" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ServiceVideoSvg() {
  return (
    <svg width="132" height="106" viewBox="0 0 132 106" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="18" y="20" width="96" height="66" rx="10" fill="#FFFFFF" stroke="#191A23" strokeWidth="2" />
      <line x1="18" y1="36" x2="114" y2="36" stroke="#191A23" strokeWidth="2" />
      <circle cx="30" cy="28" r="2.5" fill="#D4191F" />
      <circle cx="39" cy="28" r="2.5" fill="#191A23" />
      <rect x="30" y="45" width="44" height="28" rx="6" fill="#D4191F" />
      <polygon points="48,53 59,59 48,65" fill="#FFFFFF" />
      <line x1="82" y1="51" x2="102" y2="51" stroke="#191A23" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="82" y1="60" x2="102" y2="60" stroke="#191A23" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M84 74 L92 92 L96 84 L104 82 Z" fill="#191A23" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  );
}

function ServiceReachSvg() {
  return (
    <svg width="132" height="106" viewBox="0 0 132 106" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="28" y="16" width="76" height="72" rx="10" fill="#FFFFFF" />
      <circle cx="66" cy="48" r="14" fill="#D4191F" />
      <path d="M60 48 L64.5 52.5 L73 43.5" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="40" y="72" width="52" height="6" rx="3" fill="#191A23" />
      <rect x="14" y="28" width="22" height="18" rx="5" fill="#D4191F" />
      <rect x="96" y="54" width="22" height="18" rx="5" fill="#D4191F" />
      <circle cx="25" cy="37" r="3" fill="#FFFFFF" />
      <circle cx="107" cy="63" r="3" fill="#FFFFFF" />
    </svg>
  );
}

function ServiceAnalyticsSvg() {
  return (
    <svg width="132" height="106" viewBox="0 0 132 106" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="66" cy="54" rx="48" ry="26" transform="rotate(-18 66 54)" stroke="#191A23" strokeWidth="1.5" strokeDasharray="3 3" />
      <rect x="26" y="58" width="14" height="28" rx="4" fill="#191A23" />
      <rect x="48" y="42" width="14" height="44" rx="4" fill="#D4191F" />
      <rect x="70" y="28" width="14" height="58" rx="4" fill="#191A23" />
      <path d="M88 30 L114 20 L102 48 L98 37 Z" fill="#D4191F" stroke="#191A23" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function ProposalOrbIllustration() {
  return (
    <svg width="210" height="150" viewBox="0 0 210 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="104" cy="78" rx="84" ry="26" stroke="#191A23" strokeWidth="1.5" strokeOpacity="0.4" />
      <ellipse cx="104" cy="78" rx="68" ry="20" transform="rotate(-14 104 78)" stroke="#191A23" strokeWidth="1.5" strokeOpacity="0.3" />
      {/* Dark crest emblem */}
      <circle cx="96" cy="56" r="24" fill="#191A23" />
      <rect x="89" y="47" width="4" height="14" rx="2" fill="#FFFFFF" />
      <rect x="99" y="47" width="4" height="14" rx="2" fill="#FFFFFF" />
      {/* Bold Red 4-point star */}
      <path d="M84 96 L92 114 L110 122 L92 130 L84 148 L76 130 L58 122 L76 114 Z" fill="#D4191F" />
      {/* Subtle light starburst */}
      <path d="M150 62 L156 80 L174 86 L156 92 L150 110 L144 92 L126 86 L144 80 Z" fill="#D1D5DB" />
      <circle cx="150" cy="36" r="5" fill="#191A23" />
    </svg>
  );
}
