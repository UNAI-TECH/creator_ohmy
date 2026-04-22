/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Menu, Search, Video, Bell, LayoutDashboard,
  PlaySquare, BarChart2, MessageSquare, Subtitles as SubtitlesIcon,
  IndianRupee, Settings as SettingsIcon, Send, Upload, Wand2, LogOut,
  X, FileText, Newspaper, ChevronRight, ImagePlus, Trash2, User, Film,
  Aperture, Clock
} from 'lucide-react';
import { cn } from './lib/utils';
import { supabase } from './lib/supabaseClient';
import { contentService } from './services/contentService';
import RichTextEditor from './components/RichTextEditor';
import Dashboard from './pages/Dashboard';
import Content from './pages/Content';
import StoriesPage from './pages/Stories';
import { useToast } from './context/ToastContext';
import Comments from './pages/Comments';
import Subtitles from './pages/Subtitles';
import Earn from './pages/Earn';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import LandingPage from './pages/LandingPage';
import JoinForm from './pages/JoinForm';
import RequestPending from './pages/RequestPending';
import LoginPage from './pages/LoginPage';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';

const CATEGORIES = [
  'Politics', 'Economy', 'Digital India', 'Policy', 'Viksit Bharat',
  'Sports', 'Entertainment', 'Technology', 'Health', 'Education', 'General', 'Custom'
];

const SidebarItem = ({ icon: Icon, label, active = false, onClick, danger = false }: { icon: any, label: string, active?: boolean, onClick?: () => void, danger?: boolean }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-4 px-6 py-3 text-sm font-medium transition-colors border-l-4",
      active 
        ? "bg-red-50 border-red-600 text-red-600" 
        : danger
          ? "border-transparent text-red-600 hover:bg-red-50"
          : "border-transparent text-[#0f0f0f] hover:bg-[#f2f2f2]"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-red-600" : danger ? "text-red-600" : "text-[#606060]")} />
    <span>{label}</span>
  </button>
);

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('Landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { success, error, toast } = useToast();
  const [applicantEmail, setApplicantEmail] = useState<string>(
    localStorage.getItem('omh_applicant_email') || ''
  );

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createType, setCreateType] = useState<'blog' | 'news' | 'video' | 'update'>('blog');
  
  // Create form state
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createCategory, setCreateCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [createThumbnailFile, setCreateThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [createVideoDuration, setCreateVideoDuration] = useState('');
  const [createVideoFile, setCreateVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [createAuthorName, setCreateAuthorName] = useState('');
  const [createAuthorPosition, setCreateAuthorPosition] = useState('');
  const [createHashtags, setCreateHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'suggestion' | 'other'>('suggestion');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('User')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        const allowedRoles = ['ANALYST', 'CREATOR'];
        if (allowedRoles.includes(profile?.role)) {
          setIsAuthenticated(true);
          setUserProfile(profile);
          setActivePage('Dashboard');
        } else {
          await supabase.auth.signOut();
        }
      }
      setLoading(false);
    };
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserProfile(null);
        setActivePage('Landing');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Scheduler checking every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      try {
        const myPosts = await contentService.getMyPosts();
        const now = new Date();
        for (const post of myPosts) {
          if (post.status === 'SCHEDULED' && post.scheduledFor) {
            if (new Date(post.scheduledFor) <= now) {
              await contentService.updatePost(post.id, { status: 'PUBLISHED' });
            }
          }
        }
      } catch (err) { }
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserProfile(null);
    setActivePage('Landing');
  };

  const handleLoginSuccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('User')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      setUserProfile(profile);
    }
    setIsAuthenticated(true);
    setActivePage('Dashboard');
  };

  const handleCreateSelect = (type: 'blog' | 'news' | 'video') => {
    setCreateType(type);
    setShowCreateModal(false);
    setShowCreateForm(true);
    setCreateTitle('');
    setCreateContent('');
    setCreateCategory('');
    setCustomCategory('');
    setCreateThumbnailFile(null);
    setThumbnailPreview(null);
    setCreateVideoDuration('');
    setCreateVideoFile(null);
    setVideoPreview(null);
    setCreateAuthorName('');
    setCreateAuthorPosition('');
    setCreateHashtags([]);
    setHashtagInput('');
  };

  const handleAddHashtag = (tag: string) => {
    const cleanTag = tag.trim().replace(/^#/, '');
    if (!cleanTag) return;
    if (createHashtags.length >= 5) {
      error('Limit: Only 5 hashtags allowed.');
      return;
    }
    if (createHashtags.includes(cleanTag)) {
      setHashtagInput('');
      return;
    }
    setCreateHashtags([...createHashtags, cleanTag]);
    setHashtagInput('');
  };

  const handleRemoveHashtag = (index: number) => {
    setCreateHashtags(createHashtags.filter((_, i) => i !== index));
  };

  const handleAction = async (action: 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED') => {
    if (!createTitle.trim() || !createContent.trim() || (!createCategory && createType !== 'video')) {
      error('Please fill in title, content, and category.');
      return;
    }
    if (!createThumbnailFile && !thumbnailPreview) {
      error('Please upload a thumbnail image.');
      return;
    }
    if (createCategory === 'Custom' && !customCategory.trim()) {
      error('Please enter a custom category name.');
      return;
    }
    setIsPublishing(true);
    try {
      let thumbnailUrl: string | undefined;
      if (createThumbnailFile) {
        thumbnailUrl = await contentService.uploadMedia(createThumbnailFile, 'thumbnails');
      }

      let videoUrl: string | undefined;
      if (createVideoFile && createType === 'video') {
        videoUrl = await contentService.uploadVideo(createVideoFile);
      }

      // Story logic removed from here as it is now handled in the dedicated Stories page
      // with a more advanced WhatsApp-style editor.

      await contentService.createPost({
        title: createTitle.trim(),
        content: createContent,
        type: createType,
        category: createCategory === 'Custom' ? 'custom' : createCategory,
        custom_category: createCategory === 'Custom' ? customCategory.trim() : undefined,
        thumbnail: thumbnailUrl,
        video_url: videoUrl,
        video_duration: createType === 'video' ? createVideoDuration.trim() || undefined : undefined,
        status: action,
        scheduledFor: action === 'SCHEDULED' ? new Date(scheduleDate).toISOString() : undefined,
        author_name: createAuthorName.trim() || undefined,
        author_position: createAuthorPosition.trim() || undefined,
        hashtags: createHashtags.length > 0 ? createHashtags : undefined,
      });
      setShowCreateForm(false);
      
      if (action === 'PUBLISHED') {
        setActivePage('Content');
        success('🎉 Published successfully! Your content is now live.');
      } else if (action === 'ARCHIVED') {
        setActivePage('Profile');
        success('Saved to Archive.');
      } else if (action === 'SCHEDULED') {
        setActivePage('Profile');
        success('Post scheduled successfully.');
      }
    } catch (e: any) {
      error('Action failed: ' + (e.message || 'Unknown error'));
    } finally {
      setIsPublishing(false);
      setIsScheduling(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    setIsSubmittingFeedback(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Not authenticated');

      await supabase.from('Feedback').insert({
        id: crypto.randomUUID(),
        content: feedbackText,
        category: feedbackCategory,
        userId: user.id,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      success('Feedback submitted successfully!');
      setFeedbackText('');
    } catch (err: any) {
      error('Failed to submit feedback: ' + err.message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-500 text-xl">Loading Studio...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (activePage === 'Terms') {
      return <TermsAndConditions onBack={() => setActivePage('Landing')} />;
    }
    if (activePage === 'Privacy') {
      return <PrivacyPolicy onBack={() => setActivePage('Landing')} />;
    }
    if (activePage === 'Landing') {
      return <LandingPage onJoinClick={() => setActivePage('JoinForm')} onLoginClick={() => setActivePage('Login')} onTermsClick={() => setActivePage('Terms')} onPrivacyClick={() => setActivePage('Privacy')} />;
    }
    if (activePage === 'Login') {
      return <LoginPage onBack={() => setActivePage('Landing')} onLoginSuccess={handleLoginSuccess} />;
    }
    if (activePage === 'JoinForm') {
      return (
        <JoinForm onBack={() => setActivePage('Landing')} onSubmitSuccess={(email: string) => {
          setApplicantEmail(email);
          localStorage.setItem('omh_applicant_email', email);
          setActivePage('RequestPending');
        }} />
      );
    }
    if (activePage === 'RequestPending') {
      return (
        <RequestPending onBack={() => setActivePage('Landing')} onGoToLogin={() => {
          localStorage.removeItem('omh_applicant_email');
          setActivePage('Login');
        }} applicantEmail={applicantEmail} />
      );
    }
    return <LandingPage onJoinClick={() => setActivePage('JoinForm')} onLoginClick={() => setActivePage('Login')} onTermsClick={() => setActivePage('Terms')} onPrivacyClick={() => setActivePage('Privacy')} />;
  }

  const navigateTo = (page: string) => {
    setActivePage(page);
    // Auto-close on mobile (below lg breakpoint)
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f9f9f9] text-[#0f0f0f] font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay/Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-50 shadow-xl lg:shadow-none",
        "fixed inset-y-0 left-0 lg:relative",
        sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 lg:w-0 lg:translate-x-0 lg:opacity-0 lg:pointer-events-none overflow-hidden"
      )}>
        {/* Desktop Collapse Arrow */}
        {sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(false)}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:bg-gray-50 z-[60] group transition-all"
            title="Collapse Sidebar"
          >
            <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-red-600 rotate-180" />
          </button>
        )}

        <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activePage === 'Dashboard'} onClick={() => navigateTo('Dashboard')} />
            <SidebarItem icon={Video} label="Content" active={activePage === 'Content'} onClick={() => navigateTo('Content')} />
            <SidebarItem icon={Aperture} label="Stories" active={activePage === 'Stories'} onClick={() => navigateTo('Stories')} />
            <SidebarItem icon={MessageSquare} label="Comments" active={activePage === 'Comments'} onClick={() => navigateTo('Comments')} />
            <SidebarItem icon={SubtitlesIcon} label="Subtitles" active={activePage === 'Subtitles'} onClick={() => navigateTo('Subtitles')} />
            <SidebarItem icon={IndianRupee} label="Earn" active={activePage === 'Earn'} onClick={() => navigateTo('Earn')} />
            <SidebarItem icon={Bell} label="Notifications" active={activePage === 'Notifications'} onClick={() => navigateTo('Notifications')} />
            <SidebarItem icon={User} label="Profile" active={activePage === 'Profile'} onClick={() => navigateTo('Profile')} />
          </div>
        </div>
        <div className="border-t border-gray-200 py-4 flex flex-col gap-1">
          <SidebarItem icon={SettingsIcon} label="Settings" onClick={() => navigateTo('Settings')} active={activePage === 'Settings'} />
          <SidebarItem icon={Send} label="Send feedback" onClick={() => navigateTo('Feedback')} active={activePage === 'Feedback'} />
          <SidebarItem icon={LogOut} label="Logout" onClick={handleLogout} danger />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer">
              <img src="/logo%20omh.png" alt="OMH Logo" className="w-8 h-8 object-contain" />
              <span className="text-xl font-semibold tracking-tight hidden sm:block">Studio</span>
            </div>
          </div>

          <div className="flex-1 max-w-2xl px-4 sm:px-8 hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input type="text" placeholder="Search across your channel" className="w-full pl-11 pr-4 py-2 bg-gray-100 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-full text-sm transition-all outline-none" />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setShowCreateModal(true)} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium transition-colors shadow-sm">
              <Upload className="w-4 h-4" />
              <span>CREATE</span>
            </button>
            <button onClick={() => setShowCreateModal(true)} className="sm:hidden p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Upload className="w-6 h-6 text-red-600" />
            </button>
            <button 
              onClick={() => setActivePage('Notifications')}
              className="p-2 hover:bg-gray-100 rounded-full relative transition-colors"
            >
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full"></span>
            </button>
            <button 
              onClick={() => setActivePage('Profile')}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors overflow-hidden"
            >
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="Profile" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold">
                  {(userProfile?.username || userProfile?.email || 'C').charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          </div>
        </header>

        <main className={cn("flex-1 overflow-y-auto", activePage === 'Profile' ? "p-0" : "p-4 sm:p-6 lg:p-8")}>
          {activePage === 'Dashboard' && <Dashboard />}
          {activePage === 'Content' && <Content />}
          {activePage === 'Stories' && <StoriesPage />}
          {activePage === 'Comments' && <Comments />}
          {activePage === 'Subtitles' && <Subtitles />}
          {activePage === 'Earn' && <Earn />}
          {activePage === 'Notifications' && <Notifications />}
          {activePage === 'Profile' && <Profile onCreatePost={() => setShowCreateModal(true)} />}
          {activePage === 'Settings' && (
            <div className="max-w-[800px] mx-auto animate-in fade-in duration-300">
              <h1 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight">Settings</h1>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold">
                    {(userProfile?.username || userProfile?.email || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{userProfile?.username || 'Creator'}</h2>
                    <p className="text-sm text-gray-500">{userProfile?.email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm font-medium text-gray-700">Role</div>
                    <div className="text-sm text-gray-500 mt-1 capitalize">{userProfile?.role || 'Creator'}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-sm font-medium text-gray-700">Account Created</div>
                    <div className="text-sm text-gray-500 mt-1">{userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activePage === 'Feedback' && (
            <div className="max-w-[700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Send feedback</h1>
                <p className="text-sm text-gray-500 mt-1">Help us improve the community by sharing your thoughts.</p>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 sm:p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                      <Wand2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">What's on your mind?</div>
                      <div className="text-xs text-gray-500">Select a category and let us know</div>
                    </div>
                  </div>
                  <div className="flex bg-white p-1 rounded-xl border border-gray-100">
                    {(['bug', 'suggestion', 'other'] as const).map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setFeedbackCategory(cat)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                          feedbackCategory === cat ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5 sm:p-8">
                  <textarea 
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    className="w-full p-6 bg-gray-50 border border-gray-100 rounded-2xl text-sm resize-none min-h-[250px] focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-gray-300" 
                    placeholder={
                      feedbackCategory === 'bug' ? "What went wrong? Describe the bug in detail..." :
                      feedbackCategory === 'suggestion' ? "I have a great idea for..." :
                      "Share anything else with us..."
                    }
                  />
                  
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Your feedback helps everyone
                    </div>
                    <button 
                      onClick={handleFeedbackSubmit}
                      disabled={isSubmittingFeedback || !feedbackText.trim()}
                      className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white rounded-2xl text-sm font-black tracking-widest uppercase transition-all shadow-lg shadow-red-100 hover:shadow-red-200 flex items-center justify-center gap-3"
                    >
                      {isSubmittingFeedback ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      SUBMIT FEEDBACK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {!['Dashboard', 'Content', 'Stories', 'Comments', 'Subtitles', 'Earn', 'Notifications', 'Profile', 'Settings', 'Feedback'].includes(activePage) && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p className="text-lg">The <strong>{activePage}</strong> page is under construction.</p>
            </div>
          )}
        </main>
      </div>

      {/* CREATE Type Selection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Content</h2>
                <p className="text-sm text-gray-500 mt-1">Choose what you'd like to create</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {[
                { type: 'blog' as const, icon: FileText, label: 'Headlines', desc: 'Write an article or story', color: '#8B5CF6' },
                { type: 'news' as const, icon: Newspaper, label: 'Article', desc: 'Share breaking news or updates', color: '#0EA5E9' },
                { type: 'video' as const, icon: Video, label: 'Video', desc: 'Upload a video report', color: '#EF4444' },
              ].map(opt => (
                <button key={opt.type} onClick={() => handleCreateSelect(opt.type)} className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 transition-all text-left group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: opt.color + '15' }}>
                    <opt.icon className="w-6 h-6" style={{ color: opt.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Creation Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (createType === 'blog' ? '#8B5CF6' : createType === 'news' ? '#0EA5E9' : '#EF4444') + '15' }}>
                  {createType === 'blog' && <FileText className="w-4 h-4 text-[#8B5CF6]" />}
                  {createType === 'news' && <Newspaper className="w-4 h-4 text-[#0EA5E9]" />}
                  {createType === 'video' && <Video className="w-4 h-4 text-[#EF4444]" />}
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  New {createType === 'blog' ? 'Headline' : createType === 'news' ? 'Article' : 'Video'}
                </h2>
              </div>
              <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input type="text" value={createTitle} onChange={e => setCreateTitle(e.target.value)} placeholder={`Enter ${createType === 'blog' ? 'headline' : createType === 'news' ? 'article' : 'video'} title...`} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author Name</label>
                  <input type="text" value={createAuthorName} onChange={e => setCreateAuthorName(e.target.value)} placeholder="e.g., Rajesh Kumar" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author Position</label>
                  <input type="text" value={createAuthorPosition} onChange={e => setCreateAuthorPosition(e.target.value)} placeholder="e.g., Senior Political Analyst" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                </div>
              </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setCreateCategory(cat)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors", createCategory === cat ? "bg-red-50 border-red-300 text-red-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100")}>{cat}</button>
                      ))}
                    </div>
                    {createCategory === 'Custom' && (
                      <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                        <input 
                          type="text" 
                          value={customCategory} 
                          onChange={e => setCustomCategory(e.target.value)} 
                          placeholder="Enter custom category name..." 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                    {createType === 'blog' ? (
                      <div>
                        <textarea
                          value={createContent}
                          onChange={e => {
                            if (e.target.value.length <= 500) setCreateContent(e.target.value);
                          }}
                          maxLength={500}
                          placeholder="Write your headline content here (max 500 characters)..."
                          className="w-full px-6 py-5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 outline-none resize-none leading-relaxed focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          style={{ minHeight: '200px', maxHeight: '400px' }}
                        />
                        <div className={cn(
                          "text-xs mt-2 text-right font-medium transition-colors",
                          createContent.length >= 480 ? "text-red-500" : createContent.length >= 400 ? "text-amber-500" : "text-gray-400"
                        )}>
                          {createContent.length}/500 characters
                        </div>
                      </div>
                    ) : (
                      <RichTextEditor
                        value={createContent}
                        onChange={setCreateContent}
                        placeholder={`Write your ${createType} content here...`}
                        minHeight="200px"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags (Max 5)</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {createHashtags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100 group">
                          #{tag}
                          <button 
                            type="button"
                            onClick={() => handleRemoveHashtag(idx)}
                            className="hover:text-red-900 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {createHashtags.length === 0 && (
                        <span className="text-xs text-gray-400 italic">No hashtags added yet</span>
                      )}
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={hashtagInput} 
                        onChange={e => setHashtagInput(e.target.value)} 
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
                            e.preventDefault();
                            handleAddHashtag(hashtagInput);
                          }
                        }}
                        placeholder={createHashtags.length >= 5 ? "Hashtag limit reached" : "Type #hashtag and hit Enter..."} 
                        disabled={createHashtags.length >= 5}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button 
                        type="button"
                        onClick={() => handleAddHashtag(hashtagInput)}
                        disabled={createHashtags.length >= 5 || !hashtagInput.trim()}
                        className="absolute right-2 top-1.5 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-30"
                      >
                        ADD
                      </button>
                    </div>
                    <p className="mt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                      {createHashtags.length}/5 hashtags saved
                    </p>
                  </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail *
                  </label>
                {thumbnailPreview ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setCreateThumbnailFile(null); setThumbnailPreview(null); }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    className="flex flex-col items-center justify-center w-full h-40 bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl cursor-pointer transition-colors group"
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={e => {
                      e.preventDefault(); e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        setCreateThumbnailFile(file);
                        setThumbnailPreview(URL.createObjectURL(file));
                      }
                    }}
                  >
                    <ImagePlus className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors mb-2" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">Click to upload or drag & drop</span>
                    <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCreateThumbnailFile(file);
                          setThumbnailPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              {createType === 'video' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Video *
                    </label>
                    {videoPreview ? (
                      <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-black">
                        <video src={videoPreview} controls className="w-full max-h-[300px] object-contain" />
                        <button
                          type="button"
                          onClick={() => { setCreateVideoFile(null); setVideoPreview(null); }}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        className="flex flex-col items-center justify-center w-full h-48 bg-gray-50 border-2 border-dashed border-gray-300 hover:border-red-400 rounded-xl cursor-pointer transition-colors group"
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={e => {
                          e.preventDefault(); e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith('video/')) {
                            setCreateVideoFile(file);
                            setVideoPreview(URL.createObjectURL(file));
                          }
                        }}
                      >
                        <Film className="w-12 h-12 text-gray-400 group-hover:text-red-500 transition-colors mb-2" />
                        <span className="text-sm font-medium text-gray-600 group-hover:text-red-600 transition-colors">Click to upload or drag & drop video</span>
                        <span className="text-xs text-gray-400 mt-1">MP4, MOV, WebM up to 500MB</span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setCreateVideoFile(file);
                              setVideoPreview(URL.createObjectURL(file));
                              // Auto-detect duration
                              const videoEl = document.createElement('video');
                              videoEl.preload = 'metadata';
                              videoEl.onloadedmetadata = () => {
                                const mins = Math.floor(videoEl.duration / 60);
                                const secs = Math.floor(videoEl.duration % 60);
                                setCreateVideoDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
                                URL.revokeObjectURL(videoEl.src);
                              };
                              videoEl.src = URL.createObjectURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Video Duration</label>
                    <input type="text" value={createVideoDuration} onChange={e => setCreateVideoDuration(e.target.value)} placeholder="e.g., 12:30 (auto-detected from video)" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                </>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex flex-col gap-4 sticky bottom-0 bg-white">
              {isScheduling && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in slide-in-from-bottom-2">
                  <label className="text-sm font-bold text-gray-700 whitespace-nowrap">Schedule for:</label>
                  <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="flex-1 px-3 py-1.5 rounded-lg border border-blue-200 text-sm outline-none bg-white" />
                  <div className="flex justify-end gap-2 w-full sm:w-auto">
                    <button onClick={() => setIsScheduling(false)} className="px-4 py-2 text-xs text-gray-500 hover:text-gray-900 font-bold">Cancel</button>
                    <button onClick={() => handleAction('SCHEDULED')} disabled={!scheduleDate || isPublishing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors">
                      Confirm Schedule
                    </button>
                  </div>
                </div>
              )}
              
              {!isScheduling && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="w-full sm:w-auto flex justify-start">
                     <button onClick={() => handleAction('ARCHIVED')} disabled={isPublishing} className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-full transition-colors flex justify-center">
                       Save as Draft
                     </button>
                  </div>
                  <div className="flex w-full sm:w-auto justify-end gap-2 sm:gap-3">
                    <button onClick={() => setShowCreateForm(false)} disabled={isPublishing} className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors text-center">Cancel</button>
                    
                    <button onClick={() => setIsScheduling(true)} disabled={isPublishing} className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-100 hover:border-blue-200 rounded-full transition-colors text-center">
                      Schedule
                    </button>
                    
                    <button onClick={() => handleAction('PUBLISHED')} disabled={isPublishing || (!createTitle.trim() || !createContent.trim() || !createCategory || !createThumbnailFile)} className="flex-1 sm:flex-none px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
                      {isPublishing ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Saving...</>
                      ) : 'Publish'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
