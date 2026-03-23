import React, { useState } from 'react';
import { Send, User, Mail, FileText, Globe, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface JoinFormProps {
  onBack: () => void;
  onSubmitSuccess: (email: string) => void;
}

export default function JoinForm({ onBack, onSubmitSuccess }: JoinFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    portfolioUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('creator_requests')
        .insert({
          name: formData.name,
          email: formData.email,
          bio: formData.bio,
          portfolio_url: formData.portfolioUrl || null,
        });

      if (insertError) {
        if (insertError.message.includes('duplicate')) {
          setError('An application with this email already exists.');
        } else {
          setError(insertError.message);
        }
        return;
      }

      onSubmitSuccess(formData.email);
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-red-100 p-8 md:p-12 relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 z-0"></div>
        
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-gray-400 hover:text-red-600 transition-colors mb-8 relative z-10"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-wider">Back</span>
        </button>

        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold mb-2">Creator Application</h2>
          <p className="text-gray-500 mb-10">Tell us a bit about yourself and your work.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-red-500 rounded-2xl outline-none transition-all"
                  placeholder="Rahul Sharma"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-red-500 rounded-2xl outline-none transition-all"
                  placeholder="rahul@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Short Bio</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <textarea 
                  required
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-red-500 rounded-2xl outline-none transition-all min-h-[120px]"
                  placeholder="Experienced journalist and political analyst..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Portfolio / Social Link (Optional)</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({...formData, portfolioUrl: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-red-500 rounded-2xl outline-none transition-all"
                  placeholder="https://twitter.com/rahul"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-red-600 text-white rounded-2xl text-lg font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-3 disabled:opacity-70 active:scale-95"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Submit Request <Send className="w-5 h-5" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
