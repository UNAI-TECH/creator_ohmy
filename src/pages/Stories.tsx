import React, { useState, useEffect } from 'react';
import { 
  Eye, Archive, Aperture, Search, Trash2, Clock, CheckCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';
import { storyService } from '../services/storyService';
import StoryTypeSelector from '../components/stories/StoryTypeSelector';
import MediaStoryEditor from '../components/stories/MediaStoryEditor';
import TextStoryEditor from '../components/stories/TextStoryEditor';
import StoryDetailPanel from '../components/stories/StoryDetailPanel';
import { Plus } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';

const tabs = ['Active', 'Archived'];

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
};

interface Story {
  id: string;
  media_url?: string;
  text_content?: string;
  type: 'image' | 'video' | 'text';
  background_color?: string;
  caption?: string;
  created_at: string;
  expires_at?: string;
  archived_at?: string;
  viewers_count: number;
  likes_count?: number;
}

function StoriesPage() {
  const [activeTab, setActiveTab] = useState('Active');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Flow states
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showMediaEditor, setShowMediaEditor] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { confirm } = useModal();
  const { success, error: showToastError } = useToast();
  
  const fetchStories = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const now = new Date().toISOString();

      if (activeTab === 'Active') {
         const { data, error } = await supabase
            .from('stories')
            .select('*, story_views(count), story_likes(count)')
            .eq('creator_id', session.user.id)
            .gt('expires_at', now)
            .order('created_at', { ascending: false });

         if (error) console.error(error);
         if (data) {
           const mapped = data.map((d: any) => ({
             ...d,
             viewers_count: d.story_views?.[0]?.count || 0,
             likes_count: d.story_likes?.[0]?.count || 0
           }));
           setStories(mapped);
         }
      } else {
         // Archived Tab queries stories that have expired
         const { data, error } = await supabase
            .from('stories')
            .select('*, story_views(count), story_likes(count)')
            .eq('creator_id', session.user.id)
            .lte('expires_at', now)
            .order('created_at', { ascending: false });

         if (error) console.error(error);
         if (data) {
           const mapped = data.map((d: any) => ({
             ...d,
             viewers_count: d.story_views?.[0]?.count || 0,
             likes_count: d.story_likes?.[0]?.count || 0
           }));
           setStories(mapped);
         }
      }
    } catch (e) {
      console.warn('Failed to fetch stories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchStories(); 
    
    // Subscribe to real-time updates
    if (activeTab === 'Active') {
      const channel = supabase.channel('creator_stories_realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, (payload) => {
           // Instantly update local state
           setStories(prev => {
             // Avoid duplicates
             if (prev.find(s => s.id === payload.new.id)) return prev;
             return [{...payload.new, viewers_count: 0, likes_count: 0} as Story, ...prev];
           });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'story_views' }, () => fetchStories())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'story_likes' }, () => fetchStories())
        .subscribe();
        
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeTab]);

  const handleDelete = async (storyId: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Story',
      message: 'Are you sure you want to delete this story? This cannot be undone.',
      confirmText: 'Delete',
      type: 'danger'
    });

    if (!isConfirmed) return;

    try {
      // Both active and archived are now on 'stories' table natively
      const { error } = await supabase.from('stories').delete().eq('id', storyId);
      if (error) throw error;
      setStories(prev => prev.filter(s => s.id !== storyId));
      success('Story deleted successfully.');
    } catch (e) {
      showToastError('Failed to delete story.');
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowMediaEditor(true);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
           <Aperture className="w-8 h-8 text-amber-500" />
           Story Management
        </h1>
        <button 
          onClick={() => document.getElementById('story-file-input')?.click()}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-bold transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Story
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-sm font-medium whitespace-nowrap transition-colors relative flex items-center gap-2",
              activeTab === tab ? "text-amber-500" : "text-[#606060] hover:text-[#0f0f0f]"
            )}
          >
            {tab === 'Active' ? <Clock className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
        {/* Content List/Table */}
        <div className="flex-1 overflow-y-auto relative min-h-[400px]">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                Loading stories...
              </div>
            </div>
          ) : stories.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Aperture className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium">No stories found</p>
              <p className="text-xs text-gray-400 mt-1">
                {activeTab === 'Active' ? 'Click CREATE to post a new 24-hour story!' : 'Archived stories will appear here after 24 hours.'}
              </p>
            </div>
          ) : (
            <div className="w-full p-6">
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {stories.map(story => (
                     <div 
                        key={story.id} 
                        className="group relative rounded-[20px] overflow-hidden aspect-[9/16] bg-gray-100 border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                        onClick={() => { setSelectedStory(story); setIsDetailOpen(true); }}
                     >
                        {story.type === 'video' ? (
                           <video src={story.media_url} className="w-full h-full object-cover" muted />
                        ) : story.type === 'text' ? (
                           <div 
                             className="w-full h-full flex items-center justify-center p-4 text-center"
                             style={{ backgroundColor: story.background_color || '#333' }}
                           >
                             <p className="text-sm font-bold text-white line-clamp-6">{story.text_content}</p>
                           </div>
                        ) : (
                           <img src={story.media_url} className="w-full h-full object-cover" alt="Story" />
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                        
                        <div className="absolute top-3 left-3 right-3 flex justify-between items-center text-white">
                           <span className="text-[10px] font-bold bg-black/50 px-2.5 py-1.5 rounded-full backdrop-blur-md shadow-sm flex items-center gap-1.5 border border-white/20">
                              { activeTab === 'Active' ? <Clock className="w-3 h-3 text-amber-400" /> : <Archive className="w-3 h-3 text-gray-300" /> }
                              {formatDate(story.created_at)}
                           </span>
                           <button 
                               onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(story.id); }}
                               className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors pointer-events-auto opacity-0 group-hover:opacity-100 border border-red-400"
                           >
                               <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                        
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                           <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                              <Eye className="w-4 h-4 shadow-sm" />
                              <span className="text-xs font-bold">{story.viewers_count || 0}</span>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <input 
        id="story-file-input" 
        type="file" 
        accept="image/*,video/*" 
        className="hidden" 
        onChange={onFileSelect} 
      />

      {showMediaEditor && selectedFile && (
        <MediaStoryEditor 
          file={selectedFile}
          onClose={() => { setShowMediaEditor(false); setSelectedFile(null); }}
          onSuccess={() => {
            setShowMediaEditor(false);
            setSelectedFile(null);
            fetchStories(); // Refresh immediately
          }}
        />
      )}

      {showTextEditor && (
        <TextStoryEditor 
          onClose={() => setShowTextEditor(false)}
          onSuccess={() => {
            setShowTextEditor(false);
            fetchStories(); // Refresh immediately
          }}
        />
      )}

      <StoryDetailPanel 
        story={selectedStory} 
        isOpen={isDetailOpen} 
        onClose={() => {
          setIsDetailOpen(false);
          setTimeout(() => setSelectedStory(null), 300);
        }} 
      />
    </div>
  );
}

export default StoriesPage;
