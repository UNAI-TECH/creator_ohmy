import React from 'react';
import { 
  AreaChart, Area, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Wallet, ArrowUpRight, Youtube, 
  Lock, Sparkles, Users, CheckCircle2, 
  ArrowRight, DollarSign, Globe
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const earningsData = [
  { day: '1', amount: 1200 },
  { day: '5', amount: 1500 },
  { day: '10', amount: 900 },
  { day: '15', amount: 2200 },
  { day: '20', amount: 1800 },
  { day: '25', amount: 3500 },
  { day: '30', amount: 4800 },
];

const pieData = [
  { name: 'Subscriptions', value: 60, color: '#3b82f6' },
  { name: 'Tips', value: 25, color: '#10b981' },
  { name: 'Affiliate', value: 15, color: '#8b5cf6' },
];

const GlassPanel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
    "bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2rem] shadow-xl shadow-gray-200/50 overflow-hidden",
    className
  )}>
    {children}
  </div>
);

export default function Earn() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/50 font-sans animate-in fade-in duration-700 relative -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      
      {/* Top Header & Progress */}
      <div className="max-w-[1200px] mx-auto w-full mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-100 italic font-black text-white text-xl">
              S
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Earning Platform</h1>
              <p className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Globe className="w-3 h-3" /> GLOBAL NETWORK
              </p>
            </div>
          </div>

          <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6">
            <div className="hidden sm:block">
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile Setup</span>
                <span className="text-[10px] font-black text-red-600">20%</span>
              </div>
              <div className="w-40 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="w-1/5 h-full bg-red-600 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
              </div>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm">
                  <img src={`https://i.pravatar.cc/150?u=${i+10}`} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                +42
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto relative">
        {/* LOCKED OVERLAY */}
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-10 rounded-[3rem] bg-white/40 backdrop-blur-md border border-white/60 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-blue-50 opacity-30 -z-10" />
            
            <motion.div 
              animate={{ scale: [1, 1.05, 1], rotate: [0, -2, 2, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-gray-300 relative"
            >
              <Lock className="w-10 h-10 text-white" />
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gray-900 rounded-[2.5rem] -z-10" 
              />
            </motion.div>

            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
              Rocket Your Earnings 🚀
            </h2>
            <p className="text-gray-500 font-medium mb-10 max-w-xs mx-auto leading-relaxed">
              Complete your first upload to unlock the full potential of your creator business and start receiving payouts.
            </p>

            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(184,134,11,0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="relative group overflow-hidden rounded-[2rem] p-[1.5px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-600 animate-gradient" />
              <div className="relative bg-gradient-to-r from-yellow-500 to-amber-600 px-10 py-5 rounded-[2rem] text-white font-black tracking-widest text-sm flex items-center gap-3 shadow-xl">
                START CREATING NOW 
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>

            <div className="mt-8 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Secure Payouts
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Direct Transfer
              </div>
            </div>
          </motion.div>

          <div className="mt-12 text-center animate-bounce">
            <span className="px-6 py-3 bg-white/80 backdrop-blur shadow-sm rounded-full text-sm font-black text-gray-900 border border-white">
              Join 50K+ Creators Earning on Oh-My!
            </span>
          </div>
        </div>

        {/* BLURRED BACKGROUND CONTENT */}
        <div className="blur-[12px] opacity-40 pointer-events-none select-none grayscale-[0.3]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Metrics */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex flex-col items-center py-12 bg-white rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -ml-32 -mb-32" />
                
                <p className="text-gray-400 text-sm font-black uppercase tracking-[0.2em] mb-4">Life-Time Revenue</p>
                <div className="flex items-center gap-3 mb-6 scale-110">
                  <h2 className="text-7xl font-black text-gray-900 tracking-tighter">₹1,20,000+</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-green-50 text-green-600 font-bold text-sm">
                    <TrendingUp className="w-4 h-4" /> +154% GROWTH
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 text-blue-600 font-bold text-sm">
                    <Users className="w-4 h-4" /> 2.4M IMPRESSIONS
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <GlassPanel className="p-10 flex flex-col justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
                    <DollarSign className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Pending Payout</p>
                  <p className="text-3xl font-black text-gray-900">₹25,000</p>
                </GlassPanel>

                <GlassPanel className="p-10 flex flex-col justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">MRR (Projected)</p>
                  <p className="text-3xl font-black text-gray-900">₹15,000</p>
                </GlassPanel>
              </div>

              <GlassPanel className="p-10">
                 <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center justify-between">
                   REVENUE PERFORMANCE
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-600" />
                     <span className="text-[10px] font-black uppercase">Earnings</span>
                   </div>
                 </h3>
                 <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={earningsData}>
                       <defs>
                         <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                           <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={4} fill="url(#colorAmount)" />
                     </AreaChart>
                   </ResponsiveContainer>
                 </div>
              </GlassPanel>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-8">
              <GlassPanel className="p-8">
                <h3 className="text-sm font-black text-gray-900 mb-8 uppercase tracking-widest">Revenue Streams</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={8} dataKey="value">
                        {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4 mt-8">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">{item.name}</span>
                      <span className="text-xs font-black text-gray-900">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </GlassPanel>

              {/* Testimonials Bubbles */}
              <div className="space-y-4">
                {[
                  { text: "Earned ₹45K in first month!", user: "@sarathcreates", color: "bg-blue-600" },
                  { text: "Best platform for independent creators.", user: "@neha_vlogs", color: "bg-red-600" }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm relative overflow-hidden"
                  >
                    <div className={cn("absolute top-0 left-0 w-1 h-full", item.color)} />
                    <p className="text-sm font-bold text-gray-800 leading-relaxed italic">"{item.text}"</p>
                    <p className="text-xs font-black text-red-600 mt-3">{item.user}</p>
                  </motion.div>
                ))}
              </div>

              <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] text-white shadow-xl">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                   <Sparkles className="w-5 h-5 text-yellow-400" />
                 </div>
                 <h4 className="text-lg font-black mb-2">Join Top 1%</h4>
                 <p className="text-xs text-gray-400 leading-relaxed mb-6 font-medium">Creators like you are making ₹50K/month average in their second year.</p>
                 <div className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-full text-[10px] font-black inline-flex">TOP CREATOR BADGE</div>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Confetti Hints (Visual Decorations) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-400 rounded-full blur-[1px] opacity-20" />
        <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-yellow-400 rounded-full blur-[1px] opacity-20" />
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-blue-400 rounded-full blur-[1px] opacity-20" />
      </div>

    </div>
  );
}
