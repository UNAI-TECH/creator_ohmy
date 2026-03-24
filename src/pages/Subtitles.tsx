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
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 bg-white rounded-full text-sm font-medium transition-colors">
            <Settings className="w-4 h-4" />
            <span>Channel Language Settings</span>
          </button>
        </div>
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
          
          <button className="flex items-center justify-center p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 transition-colors tooltip" title="Advanced Filters">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Videos List Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-500">
          <div className="col-span-8 sm:col-span-6 pl-4">Video</div>
          <div className="col-span-4 sm:col-span-3">Languages</div>
          <div className="hidden sm:block sm:col-span-3 text-right pr-4">Modified</div>
        </div>

        {/* Video Rows */}
        <div className="divide-y divide-gray-100">
          {loading ? (
             <div className="p-8 text-center text-gray-500 animate-pulse">Loading videos...</div>
          ) : filteredVideos.length > 0 ? filteredVideos.map((video) => (
            <div key={video.id} className="flex flex-col transition-colors hover:bg-blue-50/30">
              
              {/* Main Video Row */}
              <div 
                className={cn(
                  "grid grid-cols-12 gap-4 p-4 items-center cursor-pointer group",
                  expandedVideo === video.id && "bg-blue-50/50"
                )}
                onClick={() => toggleExpand(video.id)}
              >
                <div className="col-span-8 sm:col-span-6 flex gap-4 pr-4">
                  <div className="relative w-24 sm:w-32 aspect-video rounded-lg overflow-hidden shrink-0 border border-gray-200 bg-gray-100">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Filter className="w-6 h-6 text-gray-300"/></div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {video.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(video.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div className="col-span-4 sm:col-span-3 flex items-center">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                    <Globe className="w-3.5 h-3.5" />
                    1
                  </div>
                </div>

                <div className="hidden sm:flex sm:col-span-3 items-center justify-end pr-4 text-sm text-gray-600 gap-4">
                  <span>{new Date(video.updated_at).toLocaleDateString()}</span>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-gray-400 transition-transform duration-300",
                    expandedVideo === video.id ? "rotate-180 text-blue-600" : "group-hover:text-gray-900"
                  )} />
                </div>
              </div>

              {/* Expanded Languages Details */}
              {expandedVideo === video.id && (
                <div className="bg-white border-t border-gray-100 p-0 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50/50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-3 pl-12 sm:pl-40">Language</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-3">Modified on</div>
                    <div className="col-span-3 text-right pr-4">Actions</div>
                  </div>
                  
                  <div className="divide-y divide-gray-50">
                    <div className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-50 transition-colors group/lang">
                      <div className="col-span-3 pl-12 sm:pl-40 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">English</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] uppercase font-bold tracking-wide">Original</span>
                      </div>
                      <div className="col-span-3 flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                          Published
                        </span>
                      </div>
                      <div className="col-span-3 text-sm text-gray-600">
                        {new Date(video.created_at).toLocaleDateString()}
                      </div>
                      <div className="col-span-3 flex justify-end pr-4 gap-2 opacity-0 group-hover/lang:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors tooltip" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors tooltip" title="Download">
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Add Language Button Row */}
                  <div className="px-4 py-4 bg-gray-50 pl-12 sm:pl-40 border-t border-gray-100 flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors shadow-sm">
                      <Plus className="w-4 h-4 text-blue-600" />
                      Add Language
                    </button>
                    <span className="text-xs text-gray-500">Feature coming soon.</span>
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="p-12 text-center text-gray-500">No videos published yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
