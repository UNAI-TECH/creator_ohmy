import React from 'react';
import { PlaySquare, Users, Star, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onJoinClick: () => void;
  onLoginClick: () => void;
  onTermsClick: () => void;
  onPrivacyClick: () => void;
}

export default function LandingPage({ onJoinClick, onLoginClick, onTermsClick, onPrivacyClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white text-[#0f0f0f] font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/logo%20omh.png" alt="OMH Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
          <span className="text-base sm:text-2xl font-black tracking-tighter text-gray-900 uppercase">Hindustan</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-4">
          <button
            onClick={onLoginClick}
            className="px-2 sm:px-6 py-2 text-[10px] sm:text-sm font-black text-gray-400 hover:text-red-600 transition-colors uppercase tracking-widest"
          >
            Sign In
          </button>
          <button
            onClick={onJoinClick}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-red-600 text-white rounded-xl sm:rounded-full text-[10px] sm:text-sm font-black hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 uppercase tracking-widest"
          >
            JOIN
          </button>
        </div>
      </nav>

      {/* Enhanced Modern Hero Section */}
      <section className="relative overflow-hidden bg-white max-w-[100vw] w-full pt-16 lg:pt-32 pb-24">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[20%] w-[400px] h-[400px] rounded-full bg-red-400 blur-[100px]" />
          <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-orange-300 blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-md border border-red-100 shadow-sm rounded-full text-sm font-bold mb-8 animate-[bounce_3s_infinite]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <span className="text-red-700">Join the Voice of Bharat</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-[5.5rem] font-black tracking-tighter mb-8 leading-[1.05] uppercase">
            Influence <br />
            <span className="bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">Millions of Indians</span>
          </h1>

          <p className="text-base sm:text-xl lg:text-2xl text-gray-500 max-w-3xl mb-12 leading-relaxed font-bold uppercase tracking-widest opacity-60">
            The ultimate platform for Indian creators. Share news, blogs, and analysis. Reach 1.4 billion people with your unique perspective.
          </p>

          <div className="flex flex-col sm:flex-row gap-5">
            <button
              onClick={onJoinClick}
              className="group relative px-10 py-5 bg-red-600 text-white rounded-2xl text-lg font-bold transition-all shadow-xl shadow-red-600/30 overflow-hidden flex items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-600/40"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-[150%] skew-x-[-20deg] group-hover:translate-x-[150%] transition-transform duration-700 ease-out" />
              <span>Start Your Journey</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => document.getElementById('how-to-join')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-5 bg-white text-gray-800 border-2 border-gray-200 rounded-2xl text-lg font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md"
            >
              Guidance to JOIN
            </button>
          </div>
        </div>
      </section>

      {/* Step by Step Flow to Join */}
      <section id="how-to-join" className="bg-gray-50 py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">How to Join</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Start publishing and monetizing your content in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-1 bg-gradient-to-r from-red-100 via-red-300 to-orange-100 border-dashed border-red-200" />

            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-white border-4 border-red-500 text-red-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl shadow-red-100 z-10 mb-8 transition-transform group-hover:scale-110 group-hover:-translate-y-2">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Apply Now</h3>
              <p className="text-gray-600 leading-relaxed px-4">
                Fill out the creator application form with your details and links to your previous work.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-white border-4 border-red-500 text-red-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl shadow-red-100 z-10 mb-8 transition-transform group-hover:scale-110 group-hover:-translate-y-2">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Get Approved</h3>
              <p className="text-gray-600 leading-relaxed px-4">
                Our editorial team reviews your profile carefully. Once approved, you get your login credentials.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl shadow-orange-200 z-10 mb-8 transition-transform group-hover:scale-110 group-hover:-translate-y-2">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Start Publishing</h3>
              <p className="text-gray-600 leading-relaxed px-4">
                Log into the studio dashboard. Create posts, track analytics, and grow your Indian audience.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={onJoinClick}
              className="inline-flex items-center gap-2 text-red-600 font-bold hover:text-red-700 hover:underline underline-offset-4"
            >
              Submit your application today <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats/Features */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          <FeatureCard
            icon={Users}
            title="Massive Reach"
            desc="Connect with an engaged audience across every state and language of India."
          />
          <FeatureCard
            icon={Star}
            title="Premium Tools"
            desc="High-end dashboard to manage your content, analytics, and community."
          />
          <FeatureCard
            icon={CheckCircle2}
            title="Verified Status"
            desc="Get the blue checkmark and build trust with your followers instantly."
          />
        </div>
      </section>

      {/* Modern Minimal Footer */}
      <footer className="bg-white pt-20 pb-10 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <img src="/logo%20omh.png" alt="OMH Logo" className="w-16 h-16 object-contain mb-8" />
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-12 text-sm font-semibold text-gray-400">
            <a href="#" className="hover:text-red-600 transition-colors">About</a>
            <a href="#" className="hover:text-red-600 transition-colors">Creators</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onTermsClick(); }} className="hover:text-red-600 transition-colors">Terms</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onPrivacyClick(); }} className="hover:text-red-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-red-600 transition-colors">Contact</a>
          </div>
          <p className="text-gray-400 text-xs font-medium tracking-wide">
            © 2026 OH MY HINDUSTAN. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-2">
      <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
