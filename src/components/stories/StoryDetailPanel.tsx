import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Heart, Share2, Mail, User, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { cn } from '../../lib/utils';

interface StoryDetailPanelProps {
  story: any;
  isOpen: boolean;
  onClose: () => void;
}

const TABS = ['Messages', 'Comments', 'Likes', 'Shares', 'Viewers'];

export default function StoryDetailPanel({ story, isOpen, onClose }: StoryDetailPanelProps) {
  const [activeTab, setActiveTab] = useState('Messages');
  const [messages, setMessages] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [viewers, setViewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResponses = async () => {
    if (!story) return;
    setLoading(true);
    
    try {
      // 1. Fetch Messages (Direct from story viewer)
      const { data: msgs, error: msgErr } = await supabase
        .from('story_messages')
        .select('*, sender:User!sender_id(username, avatarUrl)')
        .eq('story_id', story.id)
        .order('created_at', { ascending: false });
      if (msgErr) console.warn('Messages error', msgErr);
      if (msgs) setMessages(msgs);

      // 2. Fetch Comments
      const { data: cmtData, error: cmtErr } = await supabase
        .from('story_comments')
        .select('*, user:User!user_id(username, avatarUrl)')
        .eq('story_id', story.id)
        .order('created_at', { ascending: false });
      if (cmtErr) console.warn('Comments error', cmtErr);
      if (cmtData) setComments(cmtData);

      // 3. Fetch Likes
      const { data: likeData, error: likeErr } = await supabase
        .from('story_likes')
        .select('*, user:User!user_id(username, avatarUrl)')
        .eq('story_id', story.id)
        .order('liked_at', { ascending: false });
      if (likeErr) console.warn('Likes error', likeErr);
      if (likeData) {
        const uniqueLikes = likeData.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.user_id === v.user_id) === i);
        setLikes(uniqueLikes);
      }

      // 4. Fetch Shares
      const { data: shareData, error: shareErr } = await supabase
        .from('story_shares')
        .select('*, user:User!user_id(username, avatarUrl)')
        .eq('story_id', story.id)
        .order('shared_at', { ascending: false });
      if (shareErr) console.warn('Shares error', shareErr);
      if (shareData) {
        const uniqueShares = shareData.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.user_id === v.user_id) === i);
        setShares(uniqueShares);
      }

      // 5. Fetch Viewers
      const { data: viewerData, error: viewErr } = await supabase
        .from('story_views')
        .select('*, user:User!user_id(username, avatarUrl)')
        .eq('story_id', story.id)
        .order('viewed_at', { ascending: false });
      if (viewErr) console.warn('Views error', viewErr);
      if (viewerData) {
        const uniqueViews = viewerData.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.user_id === v.user_id) === i);
        setViewers(uniqueViews);
      }

    } catch (err) {
      console.warn('Failed to fetch responses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && story?.id) {
      fetchResponses();

      // Setup Realtime listeners
      const channel = supabase.channel(`story_responses_${story.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'story_messages', filter: `story_id=eq.${story.id}` }, () => fetchResponses())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'story_comments', filter: `story_id=eq.${story.id}` }, () => fetchResponses())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'story_likes', filter: `story_id=eq.${story.id}` }, () => fetchResponses())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'story_shares', filter: `story_id=eq.${story.id}` }, () => fetchResponses())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'story_views', filter: `story_id=eq.${story.id}` }, () => fetchResponses())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, story?.id]);

  if (!isOpen || !story) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity animate-in fade-in" 
        onClick={onClose}
      />
      
      {/* Slider Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] md:w-[600px] lg:w-[650px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Story Responses</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview Mini Header */}
        <div className="px-6 py-5 flex items-center gap-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 shadow-sm z-10">
          <div className="w-24 h-40 rounded-xl overflow-hidden bg-black flex-shrink-0 relative shadow-md ring-1 ring-black/10">
            {story.type === 'video' ? (
              <video src={story.media_url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
            ) : story.type === 'image' ? (
              <img src={story.media_url} className="w-full h-full object-cover" />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center p-2"
                style={{ backgroundColor: story.background_color || '#333' }}
              >
                <p className="text-[8px] font-bold text-white line-clamp-3 overflow-hidden text-center leading-tight">
                  {story.text_content}
                </p>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Total Views: {viewers.length}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(story.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-gray-200">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 px-1 sm:px-4 py-4 text-[11px] sm:text-sm font-semibold transition-colors relative flex justify-center items-center gap-1.5 sm:gap-2",
                activeTab === tab ? "text-amber-600" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <div className="flex-shrink-0">
                {tab === 'Messages' && <Mail className="w-4 h-4 sm:w-5 sm:h-5" />}
                {tab === 'Comments' && <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                {tab === 'Likes' && <Heart className="w-4 h-4 sm:w-5 sm:h-5" />}
                {tab === 'Shares' && <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                {tab === 'Viewers' && <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </div>
              <span className="hidden sm:inline">{tab}</span>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {activeTab === 'Messages' && (
                <div className="space-y-4">
                  {messages.length === 0 && <EmptyState name="messages" icon={Mail} />}
                  {messages.map((item, i) => (
                    <ResponseRow 
                      key={i} 
                      user={item.sender} 
                      content={item.message} 
                      time={item.created_at} 
                    />
                  ))}
                </div>
              )}

              {activeTab === 'Comments' && (
                <div className="space-y-4">
                  {comments.length === 0 && <EmptyState name="comments" icon={MessageCircle} />}
                  {comments.map((item, i) => (
                    <ResponseRow 
                      key={i} 
                      user={item.user} 
                      content={item.content || item.comment} 
                      time={item.created_at} 
                    />
                  ))}
                </div>
              )}

              {activeTab === 'Likes' && (
                <div className="space-y-4">
                  {likes.length === 0 && <EmptyState name="likes" icon={Heart} />}
                  {likes.map((item, i) => (
                    <ResponseRow 
                      key={i} 
                      user={item.user} 
                      actionText="liked your story"
                      time={item.liked_at} 
                    />
                  ))}
                </div>
              )}

              {activeTab === 'Shares' && (
                <div className="space-y-4">
                  {shares.length === 0 && <EmptyState name="shares" icon={Share2} />}
                  {shares.map((item, i) => (
                    <ResponseRow 
                      key={i} 
                      user={item.user} 
                      actionText="shared your story"
                      time={item.shared_at} 
                    />
                  ))}
                </div>
              )}

              {activeTab === 'Viewers' && (
                <div className="space-y-4">
                  {viewers.length === 0 && <EmptyState name="viewers" icon={Eye} />}
                  {viewers.map((item, i) => (
                    <ResponseRow 
                      key={i} 
                      user={item.user} 
                      actionText="viewed your story"
                      time={item.viewed_at} 
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </>
  );
}

const EmptyState = ({ name, icon: Icon }: { name: string, icon: any }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/80 rounded-3xl border border-dashed border-gray-200 mt-2">
    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-5">
      <Icon className="w-8 h-8 text-amber-500 opacity-80" />
    </div>
    <h3 className="text-gray-900 font-bold mb-1 text-base capitalize">No {name} yet</h3>
    <p className="text-sm text-gray-500 max-w-[220px]">When someone interacts with your story, you'll see them here.</p>
  </div>
);

const ResponseRow = ({ user, content, actionText, time }: any) => {
  const avatar = user?.avatarUrl || user?.avatar_url || null;
  const username = user?.username || 'User';

  return (
    <div className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-200 border border-gray-100 hover:border-gray-200 hover:shadow-sm mb-3 group">
      {avatar ? (
         <img src={avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
      ) : (
         <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 shadow-inner">
           <User className="w-6 h-6 text-gray-400" />
         </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-center gap-2 mb-1">
          <p className="font-bold text-[15px] text-gray-900 group-hover:text-amber-600 transition-colors truncate">
            {username}
          </p>
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded-full">
            {new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
        {content && <p className="text-sm text-gray-700 leading-relaxed max-w-[90%]">{content}</p>}
        {actionText && <p className="text-[13px] text-gray-500 font-medium">{actionText}</p>}
      </div>
    </div>
  );
};
