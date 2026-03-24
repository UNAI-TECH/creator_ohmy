import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, ExternalLink, Users, PlaySquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { profileService } from '../services/profileService';
import { contentService } from '../services/contentService';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('PUBLISHED');
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const fetchProfileData = async () => {
    try {
      const p = await profileService.getProfile();
      setProfile(p);
      const s = await contentService.getMyStats();
      setStats(s);
      const ps = await contentService.getMyPosts();
      setPosts(ps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    const sub = contentService.subscribeToMyPostUpdates(() => {
      fetchProfileData();
    });
    return () => { sub?.unsubscribe(); };
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await contentService.uploadMedia(file, 'profiles');
      if (type === 'avatar') {
        await profileService.updateProfile({ avatarUrl: url });
        setProfile({ ...profile, avatarUrl: url });
      } else {
        // Save cover image URL to User table
        await profileService.updateProfile({ coverUrl: url });
        setProfile({ ...profile, coverUrl: url }); 
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload image. Check permissions.');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500 animate-pulse">Loading profile data...</div>;
  }

  const coverUrl = profile?.coverUrl || "https://picsum.photos/seed/cover/1200/400";
  const avatarUrl = profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.username || 'U')}&background=E31E24&color=fff`;

  const publishedPosts = posts.filter(p => p.published);

  return (
    <div className="max-w-[1200px] mx-auto pb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cover Photo */}
      <div className="relative h-48 sm:h-64 bg-gray-100 rounded-b-3xl overflow-hidden group">
        <img 
          src={coverUrl} 
          alt="Cover" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all"></div>
        <input 
          type="file" accept="image/*" className="hidden" 
          ref={coverInputRef} onChange={e => handleUpload(e, 'cover')} 
        />
        <button 
          onClick={() => coverInputRef.current?.click()}
          className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-xl text-sm font-semibold shadow-sm transition-all border border-gray-200"
        >
          <Camera className="w-4 h-4" />
          <span>Edit cover photo</span>
        </button>
      </div>

      <div className="px-6 sm:px-12 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          <div className="relative group -mt-16 sm:-mt-20">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center text-white text-5xl font-bold shadow-xl overflow-hidden">
              <img 
                src={avatarUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <input 
              type="file" accept="image/*" className="hidden" 
              ref={avatarInputRef} onChange={e => handleUpload(e, 'avatar')} 
            />
            <button 
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-2 right-2 p-2 bg-gray-900 text-white rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{profile.username}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500 text-sm font-medium">@{profile.username?.toLowerCase().replace(/\s+/g, '')}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500 text-sm font-medium">{stats?.totalFollowers || 0} subscribers</span>
                </div>
                {profile.bio && (
                  <p className="text-sm text-gray-600 mt-2 max-w-md">{profile.bio}</p>
                )}
                <button className="flex items-center gap-1.5 text-blue-600 text-sm font-semibold mt-2 hover:underline">
                  More about this channel <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full text-sm font-bold transition-colors">
                  Customize channel
                </button>
                <button className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full text-sm font-bold transition-colors">
                  Manage videos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Callout */}
      <div className="mx-6 sm:mx-12 mt-12 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">Connect with your Community</div>
            <div className="text-xs text-gray-500">Introducing a new space where viewers can start discussions with you and your audience.</div>
          </div>
        </div>
        <button className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm">
          Turn on my Community
        </button>
      </div>

      {/* Content Section */}
      <div className="mx-6 sm:mx-12 mt-12 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/20">
          <nav className="flex px-6" aria-label="Tabs">
            {['PUBLISHED', 'SCHEDULED', 'ARCHIVED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-4 px-6 text-xs font-black tracking-widest transition-all relative",
                  activeTab === tab
                    ? "text-gray-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-10">
          {activeTab === 'PUBLISHED' && publishedPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedPosts.map(post => (
                <div key={post.id} className="border border-gray-100 rounded-2xl overflow-hidden group hover:shadow-md transition-all">
                  {post.thumbnail ? (
                    <img src={post.thumbnail} alt={post.title} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                      <PlaySquare className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 truncate">{post.title}</h3>
                    <div className="flex gap-4 mt-3 text-xs text-gray-500 font-medium">
                      <span>{post.vote_count} votes</span>
                      <span>{post.comment_count} comments</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-6 shadow-inner">
                <PlaySquare className="w-10 h-10 text-gray-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Publish post</h2>
              <p className="text-sm text-gray-500 max-w-sm">
                Posts appear here after you publish and will be visible to your community
              </p>
              <button className="mt-8 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-black tracking-wide transition-all shadow-lg shadow-red-100">
                CREATE POST
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
