import React, { useState, useEffect } from 'react';
import { 
  Filter, Search, Globe, ChevronDown, 
  Plus, Settings, Edit2, Trash2, FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { contentService, CreatorPost } from '../services/contentService';

const availableLanguages = ['All Languages', 'English', 'Spanish', 'Hindi', 'French', 'German', 'Japanese'];

export default function Subtitles() {
  const [selectedLanguage, setSelectedLanguage] = useState('All Languages');
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<CreatorPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      const allPosts = await contentService.getMyPosts();
      setVideos(allPosts.filter(p => p.type === 'video'));
    } catch (e) {
      console.warn('Failed to fetch videos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    const sub = contentService.subscribeToMyPostUpdates(() => {
      fetchVideos();
    });
    return () => { sub?.unsubscribe(); };
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedVideo(expandedVideo === id ? null : id);
  };

  const filteredVideos = videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-[1200px] mx-auto pb-12 w-full animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Channel subtitles</h1>
      </div>
      
      {/* Search and Language Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search for a video..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <select 
              className="appearance-none pl-10 pr-10 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm font-medium text-gray-700 transition-colors outline-none cursor-pointer"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {availableLanguages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <Globe className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Videos List Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <div className="col-span-6 pl-4">Video</div>
            <div className="col-span-3">Languages</div>
            <div className="col-span-3 text-right pr-4">Modified</div>
          </div>

          <div className="divide-y divide-gray-100">
            {loading ? (
               <div className="p-8 text-center text-gray-400 animate-pulse">Loading videos...</div>
            ) : filteredVideos.length > 0 ? filteredVideos.map((video) => (
              <div key={video.id} className="flex flex-col">
                <div 
                  className={cn(
                    "grid grid-cols-12 gap-4 p-4 items-center cursor-pointer group hover:bg-gray-50/50 transition-colors",
                    expandedVideo === video.id && "bg-blue-50/30"
                  )}
                  onClick={() => toggleExpand(video.id)}
                >
                  <div className="col-span-6 flex gap-4 pr-4">
                    <div className="relative w-32 aspect-video rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Filter className="w-6 h-6 text-gray-200"/></div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <div className="font-bold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2">
                        {video.title}
                      </div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{new Date(video.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div className="col-span-3 flex items-center">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-700 uppercase tracking-widest">
                      <Globe className="w-3 h-3" />
                      1
                    </div>
                  </div>

                  <div className="col-span-3 flex items-center justify-end pr-4 text-xs font-bold text-gray-500 gap-4">
                    <span>{new Date(video.updated_at).toLocaleDateString()}</span>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-gray-400 transition-transform duration-300",
                      expandedVideo === video.id ? "rotate-180 text-red-600" : ""
                    )} />
                  </div>
                </div>

                {expandedVideo === video.id && renderLanguages(video)}
              </div>
            )) : (
              <div className="p-12 text-center text-gray-400">No videos yet.</div>
            )}
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
             <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : filteredVideos.length > 0 ? filteredVideos.map((video) => (
            <div key={video.id} className="flex flex-col">
              <div 
                className={cn(
                  "p-4 flex gap-4 active:bg-gray-50 transition-colors",
                  expandedVideo === video.id && "bg-red-50/10"
                )}
                onClick={() => toggleExpand(video.id)}
              >
                <div className="relative w-24 aspect-video rounded-lg overflow-hidden shrink-0 border border-gray-100">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                       <Filter className="w-5 h-5 text-gray-200"/>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight">{video.title}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">1 Language</span>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-gray-400 transition-transform",
                      expandedVideo === video.id && "rotate-180 text-red-600"
                    )} />
                  </div>
                </div>
              </div>
              {expandedVideo === video.id && renderLanguages(video, true)}
            </div>
          )) : (
            <div className="p-12 text-center text-gray-400 text-sm">No videos found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Helper for Language expansion */
function renderLanguages(video: CreatorPost, isMobile = false) {
  if (isMobile) {
    return (
      <div className="bg-gray-50/50 p-4 border-t border-gray-100 animate-in fade-in duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">English</span>
            <span className="px-1.5 py-0.5 bg-white border border-gray-200 text-gray-400 rounded text-[8px] font-black uppercase tracking-tighter">Original</span>
          </div>
          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Published</span>
        </div>
        <div className="flex items-center justify-between">
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Modified: {new Date(video.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-100 p-0 animate-in slide-in-from-top-1 fade-in duration-200">
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50/30 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        <div className="col-span-6 pl-40">Language</div>
        <div className="col-span-3">Status</div>
        <div className="col-span-3">Modified</div>
      </div>
      <div className="divide-y divide-gray-50">
        <div className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-50/50 transition-colors group/lang">
          <div className="col-span-6 pl-40 flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">English</span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-black uppercase tracking-widest">Original</span>
          </div>
          <div className="col-span-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-green-50 text-green-700 border-green-100">
              Published
            </span>
          </div>
          <div className="col-span-3 text-xs font-bold text-gray-500">
            {new Date(video.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
