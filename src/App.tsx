/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Menu, Search, Video, Bell, LayoutDashboard,
  PlaySquare, BarChart2, MessageSquare, Subtitles as SubtitlesIcon,
  DollarSign, Settings as SettingsIcon, Send, Upload, Wand2, LogOut,
  X, FileText, Newspaper, ChevronRight, ImagePlus, Trash2
} from 'lucide-react';
import { cn } from './lib/utils';
import { supabase } from './lib/supabaseClient';
import { contentService } from './services/contentService';
import Dashboard from './pages/Dashboard';
import Content from './pages/Content';
import Analytics from './pages/Analytics';
import Comments from './pages/Comments';
import Subtitles from './pages/Subtitles';
import Earn from './pages/Earn';
import Customization from './pages/Customization';
import AudioLibrary from './pages/AudioLibrary';
import LandingPage from './pages/LandingPage';
import JoinForm from './pages/JoinForm';
import RequestPending from './pages/RequestPending';
import LoginPage from './pages/LoginPage';

const CATEGORIES = [
  'Politics', 'Economy', 'Digital India', 'Policy', 'Viksit Bharat',
  'Sports', 'Entertainment', 'Technology', 'Health', 'Education', 'General'
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
  const [applicantEmail, setApplicantEmail] = useState<string>(
    localStorage.getItem('omh_applicant_email') || ''
  );

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createType, setCreateType] = useState<'blog' | 'news' | 'video'>('blog');
  
  // Create form state
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createCategory, setCreateCategory] = useState('');
  const [createThumbnailFile, setCreateThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [createVideoDuration, setCreateVideoDuration] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile?.role === 'creator') {
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
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
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
    setCreateThumbnailFile(null);
    setThumbnailPreview(null);
    setCreateVideoDuration('');
  };

  const handlePublish = async () => {
    if (!createTitle.trim() || !createContent.trim() || !createCategory) {
      alert('Please fill in title, content, and category.');
      return;
    }
    setIsPublishing(true);
    try {
      // Upload thumbnail if a file was selected
      let thumbnailUrl: string | undefined;
      if (createThumbnailFile) {
        thumbnailUrl = await contentService.uploadMedia(createThumbnailFile, 'thumbnails');
      }

      await contentService.createPost({
        title: createTitle.trim(),
        content: createContent.trim(),
        type: createType,
        category: createCategory,
        thumbnail: thumbnailUrl,
        video_duration: createType === 'video' ? createVideoDuration.trim() || undefined : undefined,
      });
      setShowCreateForm(false);
      setActivePage('Content');
      alert('🎉 Published successfully! Your content is now live.');
    } catch (e: any) {
      alert('Publish failed: ' + (e.message || 'Unknown error'));
    } finally {
      setIsPublishing(false);
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
    if (activePage === 'Landing') {
      return <LandingPage onJoinClick={() => setActivePage('JoinForm')} onLoginClick={() => setActivePage('Login')} />;
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
    return <LandingPage onJoinClick={() => setActivePage('JoinForm')} onLoginClick={() => setActivePage('Login')} />;
  }

  return (
    <div className="flex h-screen bg-[#f9f9f9] text-[#0f0f0f] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-30",
        sidebarOpen ? "w-64" : "w-0 lg:w-20 overflow-hidden"
      )}>
        <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activePage === 'Dashboard'} onClick={() => setActivePage('Dashboard')} />
            <SidebarItem icon={Video} label="Content" active={activePage === 'Content'} onClick={() => setActivePage('Content')} />
            <SidebarItem icon={BarChart2} label="Analytics" active={activePage === 'Analytics'} onClick={() => setActivePage('Analytics')} />
            <SidebarItem icon={MessageSquare} label="Comments" active={activePage === 'Comments'} onClick={() => setActivePage('Comments')} />
            <SidebarItem icon={SubtitlesIcon} label="Subtitles" active={activePage === 'Subtitles'} onClick={() => setActivePage('Subtitles')} />
            <SidebarItem icon={DollarSign} label="Earn" active={activePage === 'Earn'} onClick={() => setActivePage('Earn')} />
            <SidebarItem icon={Wand2} label="Customization" active={activePage === 'Customization'} onClick={() => setActivePage('Customization')} />
            <SidebarItem icon={PlaySquare} label="Audio Library" active={activePage === 'Audio Library'} onClick={() => setActivePage('Audio Library')} />
          </div>
        </div>
        <div className="border-t border-gray-200 py-4 flex flex-col gap-1">
          <SidebarItem icon={SettingsIcon} label="Settings" onClick={() => setActivePage('Settings')} active={activePage === 'Settings'} />
          <SidebarItem icon={Send} label="Send feedback" onClick={() => setActivePage('Feedback')} active={activePage === 'Feedback'} />
          <SidebarItem icon={LogOut} label="Logout" onClick={handleLogout} danger />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-1 cursor-pointer">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <PlaySquare className="w-5 h-5 text-white" fill="currentColor" />
              </div>
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
            <button className="p-2 hover:bg-gray-100 rounded-full relative transition-colors">
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full"></span>
            </button>
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold">
                {(userProfile?.full_name || userProfile?.email || 'C').charAt(0).toUpperCase()}
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activePage === 'Dashboard' && <Dashboard />}
          {activePage === 'Content' && <Content />}
          {activePage === 'Analytics' && <Analytics />}
          {activePage === 'Comments' && <Comments />}
          {activePage === 'Subtitles' && <Subtitles />}
          {activePage === 'Earn' && <Earn />}
          {activePage === 'Customization' && <Customization />}
          {activePage === 'Audio Library' && <AudioLibrary />}
          {activePage === 'Settings' && (
            <div className="max-w-[800px] mx-auto">
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold">
                    {(userProfile?.full_name || userProfile?.email || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{userProfile?.full_name || userProfile?.username || 'Creator'}</h2>
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
            <div className="max-w-[800px] mx-auto">
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">Send Feedback</h1>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <textarea className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none min-h-[200px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Share your thoughts, ideas, or report issues..." />
                <button className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium transition-colors">Submit Feedback</button>
              </div>
            </div>
          )}
          {!['Dashboard', 'Content', 'Analytics', 'Comments', 'Subtitles', 'Earn', 'Customization', 'Audio Library', 'Settings', 'Feedback'].includes(activePage) && (
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
                { type: 'blog' as const, icon: FileText, label: 'Blog Post', desc: 'Write an article or story', color: '#8B5CF6' },
                { type: 'news' as const, icon: Newspaper, label: 'News Article', desc: 'Share breaking news or updates', color: '#0EA5E9' },
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
                  New {createType === 'blog' ? 'Blog Post' : createType === 'news' ? 'News Article' : 'Video'}
                </h2>
              </div>
              <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input type="text" value={createTitle} onChange={e => setCreateTitle(e.target.value)} placeholder={`Enter ${createType} title...`} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCreateCategory(cat)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors", createCategory === cat ? "bg-red-50 border-red-300 text-red-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100")}>{cat}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                <textarea value={createContent} onChange={e => setCreateContent(e.target.value)} placeholder={`Write your ${createType} content here...`} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[200px] resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail (optional)</label>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video Duration</label>
                  <input type="text" value={createVideoDuration} onChange={e => setCreateVideoDuration(e.target.value)} placeholder="e.g., 12:30" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowCreateForm(false)} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors">Cancel</button>
              <button onClick={handlePublish} disabled={isPublishing || !createTitle.trim() || !createContent.trim() || !createCategory} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                {isPublishing ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Publishing...</>
                ) : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
