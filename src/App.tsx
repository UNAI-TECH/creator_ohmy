import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  Video,
  Bell,
  LayoutDashboard,
  BarChart2,
  MessageSquare,
  Settings as SettingsIcon,
  Send,
  Upload,
  LogOut,
  X,
  FileText,
  Newspaper,
  ChevronRight,
  User,
  Aperture,
  FolderOpen,
} from 'lucide-react';
import { cn } from './lib/utils';
import { supabase } from './lib/supabaseClient';
import { useToast } from './context/ToastContext';
import { notificationService } from './services/notificationService';

import Dashboard from './pages/Dashboard';
import Content from './pages/Content';
import EditorPage from './pages/EditorPage';
import MediaLibraryPage from './pages/MediaLibraryPage';
import StoriesPage from './pages/Stories';
import Comments from './pages/Comments';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import LandingPage from './pages/LandingPage';
import JoinForm from './pages/JoinForm';
import RequestPending from './pages/RequestPending';
import LoginPage from './pages/LoginPage';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';

const SidebarItem = ({
  icon: Icon,
  label,
  active = false,
  onClick,
  danger = false,
  badge,
}: {
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
  danger?: boolean;
  badge?: number;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-[13.5px] font-semibold transition-all',
      active
        ? 'bg-[#141414] text-white shadow-md'
        : danger
          ? 'text-white/85 hover:bg-black/25 hover:text-white'
          : 'text-white/80 hover:text-white hover:bg-white/10'
    )}
  >
    <Icon className={cn('w-[17px] h-[17px] shrink-0', active ? 'text-white' : 'text-white/80')} />
    <span className="truncate flex-1 text-left">{label}</span>
    {typeof badge === 'number' && badge > 0 && (
      <span className="px-1.5 py-0.5 min-w-[20px] text-center rounded-full bg-white text-[#D4191F] text-[10px] font-extrabold leading-none">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
);

const ROUTE_NAME_MAP: Record<string, string> = {
  Dashboard: '/dashboard',
  Content: '/content',
  Stories: '/stories',
  Comments: '/comments',
  Media: '/media',
  Analytics: '/analytics',
  Notifications: '/notifications',
  Profile: '/profile',
  Settings: '/settings',
  Feedback: '/feedback',
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requireOtpPasswordSetup, setRequireOtpPasswordSetup] = useState(false);
  const [pendingOtpEmail, setPendingOtpEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'suggestion' | 'other'>('suggestion');

  const [applicantEmail, setApplicantEmail] = useState<string>(
    localStorage.getItem('postsapp_applicant_email') || localStorage.getItem('omh_applicant_email') || ''
  );

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('User')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        const allowedRoles = ['ANALYST', 'CREATOR', 'ADMIN'];
        const normalizedRole = String(profile?.role || '').trim().toUpperCase();
        const isActive = (profile?.account_status || 'active') === 'active';
        const mustChangePass = Boolean(session.user.app_metadata?.must_change_password);
        if (allowedRoles.includes(normalizedRole) && isActive) {
          if (mustChangePass) {
            setPendingOtpEmail(session.user.email || profile?.email || '');
            setRequireOtpPasswordSetup(true);
            setIsAuthenticated(false);
          } else {
            setRequireOtpPasswordSetup(false);
            setIsAuthenticated(true);
            setUserProfile(profile);
          }
        } else {
          await supabase.auth.signOut();
        }
      }
      setLoading(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserProfile(null);
        setUnreadNotifCount(0);
        navigate('/');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifCount(0);
      return;
    }

    let cancelled = false;
    const refreshUnread = async () => {
      try {
        const list = await notificationService.getMyNotifications();
        if (!cancelled) {
          setUnreadNotifCount(list.filter((n) => !n.isRead).length);
        }
      } catch {}
    };

    refreshUnread();
    const sub = notificationService.subscribeToNotifications(refreshUnread);

    return () => {
      cancelled = true;
      sub.unsubscribe();
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setRequireOtpPasswordSetup(false);
    setPendingOtpEmail('');
    setUserProfile(null);
    navigate('/');
  };

  const handleLoginSuccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.app_metadata?.must_change_password) {
      setPendingOtpEmail(session.user.email || '');
      setRequireOtpPasswordSetup(true);
      setIsAuthenticated(false);
      navigate('/login');
      return;
    }
    if (session?.user) {
      const { data: profile } = await supabase
        .from('User')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      setUserProfile(profile);
    }
    setRequireOtpPasswordSetup(false);
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const handleNavigate = (pageOrPath: string) => {
    const path = pageOrPath.startsWith('/') ? pageOrPath : (ROUTE_NAME_MAP[pageOrPath] || '/dashboard');
    navigate(path);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleStartEditor = (type: 'blog' | 'news' | 'video') => {
    setShowCreateModal(false);
    navigate(`/editor/new?type=${type}`);
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    setIsSubmittingFeedback(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Not authenticated');

      const { error: insErr } = await supabase.from('Feedback').insert({
        id: crypto.randomUUID(),
        content: feedbackText.trim(),
        category: feedbackCategory,
        userId: user.id,
        createdAt: new Date().toISOString(),
        status: 'pending',
      });
      if (insErr) throw insErr;
      success('Feedback submitted successfully!');
      setFeedbackText('');
    } catch (err: any) {
      error('Failed to submit feedback: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-500 text-xl font-semibold">Loading PostsApp Studio...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (requireOtpPasswordSetup) {
      return (
        <LoginPage
          onBack={() => navigate('/')}
          onLoginSuccess={handleLoginSuccess}
          pendingOtpEmail={pendingOtpEmail}
          requirePasswordSetup
        />
      );
    }
    return (
      <Routes>
        <Route
          path="/terms"
          element={<TermsAndConditions onBack={() => navigate('/')} />}
        />
        <Route
          path="/privacy"
          element={<PrivacyPolicy onBack={() => navigate('/')} />}
        />
        <Route
          path="/login"
          element={
            <LoginPage
              onBack={() => navigate('/')}
              onLoginSuccess={handleLoginSuccess}
              pendingOtpEmail={pendingOtpEmail}
              requirePasswordSetup={requireOtpPasswordSetup}
            />
          }
        />
        <Route
          path="/join"
          element={
            <JoinForm
              onBack={() => navigate('/')}
              onSubmitSuccess={(email: string) => {
                setApplicantEmail(email);
                localStorage.setItem('postsapp_applicant_email', email);
                navigate('/pending');
              }}
            />
          }
        />
        <Route
          path="/pending"
          element={
            <RequestPending
              onBack={() => navigate('/')}
              onGoToLogin={() => {
                localStorage.removeItem('postsapp_applicant_email');
                localStorage.removeItem('omh_applicant_email');
                navigate('/login');
              }}
              applicantEmail={applicantEmail}
            />
          }
        />
        <Route
          path="*"
          element={
            <LandingPage
              onJoinClick={() => navigate('/join')}
              onLoginClick={() => navigate('/login')}
              onTermsClick={() => navigate('/terms')}
              onPrivacyClick={() => navigate('/privacy')}
            />
          }
        />
      </Routes>
    );
  }

  const creatorDisplayName =
    userProfile?.channel_name || userProfile?.username || userProfile?.email?.split('@')[0] || 'Creator';
  const pathname = location.pathname;

  return (
    <div className="flex h-screen bg-gradient-to-b from-[#D4191F] via-[#C1141A] to-[#9E1111] text-[#111827] font-sans overflow-hidden sm:p-2.5 lg:p-3">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/55 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'flex flex-col transition-all duration-300 z-50 shrink-0',
          'fixed inset-y-0 left-0 bg-gradient-to-b from-[#D4191F] to-[#9E1111] lg:bg-none lg:relative',
          sidebarOpen
            ? 'translate-x-0 w-64 sm:w-60 lg:w-60 lg:mr-3'
            : '-translate-x-full w-64 lg:w-0 lg:mr-0 lg:translate-x-0 lg:opacity-0 lg:pointer-events-none overflow-hidden'
        )}
      >
        <div className="h-14 px-3.5 flex items-center justify-between shrink-0">
          <div
            onClick={() => handleNavigate('/dashboard')}
            className="flex items-center gap-2 bg-[#141414] px-3 py-1.5 rounded-xl border border-white/15 shadow-sm cursor-pointer"
          >
            <img src="/logo-postsapp-dark.png" alt="PostsApp Studio" className="h-5 sm:h-6 object-contain" />
            <span className="px-1.5 py-0.5 rounded bg-[#D4191F] text-white text-[9px] font-extrabold tracking-widest uppercase">
              STUDIO
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
            title="Close Sidebar"
          >
            <X className="w-4 h-4 lg:hidden" />
            <ChevronRight className="w-4 h-4 hidden lg:block rotate-180" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto studio-sidebar-scroll px-3 py-2 flex flex-col justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex flex-col gap-0.5">
              <SidebarItem
                icon={LayoutDashboard}
                label="Dashboard"
                active={pathname === '/dashboard' || pathname === '/'}
                onClick={() => handleNavigate('/dashboard')}
              />
              <SidebarItem
                icon={Video}
                label="Content"
                active={pathname.startsWith('/content') || pathname.startsWith('/editor')}
                onClick={() => handleNavigate('/content')}
              />
              <SidebarItem
                icon={Aperture}
                label="Stories"
                active={pathname.startsWith('/stories')}
                onClick={() => handleNavigate('/stories')}
              />
              <SidebarItem
                icon={FolderOpen}
                label="Media Library"
                active={pathname.startsWith('/media')}
                onClick={() => handleNavigate('/media')}
              />
              <SidebarItem
                icon={BarChart2}
                label="Analytics"
                active={pathname.startsWith('/analytics')}
                onClick={() => handleNavigate('/analytics')}
              />
              <SidebarItem
                icon={MessageSquare}
                label="Comments"
                active={pathname.startsWith('/comments')}
                onClick={() => handleNavigate('/comments')}
              />
              <SidebarItem
                icon={Bell}
                label="Notifications"
                active={pathname.startsWith('/notifications')}
                onClick={() => handleNavigate('/notifications')}
                badge={unreadNotifCount}
              />
              <SidebarItem
                icon={User}
                label="Profile"
                active={pathname.startsWith('/profile')}
                onClick={() => handleNavigate('/profile')}
              />
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/15 flex flex-col gap-0.5">
              <SidebarItem
                icon={SettingsIcon}
                label="Settings"
                active={pathname.startsWith('/settings')}
                onClick={() => handleNavigate('/settings')}
              />
              <SidebarItem
                icon={Send}
                label="Send feedback"
                active={pathname.startsWith('/feedback')}
                onClick={() => handleNavigate('/feedback')}
              />
              <SidebarItem icon={LogOut} label="Logout" onClick={handleLogout} danger />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/25 border border-white/15 text-white shrink-0">
            <div className="text-xs font-extrabold tracking-wide mb-1">Bilingual Newsroom</div>
            <p className="text-[11px] text-white/75 leading-snug mb-2.5">
              Write English &amp; Tamil editions, schedule releases &amp; track real performance.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-2 px-3 rounded-xl bg-[#141414] hover:bg-black text-white text-xs font-bold transition-colors shadow-sm"
            >
              + Create Content
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative bg-white sm:rounded-[24px] lg:rounded-[28px] shadow-2xl">
        <header className="h-16 sm:h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-7 sticky top-0 z-20 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Menu className="w-5 h-5 text-[#141414]" />
            </button>
            <div
              onClick={() => handleNavigate('/dashboard')}
              className={cn('flex items-center gap-2 cursor-pointer', sidebarOpen && 'lg:hidden')}
            >
              <img src="/logo-postsapp-light.png" alt="PostsApp" className="h-7 object-contain" />
            </div>
            <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F5F8] border border-gray-100 text-xs font-semibold text-[#4B5563]">
              <span className="w-2 h-2 rounded-full bg-[#D4191F]" />
              <span>
                Welcome, <strong className="text-[#141414]">{creatorDisplayName}</strong>
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-md px-2 hidden xl:block">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNavigate('/content');
              }}
              className="relative"
            >
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-[#9CA3AF]" />
              </div>
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search across your channel..."
                className="w-full pl-10 pr-4 py-2 bg-[#F7F7FA] border border-gray-100 focus:bg-white focus:border-[#D4191F] rounded-full text-xs transition-all outline-none"
              />
            </form>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              onClick={() => setShowCreateModal(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#141414] hover:bg-black text-white rounded-full text-xs font-extrabold tracking-wider transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>CREATE</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="sm:hidden p-2 bg-[#141414] text-white rounded-full transition-colors"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNavigate('/notifications')}
              className="p-2 hover:bg-gray-100 rounded-full relative transition-colors"
              title="Channel notifications"
            >
              <Bell className="w-5 h-5 text-[#141414]" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D4191F] text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleNavigate('/profile')}
              className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-gray-200" alt="Profile" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#D4191F] flex items-center justify-center text-white text-xs font-bold">
                  {creatorDisplayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden md:block text-xs font-medium text-[#4B5563] max-w-[160px] truncate">
                {userProfile?.email || creatorDisplayName}
              </span>
            </button>
          </div>
        </header>

        <main
          className={cn(
            'flex-1 min-h-0 overflow-y-auto studio-main-scroll bg-white',
            pathname.startsWith('/profile') ? 'p-0' : 'p-4 sm:p-6 lg:p-8'
          )}
        >
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  onCreateClick={() => setShowCreateModal(true)}
                  onNavigate={handleNavigate}
                  userProfile={userProfile}
                />
              }
            />
            <Route path="/content" element={<Content />} />
            <Route path="/editor/new" element={<EditorPage userProfile={userProfile} />} />
            <Route path="/editor/:postId" element={<EditorPage userProfile={userProfile} />} />
            <Route path="/stories" element={<StoriesPage />} />
            <Route path="/media" element={<MediaLibraryPage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/comments" element={<Comments />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile onCreatePost={() => setShowCreateModal(true)} />} />
            <Route
              path="/settings"
              element={
                <div className="max-w-[800px] mx-auto animate-in fade-in duration-300">
                  <h1 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight">Settings</h1>
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                      <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold">
                        {creatorDisplayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">{creatorDisplayName}</h2>
                        <p className="text-sm text-gray-500">{userProfile?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="text-sm font-medium text-gray-700">Role</div>
                        <div className="text-sm text-gray-500 mt-1 capitalize">{userProfile?.role || 'Creator'}</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="text-sm font-medium text-gray-700">Account Status</div>
                        <div className="text-sm text-emerald-700 font-semibold mt-1 uppercase">
                          {userProfile?.account_status || 'active'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            />
            <Route
              path="/feedback"
              element={
                <div className="max-w-[700px] mx-auto animate-in fade-in duration-300">
                  <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Send Feedback</h1>
                  <p className="text-sm text-gray-500 mb-6">
                    Report issues or suggest improvements directly to the PostsApp platform team.
                  </p>
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Feedback Type</label>
                      <div className="flex gap-2">
                        {(['suggestion', 'bug', 'other'] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setFeedbackCategory(cat)}
                            className={cn(
                              'px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors',
                              feedbackCategory === cat ? 'bg-[#D4191F] text-white' : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Message</label>
                      <textarea
                        rows={5}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Share details..."
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#D4191F]"
                      />
                    </div>
                    <button
                      onClick={handleFeedbackSubmit}
                      disabled={isSubmittingFeedback || !feedbackText.trim()}
                      className="px-6 py-3 bg-[#D4191F] hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                    >
                      {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </div>
                </div>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Create Content Format Picker Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Choose Content Format</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 gap-3">
              <button
                onClick={() => handleStartEditor('news')}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#D4191F] hover:bg-red-50/40 transition-all text-left"
              >
                <div className="w-11 h-11 rounded-full bg-red-100 text-[#D4191F] flex items-center justify-center shrink-0">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Bilingual News Article</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Rich TipTap editorial editor with English &amp; Tamil linking and SEO metadata</p>
                </div>
              </button>
              <button
                onClick={() => handleStartEditor('blog')}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all text-left"
              >
                <div className="w-11 h-11 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Quick Headline / Brief</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Fast-turnaround headline brief or analysis</p>
                </div>
              </button>
              <button
                onClick={() => handleStartEditor('video')}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left"
              >
                <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Video Report</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Upload MP4/WebM video report with bilingual article notes</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
