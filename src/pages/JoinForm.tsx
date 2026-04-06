import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Mail, FileText, Globe, ArrowLeft, ArrowRight, Loader2, CheckCircle, Building2, UserCircle2, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface JoinFormProps {
  onBack: () => void;
  onSubmitSuccess: (email: string) => void;
}

export default function JoinForm({ onBack, onSubmitSuccess }: JoinFormProps) {
  const [requestType, setRequestType] = useState<'personal' | 'organization'>('personal');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    socialLink: '',
    channelName: '',
    channelEmail: '',
    category: [] as string[],
    employeeSize: '',
    channelBio: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Username check
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const CATEGORIES = ['Headlines (News)', 'Articles (Blogs)', 'Videos'];

  const handleCategoryToggle = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category.includes(cat) 
        ? prev.category.filter(c => c !== cat)
        : [...prev.category, cat]
    }));
  };

  const handleUsernameChange = (uname: string) => {
    const cleaned = uname.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData(prev => ({ ...prev, username: cleaned }));
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    if (cleaned.length < 3) {
      setUsernameStatus('idle');
      setSuggestions([]);
      return;
    }

    setUsernameStatus('checking');
    debounceTimer.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('creator_requests')
          .select('username')
          .ilike('username', cleaned)
          .limit(1);

        if (data && data.length > 0) {
          setUsernameStatus('taken');
          setSuggestions([
            `${cleaned}_01`,
            `${cleaned}_official`,
            `${cleaned}_media`
          ]);
        } else {
          setUsernameStatus('available');
          setSuggestions([]);
        }
      } catch (err) {
        setUsernameStatus('idle');
      }
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (requestType === 'personal' && usernameStatus === 'taken') {
      setError('Please choose a valid username before submitting.');
      setLoading(false);
      return;
    }

    try {
      let insertData: any = {
        request_type: requestType,
        social_link: formData.socialLink || null,
      };

      if (requestType === 'personal') {
        insertData = {
          ...insertData,
          name: formData.name,
          username: formData.username,
          email: formData.email,
          bio: formData.bio,
        };
      } else {
        insertData = {
          ...insertData,
          channel_name: formData.channelName,
          channel_email: formData.channelEmail,
          category: formData.category,
          employee_size: parseInt(formData.employeeSize) || 0,
          channel_bio: formData.channelBio,
          // Fallback basic fields requested by old constraint if any
          name: formData.channelName,
          email: formData.channelEmail,
          bio: formData.channelBio,
        };
      }

      const { error: insertError } = await supabase
        .from('creator_requests')
        .insert(insertData);

      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.code === '23505') {
          setError('An application with this email or username already exists.');
        } else {
          setError(insertError.message);
        }
        return;
      }

      onSubmitSuccess(requestType === 'personal' ? formData.email : formData.channelEmail);
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen soft-gradient flex flex-col items-center justify-center p-6 sm:p-12 font-sans selection:bg-red-100 selection:text-red-600 overflow-x-hidden">
      <div className="relative w-full max-w-5xl flex flex-col lg:block items-center justify-center min-h-[750px] lg:h-[650px] mt-8 lg:mt-0">
        
        {/* SECTION: FORM CARD */}
        <div 
          className={`w-full max-w-[460px] lg:absolute lg:top-1/2 lg:-translate-y-1/2 transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] z-20 
          ${requestType === 'personal' ? 'lg:left-0' : 'lg:left-[calc(100%-460px)]'}`}
        >
          <button 
            onClick={onBack}
            className="flex lg:hidden items-center gap-2 text-gray-400 hover:text-red-600 transition-all font-bold text-xs uppercase tracking-widest group mb-8 justify-center w-full"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>

          <div className="bg-white rounded-[32px] p-8 sm:p-10 card-shadow border border-gray-50 relative overflow-hidden">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-black text-gray-900 mb-1">
                 {requestType === 'personal' ? 'Solo Creator' : 'Organization'}
              </h2>
              <p className="text-gray-400 font-medium text-sm tracking-wide">Application Form</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {requestType === 'personal' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                      <input 
                        type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 focus:border-red-500/30 focus:bg-white rounded-xl outline-none transition-all font-medium text-sm text-gray-900 placeholder:text-gray-300"
                        placeholder="Rahul Sharma"
                      />
                    </div>
                  </div>

                  <div className="col-span-1 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username</label>
                    <div className="relative group">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 font-bold group-focus-within:text-red-500 transition-colors">@</span>
                      <input 
                        type="text" required maxLength={24} value={formData.username} onChange={(e) => handleUsernameChange(e.target.value)}
                        className={`w-full pl-8 pr-10 py-3 bg-gray-50 border ${usernameStatus === 'taken' ? 'border-red-500 bg-red-50/50' : usernameStatus === 'available' ? 'border-green-500 bg-green-50/50' : 'border-gray-100'} focus:border-red-500/30 focus:bg-white rounded-xl outline-none transition-all font-medium text-sm text-gray-900 placeholder:text-gray-300`}
                        placeholder="rahul"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />}
                        {usernameStatus === 'available' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                      <input 
                        type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 focus:border-red-500/30 focus:bg-white rounded-xl outline-none transition-all font-medium text-sm text-gray-900 placeholder:text-gray-300"
                        placeholder="you@email.com"
                      />
                    </div>
                  </div>

                  {usernameStatus === 'taken' && (
                    <div className="col-span-2">
                       <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-1.5">Username is taken. Try these:</p>
                       <div className="flex flex-wrap gap-2">
                         {suggestions.map(s => (
                           <button
                             key={s} type="button" onClick={() => handleUsernameChange(s)}
                             className="text-[10px] bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100 font-black tracking-wider"
                           >
                             @{s}
                           </button>
                         ))}
                       </div>
                    </div>
                  )}

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Short Bio</label>
                    <div className="relative group">
                      <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                      <textarea 
                        required value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 focus:border-red-500/30 focus:bg-white rounded-xl outline-none transition-all font-medium text-sm text-gray-900 placeholder:text-gray-300 min-h-[80px]"
                        placeholder="Tell us about your work..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {requestType === 'organization' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Entity Name</label>
                    <div className="relative group">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                      <input 
                        type="text" required value={formData.channelName} onChange={(e) => setFormData({...formData, channelName: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 focus:border-red-500/30 focus:bg-white rounded-xl outline-none transition-all font-medium text-sm text-gray-900 placeholder:text-gray-300"
                        placeholder="Media Network Ltd."
                      />
                    </div>
                  </div>

                  <div className="col-span-1 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Org Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                      <input 
                        type="email" required value={formData.channelEmail} onChange={(e) => setFormData({...formData, channelEmail: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 focus:border-red-500/30 focus:bg-white rounded-xl outline-none transition-all font-medium text-sm text-gray-900 placeholder:text-gray-300"
                        placeholder="contact@org.com"
                      />
                    </div>
                  </div>

                  <div className="col-span-1 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Team Size</label>
                    <div className="relative group">
                      <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                      <input 
                        type="number" required min="1" value={formData.employeeSize} onChange={(e) => setFormData({...formData, employeeSize: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 focus:border-red-500/30 focus:bg-white rounded-xl outline-none transition-all font-medium text-sm text-gray-900 placeholder:text-gray-300"
                        placeholder="e.g., 10"
                      />
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat} type="button" onClick={() => handleCategoryToggle(cat)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                            formData.category.includes(cat) ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-red-300'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Entity Description</label>
                    <div className="relative group">
                      <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                      <textarea 
                        required value={formData.channelBio} onChange={(e) => setFormData({...formData, channelBio: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 focus:border-red-500/30 focus:bg-white rounded-xl outline-none transition-all font-medium text-sm text-gray-900 placeholder:text-gray-300 min-h-[80px]"
                        placeholder="Describe your organization..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Social Link (Optional)</label>
                <div className="relative group">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                  <input 
                    type="url" value={formData.socialLink} onChange={(e) => setFormData({...formData, socialLink: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 focus:border-red-500/30 focus:bg-white rounded-xl outline-none transition-all font-medium text-sm text-gray-900 placeholder:text-gray-300"
                    placeholder="https://youtube.com/c/hindusthan"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  {error}
                </div>
              )}

              <button 
                type="submit" disabled={loading || (requestType === 'personal' && usernameStatus === 'taken')}
                className="w-full py-3.5 bg-red-600 text-white rounded-xl text-sm font-black tracking-widest uppercase hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2 mt-4 group disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Submit Application <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>}
              </button>
            </form>
          </div>
        </div>

        {/* SECTION: TEXT CONTENT (OPPOSITE SIDE) */}
        <div 
          className={`w-full max-w-[440px] mt-12 lg:mt-0 lg:absolute lg:top-1/2 lg:-translate-y-1/2 text-center lg:text-left transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] z-10 
          ${requestType === 'personal' ? 'lg:left-[calc(100%-440px)] lg:pl-12' : 'lg:left-0 lg:pr-12'}`}
        >
          <button 
            onClick={onBack}
            className="hidden lg:flex items-center gap-2 text-gray-400 hover:text-red-600 transition-all font-bold text-xs uppercase tracking-widest group mb-10"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>

          {requestType === 'personal' ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h1 className="text-5xl sm:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight">
                Are you an<br />
                <span className="text-red-600">Organization?</span>
              </h1>
              <p className="text-gray-500 text-base sm:text-lg mt-6 max-w-sm mx-auto lg:mx-0 font-medium leading-relaxed">
                Represent a media house or entity? Switch to our Organization track to unlock premium team management capabilities.
              </p>
              <button 
                type="button" onClick={(e) => { e.preventDefault(); setRequestType('organization'); }}
                className="mt-8 py-3.5 px-8 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-50 hover:border-red-200 transition-all card-shadow flex items-center justify-center lg:justify-start gap-3 mx-auto lg:mx-0 uppercase tracking-wider text-xs active:scale-95"
              >
                Apply as Organization <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="text-5xl sm:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight">
                Are you a<br />
                <span className="text-red-600">Solo Creator?</span>
              </h1>
              <p className="text-gray-500 text-base sm:text-lg mt-6 max-w-sm mx-auto lg:mx-0 font-medium leading-relaxed">
                Independent journalist or blogger? Switch to our personal track to establish your individual brand and audience.
              </p>
              <button 
                type="button" onClick={(e) => { e.preventDefault(); setRequestType('personal'); }}
                className="mt-8 py-3.5 px-8 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-50 hover:border-red-200 transition-all card-shadow flex items-center justify-center lg:justify-start gap-3 mx-auto lg:mx-0 uppercase tracking-wider text-xs active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" /> Apply as Solo Creator
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
