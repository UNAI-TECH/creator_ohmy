import React, { useState, useEffect } from 'react';
import { 
  Filter, MessageSquare, ThumbsUp, ThumbsDown, 
  Heart, MoreVertical, Search, CornerDownRight, 
  Trash2, UserX
} from 'lucide-react';
import { cn } from '../lib/utils';
import { contentService, CreatorComment } from '../services/contentService';
import { supabase } from '../lib/supabaseClient';

const tabs = ['Published'];

const formatTimeAgo = (iso: string) => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  } catch { return ''; }
};

export default function Comments() {
  const [activeTab, setActiveTab] = useState('Published');
  const [comments, setComments] = useState<CreatorComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await contentService.getMyComments();
      // Group by top-level vs replies (optional, usually dashboard just shows them straight)
      // We will just show them straight but maybe indent replies later.
      setComments(data);
    } catch (e) {
      console.warn('Failed to fetch comments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    
    // Subscribe to any changes in Comments or Votes
    const channel = supabase
      .channel('creator-comments-dash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Comment' }, () => {
        fetchComments();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'CommentVote' }, () => {
        fetchComments();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleHeart = async (id: string, currentState: boolean) => {
    // Optimistic
    setComments(comments.map(c => c.id === id ? { ...c, hearted: !c.hearted } : c));
    try {
      await contentService.toggleCommentHeart(id, currentState);
    } catch (e) {
      setComments(comments); // simple rollback
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string, postId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const txt = replyText;
    setReplyingTo(null);
    setReplyText('');
    try {
      await contentService.replyToComment(postId, parentId, txt);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVote = async (id: string, type: 1 | -1) => {
    try {
      await contentService.voteComment(id, type);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this comment? It will also be removed from the app.")) return;
    
    // Optimistic
    setComments(comments.filter(c => c.id !== id));
    try {
      await contentService.deleteComment(id);
    } catch (e) {
      console.error(e);
      fetchComments(); // rollback
    }
  };

  const filtered = comments.filter(c => {
    if (searchQuery && !c.content.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !c.user.username.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-[1200px] mx-auto pb-12 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Channel comments</h1>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm transition-all outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-4 text-[13px] sm:text-[15px] font-black uppercase tracking-widest transition-colors relative",
              activeTab === tab ? "text-red-600" : "text-gray-400 hover:text-gray-900"
            )}
          >
            {tab}
            {tab === 'Published' && (
              <span className="ml-1 text-[10px] opacity-60">({comments.length})</span>
            )}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full shadow-[0_-2px_8px_rgba(239,68,68,0.4)]" />
            )}
          </button>
        ))}
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="py-16 text-center text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            Loading comments...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium">No comments yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Comments on your published content will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((comment) => (
            <div 
              key={comment.id} 
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all group"
            >
              <div className="flex gap-4 sm:gap-6">
                
                {/* Avatar */}
                <div className="shrink-0 relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-transparent group-hover:border-blue-100 transition-colors overflow-hidden bg-red-600 flex items-center justify-center text-white font-bold">
                    {comment.user.avatar_url ? (
                      <img src={comment.user.avatar_url} alt={comment.user.username} className="w-full h-full object-cover" />
                    ) : (
                      (comment.user.full_name || comment.user.username || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  {comment.hearted && (
                    <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                      <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                        <Heart className="w-2.5 h-2.5 text-red-500 fill-red-500" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                      {comment.user.full_name || comment.user.username}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{formatTimeAgo(comment.created_at)}</span>
                  </div>
                  
                  <p className="text-gray-800 text-[15px] leading-relaxed mb-3">
                    {comment.content}
                  </p>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button 
                      onClick={() => toggleHeart(comment.id, comment.hearted)} 
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        comment.hearted ? "text-red-500 hover:bg-red-50" : "text-gray-500 hover:text-red-500 hover:bg-red-50"
                      )}
                      title={comment.hearted ? "Remove heart" : "Heart comment"}
                    >
                      <Heart className={cn("w-4 h-4", comment.hearted && "fill-current")} />
                    </button>
                    
                    <button 
                      onClick={() => handleDeleteComment(comment.id)} 
                      className="p-2 ml-1 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="w-px h-4 bg-gray-200 mx-2 hidden sm:block"></div>

                    <button 
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="px-3 py-1.5 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Reply
                    </button>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-4 flex gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
                       <CornerDownRight className="w-5 h-5 text-gray-300 shrink-0 mt-3" />
                       <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                         <form onSubmit={(e) => handleReplySubmit(e, comment.id, comment.post_id)}>
                           <textarea 
                             className="w-full bg-transparent border-none focus:ring-0 p-3 text-sm text-gray-800 resize-none outline-none min-h-[80px]"
                             placeholder="Add a public reply..."
                             autoFocus
                             value={replyText}
                             onChange={(e) => setReplyText(e.target.value)}
                           />
                           <div className="flex justify-end gap-2 p-2 bg-white border-t border-gray-100">
                             <button 
                               type="button" 
                               onClick={() => setReplyingTo(null)}
                               className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                             >
                               Cancel
                             </button>
                             <button 
                               type="submit"
                               disabled={!replyText.trim()}
                               className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-full transition-colors shadow-sm"
                             >
                               Reply
                             </button>
                           </div>
                         </form>
                       </div>
                    </div>
                  )}
                </div>

                {/* Post Reference */}
                <div className="hidden md:flex w-36 shrink-0 flex-col gap-2 opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    {comment.post_thumbnail ? (
                      <img src={comment.post_thumbnail} alt={comment.post_title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <MessageSquare className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {comment.post_title}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
