import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, ExternalLink, Users, PlaySquare, Eye
} from 'lucide-react';
import { cn } from '../lib/utils';
import { profileService } from '../services/profileService';
import { contentService } from '../services/contentService';
import { useToast } from '../context/ToastContext';
import CropperModal from '../components/CropperModal';
import EditProfileModal from '../components/EditProfileModal';

interface ProfileProps {
  onCreatePost?: () => void;
}

const formatNumber = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

export default function Profile({ onCreatePost }: ProfileProps) {
  const [activeTab, setActiveTab] = useState('PUBLISHED');
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error: showToastError } = useToast();
  
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [cropData, setCropData] = useState<{ src: string; type: 'avatar' | 'cover'; aspect: number; circular: boolean } | null>(null);

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

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropData({
        src: reader.result?.toString() || '',
        type,
        aspect: type === 'cover' ? 4 / 1 : 1, // Changed from 16:9 to 4:1 for a true banner look
        circular: type === 'avatar'
      });
    });
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleCropComplete = async (croppedFile: File) => {
    if (!cropData) return;
    try {
      const url = await contentService.uploadMedia(croppedFile, 'profiles');
      if (cropData.type === 'avatar') {
        await profileService.updateProfile({ avatarUrl: url });
        setProfile({ ...profile, avatarUrl: url });
      } else {
        await profileService.updateProfile({ coverUrl: url });
        setProfile({ ...profile, coverUrl: url }); 
      }
      success('Profile image updated!');
      setCropData(null);
    } catch (err) {
      showToastError('Failed to upload image.');
      setCropData(null);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500 animate-pulse">Loading profile data...</div>;
  }

  const coverUrl = profile?.coverUrl || "https://picsum.photos/seed/cover/1200/400";
  const avatarUrl = profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.username || 'U')}&background=E31E24&color=fff`;

  const displayedPosts = posts.filter(p => {
    if (activeTab === 'PUBLISHED') return (!p.status || p.status === 'PUBLISHED' || p.published) && p.is_active !== false;
    if (activeTab === 'SCHEDULED') return p.status === 'SCHEDULED';
    if (activeTab === 'ARCHIVED') return p.status === 'ARCHIVED';
    return false;
  });

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
          className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/90 hover:bg-white text-gray-900 rounded-xl text-[10px] sm:text-sm font-black uppercase tracking-widest shadow-sm transition-all border border-gray-200"
        >
          <Camera className="w-3.5 h-3.5 sm:w-4 h-4" />
          <span>Edit cover</span>
        </button>
      </div>

      <div className="px-6 lg:px-12 relative z-10 pb-8 border-b border-gray-100">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 text-center md:text-left">
          {/* Avatar Container */}
          <div className="relative group -mt-16 sm:-mt-24">
            <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-2xl overflow-hidden group-hover:scale-[1.02] transition-all duration-300">
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
              className="absolute bottom-2 right-2 p-2.5 bg-gray-900 text-white rounded-full border-2 border-white shadow-xl hover:bg-black transition-all hover:scale-110"
              title="Change Avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0 pt-4 pb-1">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1 justify-center md:justify-start">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                    {profile.channel_name || profile.username}
                  </h1>
                  <span className="hidden sm:inline px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded border border-blue-100">
                    Verified Creator
                  </span>
                </div>
                <p className="text-gray-500 text-base font-medium mb-4">@{profile.username}</p>
                
                {/* Modern Stats Bar */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-8 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-50 rounded-lg">
                       <Users className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 leading-none">{formatNumber(stats?.totalFollowers || 0)}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Subscribers</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-gray-100 hidden sm:block"></div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg">
                       <PlaySquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 leading-none">{formatNumber(stats?.totalPosts || 0)}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Content</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-gray-100 hidden sm:block"></div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-50 rounded-lg">
                       <Eye className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 leading-none">{formatNumber(stats?.totalViews || 0)}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Views</span>
                    </div>
                  </div>
                </div>

                {profile.bio && (
                  <div className="relative group max-w-2xl mx-auto md:mx-0">
                    <p className="text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap pl-4 border-l-2 border-gray-100 group-hover:border-red-200 transition-colors">
                      {profile.bio}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-row items-center justify-center gap-3">
                <button 
                  onClick={() => setShowEditProfile(true)}
                  className="px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] active:scale-95"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Removed Community Callout */}

      {/* Content Section */}
      <div className="mx-6 sm:mx-12 mt-12 rounded-3xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/20 overflow-x-auto no-scrollbar">
          <nav className="flex px-4 sm:px-6 whitespace-nowrap" aria-label="Tabs">
            {['PUBLISHED', 'SCHEDULED', 'ARCHIVED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-4 px-5 sm:px-6 text-[10px] sm:text-xs font-black tracking-widest transition-all relative",
                  activeTab === tab
                    ? "text-red-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-red-600 after:rounded-t-full"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-10">
          {displayedPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedPosts.map(post => (
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
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {activeTab === 'PUBLISHED' ? 'Publish post' : `No ${activeTab.toLowerCase()} posts`}
              </h2>
              <p className="text-sm text-gray-500 max-w-sm">
                {activeTab === 'PUBLISHED' 
                  ? 'Posts appear here after you publish and will be visible to your community'
                  : `Any posts you save as ${activeTab.toLowerCase()} will appear here.`}
              </p>
              <button 
                onClick={onCreatePost}
                className="mt-8 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-black tracking-wide transition-all shadow-lg shadow-red-100"
              >
                CREATE POST
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {cropData && (
        <CropperModal
          imageSrc={cropData.src}
          aspectRatio={cropData.aspect}
          circularCrop={cropData.circular}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropData(null)}
        />
      )}

      {showEditProfile && (
        <EditProfileModal
          currentProfile={profile}
          onClose={() => setShowEditProfile(false)}
          onSuccess={(p) => {
            setProfile(p);
            setShowEditProfile(false);
            success('Profile completely updated!');
          }}
        />
      )}
    </div>
  );
}
