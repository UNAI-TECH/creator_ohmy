import React, { useState, useEffect } from 'react';
import { 
  Filter, Eye, Globe2, AlertCircle, FileText, Newspaper, Video, TrendingUp,
  MessageSquare, ThumbsUp, ThumbsDown, ChevronDown, Trash2, Search,
  Edit3, Pause, Play, X, ImagePlus, Film, Save
} from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import { cn } from '../lib/utils';
import { contentService, CreatorPost } from '../services/contentService';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';

const tabs = ['All', 'Headlines', 'Articles', 'Videos'];

const CATEGORIES = [
  'Politics', 'Economy', 'Digital India', 'Policy', 'Viksit Bharat',
  'Sports', 'Entertainment', 'Technology', 'Health', 'Education', 'General', 'Custom'
];

const TYPE_COLORS: Record<string, string> = {
  blog: '#8B5CF6',
  news: '#0EA5E9',
  video: '#EF4444',
  update: '#6366F1',
};

const TYPE_LABELS: Record<string, string> = {
  blog: 'Headline',
  news: 'Article',
  video: 'Video',
  update: 'Update',
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

// Sub-component for Editing
function EditContentModal({ post, onClose, onUpdate }: { post: CreatorPost, onClose: () => void, onUpdate: () => void }) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  // Normalize category state: use 'Custom' for the UI even if DB value is 'custom'
  const initialCategory = post.category === 'custom' ? 'Custom' : post.category;
  const [category, setCategory] = useState(initialCategory);
  const [customCategory, setCustomCategory] = useState(post.custom_category || '');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(post.thumbnail);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(post.video_url);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || (!category && post.type !== 'video')) {
      error('Please fill in title, content, and category.');
      return;
    }
    const isCustom = category === 'Custom' || category === 'custom';
    if (isCustom && !customCategory.trim()) {
      error('Please enter a custom category name.');
      return;
    }

    setIsSaving(true);
    try {
      let thumbnailUrl = post.thumbnail || undefined;
      if (thumbnailFile) {
        thumbnailUrl = await contentService.uploadMedia(thumbnailFile, 'thumbnails');
      }

      let videoUrl = post.video_url || undefined;
      if (videoFile && post.type === 'video') {
        videoUrl = await contentService.uploadVideo(videoFile);
      }

      const isCustom = category === 'Custom' || category === 'custom';
      await contentService.updatePost(post.id, {
        title: title.trim(),
        content,
        category: isCustom ? 'custom' : category,
        custom_category: isCustom ? customCategory.trim() : null,
        thumbnail: thumbnailUrl,
        video_url: videoUrl,
      });

      success('Content updated successfully!');
      onUpdate();
      onClose();
    } catch (e: any) {
      error('Update failed: ' + (e.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-blue-600" />
             </div>
             <div>
               <h2 className="text-lg font-bold text-gray-900">Edit {post.type.charAt(0).toUpperCase() + post.type.slice(1)}</h2>
               <p className="text-xs text-gray-500">Update your content details</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Title *</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Category *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const isSelected = category === cat || (cat === 'Custom' && category === 'custom');
                return (
                  <button 
                    key={cat} 
                    onClick={() => setCategory(cat)} 
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold border transition-all uppercase tracking-widest", 
                      isSelected
                        ? "bg-red-600 border-red-600 text-white shadow-md" 
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            {(category === 'Custom' || category === 'custom' || category === 'Custom') && (
              <div className="mt-3 animate-in slide-in-from-top-2">
                <input 
                  type="text" 
                  value={customCategory} 
                  onChange={e => setCustomCategory(e.target.value)} 
                  placeholder="Enter custom category..." 
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none" 
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Content *</label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              minHeight="250px"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Thumbnail</label>
              <div className="relative group aspect-video rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-blue-400 bg-gray-50 transition-colors">
                {thumbnailPreview ? (
                  <>
                    <img src={thumbnailPreview} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer p-3 bg-white rounded-full text-gray-900 shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                        <ImagePlus className="w-6 h-6" />
                        <input type="file" className="hidden" accept="image/*" onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setThumbnailFile(file);
                            setThumbnailPreview(URL.createObjectURL(file));
                          }
                        }} />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <ImagePlus className="w-8 h-8 text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase mt-2">Upload Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setThumbnailFile(file);
                        setThumbnailPreview(URL.createObjectURL(file));
                      }
                    }} />
                  </label>
                )}
              </div>
            </div>

            {post.type === 'video' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Reupload Video</label>
                  {(() => {
                    const publishedDate = new Date(post.created_at).getTime();
                    const now = Date.now();
                    const hoursPassed = (now - publishedDate) / (1000 * 60 * 60);
                    const isLocked = hoursPassed < 24;
                    const hoursLeft = Math.ceil(24 - hoursPassed);
                    
                    if (isLocked) {
                      return (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 uppercase tracking-tight">
                          <AlertCircle className="w-3 h-3" />
                          Wait {hoursLeft}h to reupload
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className={cn(
                  "relative group aspect-video rounded-xl overflow-hidden border-2 border-dashed transition-colors",
                  (() => {
                    const isLocked = (Date.now() - new Date(post.created_at).getTime()) < 24 * 60 * 60 * 1000;
                    return isLocked 
                      ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60" 
                      : "border-gray-200 hover:border-red-400 bg-gray-50";
                  })()
                )}>
                  {videoPreview ? (
                    <>
                      <video src={videoPreview} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         {(() => {
                            const isLocked = (Date.now() - new Date(post.created_at).getTime()) < 24 * 60 * 60 * 1000;
                            if (isLocked) return <AlertCircle className="w-8 h-8 text-white shadow-xl" />;
                            return (
                              <label className="cursor-pointer p-3 bg-white rounded-full text-gray-900 shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                <Film className="w-6 h-6" />
                                <input type="file" className="hidden" accept="video/*" onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setVideoFile(file);
                                    setVideoPreview(URL.createObjectURL(file));
                                  }
                                }} />
                              </label>
                            );
                         })()}
                      </div>
                    </>
                  ) : (
                    <label className={cn(
                      "w-full h-full flex flex-col items-center justify-center",
                      (Date.now() - new Date(post.created_at).getTime()) < 24 * 60 * 60 * 1000 ? "cursor-not-allowed" : "cursor-pointer"
                    )}>
                      <Film className="w-8 h-8 text-gray-300" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase mt-2">Reupload Video</span>
                      {(() => {
                        const isLocked = (Date.now() - new Date(post.created_at).getTime()) < 24 * 60 * 60 * 1000;
                        if (!isLocked) {
                          return (
                            <input type="file" className="hidden" accept="video/*" onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setVideoFile(file);
                                setVideoPreview(URL.createObjectURL(file));
                              }
                            }} />
                          );
                        }
                      })()}
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-4 sticky bottom-0 bg-white">
          <button onClick={onClose} disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-black tracking-widest uppercase transition-all shadow-lg shadow-red-100 flex items-center gap-2"
          >
            {isSaving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Content() {
  const [activeTab, setActiveTab] = useState('All');
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [editingPost, setEditingPost] = useState<CreatorPost | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { confirm } = useModal();
  const { success, error: showToastError } = useToast();
  
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
    const isConfirmed = await confirm({
      title: 'Delete content',
      message: 'Are you sure you want to delete this content? This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger'
    });
    
    if (!isConfirmed) return;
    
    try {
      await contentService.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      success('Content deleted successfully.');
    } catch (e) {
      showToastError('Failed to delete content.');
    }
  };

  const handleToggleActive = async (post: CreatorPost) => {
    const newState = !post.is_active;
    try {
      // Optimistic update
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_active: newState } : p));
      
      await contentService.updatePost(post.id, { is_active: newState });
      success(newState ? 'Content is now live!' : 'Content has been paused.');
    } catch (e) {
      // Rollback
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_active: !newState } : p));
      showToastError('Failed to update status.');
    }
  };

  const handleEditClick = (post: CreatorPost) => {
    setEditingPost(post);
    setShowEditModal(true);
  };

  // Filter posts
  const filtered = posts.filter(p => {
    if (activeTab === 'Headlines' && p.type !== 'blog') return false;
    if (activeTab === 'Articles' && p.type !== 'news') return false;
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
                ({posts.filter(p => (tab === 'Headlines' && p.type === 'blog') || (tab === 'Articles' && p.type === 'news') || (tab === 'Videos' && p.type === 'video')).length})
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
                      <th className="py-4 px-6 font-medium w-[30%]">Content</th>
                      <th className="py-4 px-6 font-medium w-[10%]">Type</th>
                      <th className="py-4 px-6 font-medium w-[10%]">Status</th>
                      <th className="py-4 px-6 font-medium w-[15%]">Date</th>
                      <th className="py-4 px-4 font-medium text-right w-[6%]">Views</th>
                      <th className="py-4 px-4 font-medium text-right w-[6%]">Likes</th>
                      <th className="py-4 px-4 font-medium text-right w-[6%]">Dislikes</th>
                      <th className="py-4 px-4 font-medium text-right w-[6%]">Comments</th>
                      <th className="py-4 px-4 font-medium text-right w-[11%]"></th>
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
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  {post.category === 'custom' ? post.custom_category : post.category}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 align-top pt-6">
                            <span 
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase"
                              style={{ backgroundColor: (TYPE_COLORS[post.type] || '#6366F1') + '15', color: TYPE_COLORS[post.type] || '#6366F1' }}
                            >
                              <TypeIcon className="w-3.5 h-3.5" />
                              {TYPE_LABELS[post.type] || post.type}
                            </span>
                          </td>
                          <td className="py-4 px-6 align-top pt-6">
                            <div className={cn(
                              "flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider",
                              post.is_active ? "text-green-600" : "text-amber-500"
                            )}>
                              {post.is_active ? <Globe2 className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                              <span>{post.is_active ? post.visibility : 'Paused'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 align-top pt-6 text-gray-500">
                            <div className="text-xs font-bold">{formatDate(post.created_at)}</div>
                            <div className="text-[10px] uppercase font-black tracking-tighter opacity-50">Published</div>
                          </td>
                          <td className="py-4 px-4 align-top pt-8 text-right font-black text-gray-900 border-l border-gray-50/50">
                            <div className="flex items-center justify-end gap-1.5"><Eye className="w-3.5 h-3.5 text-gray-400" />{post.view_count}</div>
                          </td>
                          <td className="py-4 px-4 align-top pt-8 text-right font-black text-gray-900">
                            <div className="flex items-center justify-end gap-1.5"><ThumbsUp className="w-3.5 h-3.5 text-blue-500" />{post.like_count}</div>
                          </td>
                          <td className="py-4 px-4 align-top pt-8 text-right font-black text-gray-900">
                            <div className="flex items-center justify-end gap-1.5"><ThumbsDown className="w-3.5 h-3.5 text-red-500" />{post.dislike_count}</div>
                          </td>
                          <td className="py-4 px-4 align-top pt-8 text-right font-black text-gray-900">
                            <div className="flex items-center justify-end gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-amber-500" />{post.comment_count}</div>
                          </td>
                          <td className="py-4 px-4 align-top pt-6 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <button 
                                onClick={() => handleToggleActive(post)} 
                                className={cn(
                                  "p-2 rounded-full transition-colors",
                                  post.is_active ? "hover:bg-amber-50 text-amber-500" : "hover:bg-green-50 text-green-600"
                                )}
                                title={post.is_active ? "Pause" : "Resume"}
                              >
                                {post.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => handleEditClick(post)} 
                                className="p-2 hover:bg-blue-50 text-blue-500 rounded-full transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(post.id)} 
                                className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
                               {TYPE_LABELS[post.type] || post.type}
                             </span>
                             <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                               {post.category === 'custom' ? post.custom_category : post.category}
                             </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                          <div className="flex items-center gap-1.5 min-w-max">
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-gray-900">{post.view_count}</span>
                          </div>
                          <div className="w-px h-3 bg-gray-300"></div>
                          <div className="flex items-center gap-1.5 min-w-max">
                            <ThumbsUp className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-gray-900">{post.like_count}</span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-max">
                            <ThumbsDown className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-gray-900">{post.dislike_count}</span>
                          </div>
                          <div className="w-px h-3 bg-gray-300"></div>
                          <div className="flex items-center gap-1.5 min-w-max">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-gray-900">{post.comment_count}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleToggleActive(post)} 
                            className={cn(
                              "p-2 rounded-lg transition-colors border",
                              post.is_active ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-green-50 border-green-100 text-green-600"
                            )}
                          >
                            {post.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          <button 
                            onClick={() => handleEditClick(post)} 
                            className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(post.id)} 
                            className="p-2 bg-red-50 border border-red-100 text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {showEditModal && editingPost && (
                <EditContentModal 
                  key={editingPost.id}
                  post={editingPost} 
                  onClose={() => { setShowEditModal(false); setEditingPost(null); }}
                  onUpdate={fetchPosts}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
