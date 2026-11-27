import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Eye, FileText, Newspaper, Video, Users, ThumbsUp, ThumbsDown,
  MessageSquare, TrendingUp, Plus, Bell, ChevronLeft, ChevronRight, ArrowRight
} from 'lucide-react';
import { Card } from '../components/Card';
import { contentService, CreatorPost, CreatorStats } from '../services/contentService';
import { invalidateMemCache } from '../lib/cache';

interface DashboardProps {
  onCreateClick?: () => void;
  onNavigate?: (page: string) => void;
  userProfile?: any;
}

const formatNumber = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
};

const formatTimeAgo = (iso: string) => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch { return ''; }
};

const TYPE_COLORS: Record<string, string> = {
  blog: '#141414',
  news: '#D4191F',
  video: '#9E1111',
  update: '#374151',
};

const TYPE_ICONS: Record<string, any> = {
  blog: FileText,
  news: Newspaper,
  video: Video,
  update: TrendingUp,
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Dashboard({ onCreateClick, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<CreatorPost[]>([]);
  const [allPosts, setAllPosts] = useState<CreatorPost[]>([]);
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const lastFetchTime = useRef<number>(0);
  const MIN_REFETCH_INTERVAL = 5000;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, posts, comments] = await Promise.all([
        contentService.getMyStats(),
        contentService.getMyPosts(),
        contentService.getMyComments(),
      ]);
      setStats(statsData);
      setAllPosts(posts);
      setRecentPosts(posts.slice(0, 5));
      setRecentComments(comments.slice(0, 3));
      lastFetchTime.current = Date.now();
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const sub = contentService.subscribeToMyPostUpdates(() => {
      invalidateMemCache('creator:stats:');
      invalidateMemCache('creator:posts:');
      invalidateMemCache('creator:comments:');

      if (Date.now() - lastFetchTime.current >= MIN_REFETCH_INTERVAL) {
        fetchData();
      }
    });

    return () => { sub.unsubscribe(); };
  }, []);

  const chartData = recentPosts.slice(0, 7).reverse().map(p => ({
    name: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    likes: p.like_count || 0,
    comments: p.comment_count || 0,
  }));

  // Calendar grid for publishing activity
  const today = useMemo(() => new Date(), []);
  const postDatesSet = useMemo(() => {
    const set = new Set<string>();
    allPosts.forEach((p) => {
      try {
        const d = new Date(p.created_at);
        set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      } catch (_) {}
    });
    return set;
  }, [allPosts]);

  const calendarCells = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: { day: number; inCurrentMonth: boolean; isToday: boolean; hasPost: boolean }[] = [];
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, inCurrentMonth: false, isToday: false, hasPost: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday =
        today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
      const hasPost = postDatesSet.has(`${year}-${month}-${d}`);
      cells.push({ day: d, inCurrentMonth: true, isToday, hasPost });
    }
    while (cells.length % 7 !== 0) {
      const nextDay = cells.length - (firstDayOfMonth + daysInMonth) + 1;
      cells.push({ day: nextDay, inCurrentMonth: false, isToday: false, hasPost: false });
    }
    return cells;
  }, [calendarDate, today, postDatesSet]);

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto w-full flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-gray-500 font-medium">
          <div className="w-5 h-5 border-2 border-[#D4191F] border-t-transparent rounded-full animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto w-full animate-in fade-in duration-300 space-y-6 pb-12">
      {/* Top Two-Column Split matching Reference Dashboard UI (White/Red/Black) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7">
        {/* Left Column: Publishing Calendar + Channel Summary Rows */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Clean Minimal Publishing Calendar Widget */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_4px_20px_rgba(17,24,39,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#141414] tracking-tight">
                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#141414] transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#141414] transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-gray-500 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {calendarCells.map((cell, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center py-1 relative">
                  <span
                    className={
                      cell.isToday
                        ? 'w-7 h-7 rounded-full bg-[#141414] text-white font-bold flex items-center justify-center shadow-sm'
                        : cell.inCurrentMonth
                        ? 'w-7 h-7 rounded-full text-[#141414] font-semibold flex items-center justify-center hover:bg-red-50 transition-colors'
                        : 'w-7 h-7 text-gray-300 font-medium flex items-center justify-center'
                    }
                  >
                    {cell.day}
                  </span>
                  {cell.hasPost && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4191F] mt-0.5" title="Published post" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2x2 Channel KPI Summary Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            <StatCard
              icon={FileText}
              label="Total Content"
              value={formatNumber(stats?.totalPosts || 0)}
              accent="black"
            />
            <StatCard
              icon={Eye}
              label="Total Views"
              value={formatNumber(stats?.totalViews || 0)}
              accent="red"
            />
            <StatCard
              icon={MessageSquare}
              label="Comments"
              value={formatNumber(stats?.totalComments || 0)}
              accent="red"
            />
            <StatCard
              icon={Users}
              label="Followers"
              value={formatNumber(stats?.totalFollowers || 0)}
              accent="black"
            />
          </div>

          {/* Content Breakdown — Reference Task-List Card Styling */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_4px_20px_rgba(17,24,39,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#141414]">Content Breakdown</h3>
                <span className="text-xs font-semibold text-gray-400">({stats?.totalPosts || 0})</span>
              </div>
              {onCreateClick && (
                <button
                  onClick={onCreateClick}
                  className="w-7 h-7 rounded-lg bg-[#141414] hover:bg-[#D4191F] text-white flex items-center justify-center transition-colors"
                  title="Create Content"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <ContentTypeStat label="Blogs & Headlines" count={stats?.blogCount || 0} total={stats?.totalPosts || 1} color="#141414" icon={FileText} />
              <ContentTypeStat label="News Articles" count={stats?.newsCount || 0} total={stats?.totalPosts || 1} color="#D4191F" icon={Newspaper} />
              <ContentTypeStat label="Video Reports" count={stats?.videoCount || 0} total={stats?.totalPosts || 1} color="#9E1111" icon={Video} />
            </div>
          </div>
        </div>

        {/* Right Column: Red Featured Studio Card + Engagement Panel */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Featured Crimson Highlight Card (replacing Wefha's purple Notification banner with Red + Black CTA) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-[#141414]">Studio Spotlight</h3>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('Notifications')}
                  className="text-xs font-semibold text-[#D4191F] hover:text-[#141414] transition-colors"
                >
                  View all
                </button>
              )}
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#D4191F] via-[#C6161C] to-[#9E1111] text-white p-5 sm:p-6 shadow-md">
              {/* Subtle translucent circular rings matching reference card motif */}
              <div className="pointer-events-none absolute -right-6 -bottom-10 w-36 h-36 rounded-full border border-white/15" />
              <div className="pointer-events-none absolute -right-2 -bottom-6 w-24 h-24 rounded-full border border-white/15" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold leading-snug">
                      {recentPosts.length > 0
                        ? `Latest story "${recentPosts[0].title}" has ${formatNumber(recentPosts[0].view_count || 0)} views`
                        : 'Ready to publish your next story on PostsApp'}
                    </h4>
                    <p className="text-xs text-white/80 mt-1">
                      {formatNumber(stats?.totalLikes || 0)} likes · {formatNumber(stats?.totalDislikes || 0)} dislikes · {formatNumber(stats?.totalComments || 0)} comments across your channel
                    </p>
                  </div>
                </div>

                {onCreateClick && (
                  <button
                    onClick={onCreateClick}
                    className="shrink-0 px-4 py-2 rounded-full bg-[#141414] hover:bg-black text-white text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-1.5 w-fit"
                  >
                    <span>Publish now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Engagement Overview Container */}
          <div className="bg-[#F7F7FA] rounded-2xl border border-gray-100 p-5 sm:p-6 flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-[#141414]">Engagement overview</h3>
                <span className="text-xs text-gray-500">Based on recent posts</span>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('Content')}
                  className="px-3.5 py-1.5 rounded-full bg-[#D4191F] hover:bg-[#9E1111] text-white text-xs font-bold transition-colors"
                >
                  Manage Posts
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-xs">
                <div className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                  <ThumbsUp className="w-3.5 h-3.5 text-[#D4191F]" /> Likes
                </div>
                <div className="text-2xl font-bold text-[#141414] mt-1.5">{formatNumber(stats?.totalLikes || 0)}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-xs">
                <div className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                  <ThumbsDown className="w-3.5 h-3.5 text-[#141414]" /> Dislikes
                </div>
                <div className="text-2xl font-bold text-[#141414] mt-1.5">{formatNumber(stats?.totalDislikes || 0)}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-xs">
                <div className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[#D4191F]" /> Comments
                </div>
                <div className="text-2xl font-bold text-[#141414] mt-1.5">{formatNumber(stats?.totalComments || 0)}</div>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-4 h-[230px] w-full relative" style={{ minHeight: '230px' }}>
                <ResponsiveContainer width="99%" height="100%" debounce={1} minWidth={0} minHeight={0}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 6, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLikesRed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4191F" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#D4191F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={8} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
                      itemStyle={{ fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="likes" stroke="#D4191F" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLikesRed)" name="Likes" />
                    <Area type="monotone" dataKey="comments" stroke="#141414" strokeWidth={2} fillOpacity={0.06} fill="#141414" name="Comments" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 h-36 flex items-center justify-center text-gray-400 text-sm">
                No data yet. Publish content to see your engagement chart.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Content + Latest Comments Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7">
        <div className="xl:col-span-8">
          <Card title="Recent content" className="h-full border-gray-100 rounded-2xl">
            <div className="w-full">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="pb-3.5 px-4 w-1/2">Content</th>
                      <th className="pb-3.5 px-4">Type</th>
                      <th className="pb-3.5 px-4 text-right">Views</th>
                      <th className="pb-3.5 px-4 text-right">Comments</th>
                      <th className="pb-3.5 px-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                    {recentPosts.length > 0 ? (
                      recentPosts.map((post) => {
                        const TypeIcon = TYPE_ICONS[post.type] || FileText;
                        const badgeColor = TYPE_COLORS[post.type] || '#141414';
                        return (
                          <tr key={post.id} className="hover:bg-[#F7F7FA] transition-colors group cursor-pointer" onClick={() => onNavigate?.('Content')}>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3.5">
                                <div className="relative w-20 aspect-video rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                  {post.thumbnail ? (
                                    <img src={post.thumbnail} className="w-full h-full object-cover" alt={post.title} />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                      <TypeIcon className="w-5 h-5 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 pr-3">
                                  <div className="font-bold text-[#141414] line-clamp-1 group-hover:text-[#D4191F] transition-colors">
                                    {post.title}
                                  </div>
                                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{post.category}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                                style={{ backgroundColor: badgeColor + '14', color: badgeColor }}
                              >
                                {post.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-[#141414]">{post.view_count || 0}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-[#141414]">{post.comment_count || 0}</td>
                            <td className="py-3.5 px-4 text-right text-gray-500 whitespace-nowrap text-xs font-semibold">
                              {formatDate(post.created_at)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-sm">No content yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-100 -mx-6">
                {recentPosts.length > 0 ? (
                  recentPosts.map((post) => {
                    const TypeIcon = TYPE_ICONS[post.type] || FileText;
                    return (
                      <div key={post.id} className="p-4 flex gap-3.5 active:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigate?.('Content')}>
                        <div className="relative w-20 aspect-video rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                          {post.thumbnail ? (
                            <img src={post.thumbnail} className="w-full h-full object-cover" alt={post.title} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <TypeIcon className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#141414] text-sm line-clamp-2 leading-tight mb-1">{post.title}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-[#D4191F]" />
                              <span className="text-xs font-bold text-[#141414]">{post.view_count || 0}</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{post.type}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-10 text-center text-gray-400 text-sm">No content yet.</div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Latest Reader Comments Thread matching Reference Bubble Feed */}
        <div className="xl:col-span-4">
          <div className="bg-[#F7F7FA] rounded-2xl border border-gray-100 p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#141414]">Latest comments</h3>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('Comments')}
                  className="text-xs font-semibold text-[#D4191F] hover:text-[#141414] transition-colors"
                >
                  Open thread
                </button>
              )}
            </div>

            {recentComments.length > 0 ? (
              <div className="flex flex-col gap-3 flex-1">
                {recentComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full shrink-0 bg-[#141414] flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {comment.user.avatar_url ? (
                        <img src={comment.user.avatar_url} className="w-full h-full object-cover" alt={comment.user.username} />
                      ) : (
                        (comment.user.full_name || comment.user.username || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0 bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 border border-gray-100 shadow-xs">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
                        <span className="font-bold text-[#141414] truncate">{comment.user.full_name || comment.user.username}</span>
                        <span className="shrink-0">{formatTimeAgo(comment.created_at)}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 mt-1 line-clamp-2 leading-relaxed">
                        {comment.content}
                      </p>
                      <div className="text-[11px] text-[#D4191F] font-semibold mt-1.5 truncate">
                        on: {comment.post_title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-gray-100 p-4">
                <MessageSquare className="w-7 h-7 text-gray-300 mb-2" />
                No comments yet. Reader discussions will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Helper Components */

const StatCard = ({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  accent: 'red' | 'black';
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_4px_16px_rgba(17,24,39,0.03)] hover:border-[#D4191F]/30 transition-all">
    <div
      className={
        accent === 'red'
          ? 'w-9 h-9 rounded-xl bg-[#FEF2F2] text-[#D4191F] flex items-center justify-center mb-3'
          : 'w-9 h-9 rounded-xl bg-[#141414] text-white flex items-center justify-center mb-3'
      }
    >
      <Icon className="w-4 h-4" />
    </div>
    <div className="text-2xl font-extrabold text-[#141414] tracking-tight">{value}</div>
    <div className="text-[11px] text-gray-500 mt-0.5 font-semibold uppercase tracking-wide">{label}</div>
  </div>
);

const ContentTypeStat = ({
  label,
  count,
  total,
  color,
  icon: Icon,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  icon: any;
}) => {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="p-3 rounded-xl border border-gray-100 bg-[#FAFAFC]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <span className="text-xs font-bold text-[#141414]">{label}</span>
        </div>
        <span className="text-xs font-semibold text-gray-500">{count} ({percent}%)</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200/80 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};
