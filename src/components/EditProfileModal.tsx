import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, Info } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { profileService } from '../services/profileService';

interface UserProfile {
  id: string;
  username: string;
  channel_name?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  username_updated_at?: string;
}

interface EditProfileModalProps {
  currentProfile: UserProfile;
  onClose: () => void;
  onSuccess: (updatedProfile: UserProfile) => void;
}

export default function EditProfileModal({ currentProfile, onClose, onSuccess }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    channel_name: currentProfile?.channel_name || '',
    username: currentProfile?.username || '',
    bio: currentProfile?.bio || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Realtime uniqueness check
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'locked'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [lockedMsg, setLockedMsg] = useState('');

  // Debounce check
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const checkUser = async () => {
      if (formData.username === currentProfile?.username) {
        setUsernameStatus('idle');
        return;
      }
      if (formData.username.length < 3) {
        setUsernameStatus('idle');
        return;
      }

      setUsernameStatus('checking');

      // Check 14-day lock rule if username is changing
      if (currentProfile?.username_updated_at) {
        const lastUpdated = new Date(currentProfile.username_updated_at);
        const daysDiff = (new Date().getTime() - lastUpdated.getTime()) / (1000 * 3600 * 24);
        if (daysDiff < 14) {
          setUsernameStatus('locked');
          setLockedMsg(`You can change username after ${Math.ceil(14 - daysDiff)} days`);
          return;
        }
      }

      // Check uniqueness globally
      try {
        const { data, error } = await supabase
          .from('User')
          .select('username')
          .eq('username', formData.username)
          .limit(1);

        if (data && data.length > 0) {
          setUsernameStatus('taken');
          const base = formData.username;
          setSuggestions([`${base}01`, `${base}_official`, `${base}_media`]);
        } else {
          setUsernameStatus('available');
          setSuggestions([]);
        }
      } catch (e: any) {
        console.error(e);
        setUsernameStatus('idle');
      }
    };

    timer = setTimeout(checkUser, 500);
    return () => clearTimeout(timer);
  }, [formData.username, currentProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus === 'taken' || usernameStatus === 'locked' || usernameStatus === 'checking') return;
    
    setLoading(true);
    setError('');
    
    try {
      const updates: any = {
        channel_name: formData.channel_name,
        bio: formData.bio,
      };

      if (formData.username !== currentProfile.username && usernameStatus === 'available') {
        updates.username = formData.username;
        updates.username_updated_at = new Date().toISOString();
      }

      const updated = await profileService.updateProfile(updates);
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}

          <form id="edit-profile" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Channel / Display Name
              </label>
              <input 
                type="text"
                value={formData.channel_name}
                onChange={(e) => setFormData({...formData, channel_name: e.target.value})}
                className="w-full p-4 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-xl outline-none transition-all"
                placeholder="Channel Name"
              />
              <p className="mt-2 text-xs text-gray-400">Independent from your @username. Usually your brand or real name.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                <input 
                  type="text"
                  maxLength={24}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  className={`w-full pl-10 pr-4 py-4 bg-gray-50 border ${
                    usernameStatus === 'taken' || usernameStatus === 'locked' ? 'border-red-500 bg-red-50' : 
                    usernameStatus === 'available' ? 'border-green-500 bg-green-50' : 'border-transparent'
                  } focus:border-red-500 focus:bg-white rounded-xl outline-none transition-all`}
                  placeholder="username"
                />
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                   {usernameStatus === 'available' && <Check className="w-5 h-5 text-green-500" />}
                </div>
              </div>

              {usernameStatus === 'locked' && (
                <div className="mt-2 flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg">
                  <Info className="w-4 h-4" /> {lockedMsg}
                </div>
              )}
              
              {usernameStatus === 'taken' && (
                <div className="mt-3">
                  <p className="text-red-500 text-xs font-semibold mb-2">Username is already taken. Try:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map(s => (
                      <button
                        key={s} type="button" onClick={() => setFormData({ ...formData, username: s })}
                        className="text-[10px] bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 font-bold uppercase tracking-wider"
                      >
                        @{s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Bio
              </label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full p-4 bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white rounded-xl outline-none transition-all min-h-[120px]"
                placeholder="Write something about yourself..."
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
          <button 
            type="button" onClick={onClose}
            className="flex-1 px-6 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" form="edit-profile"
            disabled={loading || usernameStatus === 'checking' || usernameStatus === 'locked' || usernameStatus === 'taken'}
            className="flex-1 px-6 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex justify-center items-center shadow-lg shadow-red-200 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
