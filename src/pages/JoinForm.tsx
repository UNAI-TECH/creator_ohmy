import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Mail, FileText, Globe, ArrowLeft, Loader2, CheckCircle, Building2, UserCircle2, Users } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 py-12">
      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-red-100 p-8 md:p-12 relative overflow-hidden">
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
          <p className="text-gray-500 mb-8">Join Hindusthan as a verified creator.</p>

          <div className="flex gap-4 mb-8">
            <button
              type="button"
              onClick={() => setRequestType('personal')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${requestType === 'personal' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-red-200 text-gray-500'}`}
            >
              <UserCircle2 className={requestType === 'personal' ? 'text-red-500' : 'text-gray-400'} size={28} />
              <span className="font-bold">Personal</span>
            </button>
            <button
              type="button"
              onClick={() => setRequestType('organization')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${requestType === 'organization' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-red-200 text-gray-500'}`}
            >
              <Building2 className={requestType === 'organization' ? 'text-red-500' : 'text-gray-400'} size={28} />
              <span className="font-bold">Organization</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {requestType === 'personal' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" required
                      value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-red-500 rounded-2xl outline-none transition-all"
                      placeholder="Rahul Sharma"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                    <input 
                      type="text" required maxLength={24}
                      value={formData.username} onChange={(e) => handleUsernameChange(e.target.value)}
                      className={`w-full pl-10 pr-12 py-4 bg-gray-50 border ${usernameStatus === 'taken' ? 'border-red-500 bg-red-50/50' : usernameStatus === 'available' ? 'border-green-500 bg-green-50/50' : 'border-transparent'} focus:bg-white focus:border-red-500 rounded-2xl outline-none transition-all`}
                      placeholder="rahul_sharma"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                      {usernameStatus === 'available' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                  </div>
                  {usernameStatus === 'taken' && (
                    <div className="mt-3">
                      <p className="text-red-500 text-sm font-semibold mb-2">Username is already taken. Try these:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map(s => (
                          <button
                            key={s} type="button" onClick={() => handleUsernameChange(s)}
                            className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 font-medium"
                          >
                            @{s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="email" required
                      value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                      required value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-red-500 rounded-2xl outline-none transition-all min-h-[120px]"
                      placeholder="Experienced journalist and political analyst..."
                    />
                  </div>
                </div>
              </>
            )}

            {requestType === 'organization' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Channel / Entity Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" required
                      value={formData.channelName} onChange={(e) => setFormData({...formData, channelName: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-red-500 rounded-2xl outline-none transition-all"
                      placeholder="Hindusthan Media Network"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Channel Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="email" required
                      value={formData.channelEmail} onChange={(e) => setFormData({...formData, channelEmail: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-red-500 rounded-2xl outline-none transition-all"
                      placeholder="contact@hindusthanmedia.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Content Categories</label>
                  <div className="flex flex-wrap gap-3">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat} type="button"
                        onClick={() => handleCategoryToggle(cat)}
                        className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
                          formData.category.includes(cat)
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Team / Employee Size</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="number" required min="1"
                      value={formData.employeeSize} onChange={(e) => setFormData({...formData, employeeSize: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-red-500 rounded-2xl outline-none transition-all"
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Channel Bio / Description</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <textarea 
                      required value={formData.channelBio} onChange={(e) => setFormData({...formData, channelBio: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-red-500 rounded-2xl outline-none transition-all min-h-[120px]"
                      placeholder="A leading media house focusing on..."
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Social Link (Optional)</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="url"
                  value={formData.socialLink}
                  onChange={(e) => setFormData({...formData, socialLink: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-red-500 rounded-2xl outline-none transition-all"
                  placeholder="https://youtube.com/c/hindusthan"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

            <button 
              type="submit"
              disabled={loading || (requestType === 'personal' && usernameStatus === 'taken')}
              className="w-full py-5 bg-red-600 text-white rounded-2xl text-lg font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-3 disabled:opacity-70 active:scale-95 mt-4"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Submit Application <Send className="w-5 h-5" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
