import React from 'react';
import { DollarSign } from 'lucide-react';

export default function Earn() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/50 flex flex-col items-center justify-center -m-4 sm:-m-6 lg:-m-8 p-4">
      <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-red-500/40">
        <DollarSign size={40} className="text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Payments Infrastructure</h2>
      <p className="text-gray-500 max-w-md text-center">Global payout integrations, creator monetization, and finance dashboards are coming in the next platform update.</p>
      <span className="mt-8 px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-widest text-gray-400">Coming Soon</span>
    </div>
  );
}
