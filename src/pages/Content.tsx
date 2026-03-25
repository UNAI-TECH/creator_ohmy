import React, { useState, useEffect } from 'react';
import { 
  Filter, Eye, Globe2, AlertCircle, FileText, Newspaper, Video, TrendingUp,
  MessageSquare, ThumbsUp, ChevronDown, Trash2, Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { contentService, CreatorPost } from '../services/contentService';

const tabs = ['All', 'Blogs', 'News', 'Videos'];

const TYPE_COLORS: Record<string, string> = {
  blog: '#8B5CF6',
  news: '#0EA5E9',
  video: '#EF4444',
  update: '#6366F1',
};

const TYPE_ICONS: Record<string, any> = {
  blog: FileText,
  news: Newspaper,
  video: Video,
  update: TrendingUp,
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
};

export default function Content() {
  const [activeTab, setActiveTab] = useState('All');
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await contentService.getMyPosts();
      setPosts(data);
    } catch (e) {
      console.warn('Failed to fetch posts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchPosts(); 
    const sub = contentService.subscribeToMyPostUpdates(() => {
      fetchPosts();
    });
    return () => { sub.unsubscribe(); };
  }, []);

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this content? This cannot be undone.')) return;
    try {
      await contentService.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (e) {
      alert('Failed to delete. Please try again.');
    }
  };

  // Filter posts
  const filtered = posts.filter(p => {
    if (activeTab === 'Blogs' && p.type !== 'blog') return false;
    if (activeTab === 'News' && p.type !== 'news') return false;
    if (activeTab === 'Videos' && p.type !== 'video') return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-[1600px] mx-auto pb-10 w-full animate-in fade-in duration-300">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Channel content</h1>
      
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-sm font-medium whitespace-nowrap transition-colors relative",
              activeTab === tab ? "text-[#065fd4]" : "text-[#606060] hover:text-[#0f0f0f]"
            )}
          >
            {tab}
            {tab !== 'All' && (
              <span className="ml-1 text-xs text-gray-400">
                ({posts.filter(p => p.type === tab.toLowerCase().slice(0, -1) || (tab === 'Blogs' && p.type === 'blog') || (tab === 'News' && p.type === 'news') || (tab === 'Videos' && p.type === 'video')).length})
              </span>
            )}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#065fd4] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
        {/* Search + Filter Bar */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 text-sm text-[#606060]">
          <Search className="w-5 h-5 text-[#606060]" />
          <input 
            type="text" 
            placeholder="Search content..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none placeholder-[#606060] text-[#0f0f0f]"
          />
        </div>

        {/* Content List/Table */}
        <div className="flex-1 overflow-y-auto relative">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                Loading content...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium">No content found</p>
              <p className="text-xs text-gray-400 mt-1">
                {posts.length === 0 
                  ? 'Click CREATE to publish your first piece of content!' 
                  : 'Try a different filter or search term.'}
              </p>
            </div>
          ) : (
            <div className="w-full">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-sm text-[#606060] bg-white">
                      <th className="py-4 px-6 font-medium w-[45%]">Content</th>
                      <th className="py-4 px-6 font-medium w-[12%]">Type</th>
                      <th className="py-4 px-6 font-medium w-[12%]">Status</th>
                      <th className="py-4 px-6 font-medium w-[12%]">Date</th>
                      <th className="py-4 px-6 font-medium text-right w-[8%]">Votes</th>
                      <th className="py-4 px-6 font-medium text-right w-[8%]">Comments</th>
                      <th className="py-4 px-6 font-medium text-right w-[5%]"></th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100 bg-white">
                    {filtered.map((post) => {
                      const TypeIcon = TYPE_ICONS[post.type] || FileText;
                      return (
                        <tr key={post.id} className="hover:bg-[#f9f9f9] transition-colors group relative">
                          <td className="py-4 px-6">
                            <div className="flex gap-4">
                              <div className="relative w-32 aspect-video rounded-lg bg-gray-200 overflow-hidden shrink-0 cursor-pointer shadow-sm">
                                {post.thumbnail ? (
                                  <img src={post.thumbnail} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={post.title} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <TypeIcon className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                                {post.video_duration && (
                                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                                    {post.video_duration}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col min-w-0 pr-4 justify-center">
                                <div className="font-bold text-gray-900 line-clamp-2 cursor-pointer mb-1 group-hover:text-red-600 transition-colors leading-tight">
                                  {post.title}
                                </div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{post.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 align-top pt-6">
                            <span 
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase"
                              style={{ backgroundColor: (TYPE_COLORS[post.type] || '#6366F1') + '15', color: TYPE_COLORS[post.type] || '#6366F1' }}
                            >
                              <TypeIcon className="w-3.5 h-3.5" />
                              {post.type}
                            </span>
                          </td>
                          <td className="py-4 px-6 align-top pt-6">
                            <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs uppercase tracking-wider">
                              <Globe2 className="w-4 h-4" />
                              <span>{post.visibility}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 align-top pt-6 text-gray-500">
                            <div className="text-xs font-bold">{formatDate(post.created_at)}</div>
                            <div className="text-[10px] uppercase font-black tracking-tighter opacity-50">Published</div>
                          </td>
                          <td className="py-4 px-6 align-top pt-8 text-right font-black text-gray-900">
                            {post.vote_count}
                          </td>
                          <td className="py-4 px-6 align-top pt-8 text-right font-black text-gray-900">
                            {post.comment_count}
                          </td>
                          <td className="py-4 px-6 align-top pt-6 text-right">
                            <button 
                              onClick={() => handleDelete(post.id)} 
                              className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-100">
                {filtered.map((post) => {
                  const TypeIcon = TYPE_ICONS[post.type] || FileText;
                  return (
                    <div key={post.id} className="p-4 flex flex-col gap-4 active:bg-gray-50 transition-colors">
                      <div className="flex gap-4">
                        <div className="relative w-28 aspect-video rounded-xl bg-gray-100 overflow-hidden shrink-0 shadow-sm border border-gray-100">
                          {post.thumbnail ? (
                            <img src={post.thumbnail} className="w-full h-full object-cover" alt={post.title} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <TypeIcon className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                          {post.video_duration && (
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest scale-90">
                              {post.video_duration}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug mb-1">{post.title}</h3>
                          <div className="flex items-center gap-2">
                             <span 
                               className="text-[10px] font-black uppercase tracking-widest"
                               style={{ color: TYPE_COLORS[post.type] || '#6366F1' }}
                             >
                               {post.type}
                             </span>
                             <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{post.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-gray-900">{post.vote_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-gray-900">{post.comment_count}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] uppercase tracking-tighter opacity-70">{formatDate(post.created_at)}</span>
                          <button 
                            onClick={() => handleDelete(post.id)} 
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
