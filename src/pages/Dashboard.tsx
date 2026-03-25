import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Eye, Clock, FileText, Newspaper, Video, Users, ThumbsUp, MessageSquare, TrendingUp
} from 'lucide-react';
import { Card } from '../components/Card';
import { contentService, CreatorPost, CreatorStats } from '../services/contentService';

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

export default function Dashboard() {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<CreatorPost[]>([]);
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, posts, comments] = await Promise.all([
        contentService.getMyStats(),
        contentService.getMyPosts(),
        contentService.getMyComments(),
      ]);
      setStats(statsData);
      setRecentPosts(posts.slice(0, 5));
      setRecentComments(comments.slice(0, 3));
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time subscription
    const sub = contentService.subscribeToMyPostUpdates(() => {
      fetchData();
    });

    return () => { sub.unsubscribe(); };
  }, []);

  // Build chart data from recent posts (last 7 posts as data points)
  const chartData = recentPosts.slice(0, 7).reverse().map(p => ({
    name: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    votes: p.vote_count,
    comments: p.comment_count,
  }));

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto w-full flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Channel dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20 sm:pb-0">
        
        {/* Column 1: Stats Overview */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard 
              icon={FileText} 
              label="Total Content" 
              value={formatNumber(stats?.totalPosts || 0)} 
              color="#8B5CF6" 
            />
            <StatCard 
              icon={ThumbsUp} 
              label="Total Votes" 
              value={formatNumber(stats?.totalVotes || 0)} 
              color="#EF4444" 
            />
            <StatCard 
              icon={MessageSquare} 
              label="Comments" 
              value={formatNumber(stats?.totalComments || 0)} 
              color="#0EA5E9" 
            />
            <StatCard 
              icon={Users} 
              label="Followers"
              value={formatNumber(stats?.totalFollowers || 0)} 
              color="#10B981" 
            />
          </div>

          {/* Content Distribution */}
          <Card title="Content breakdown">
            <div className="flex flex-col gap-4">
              <ContentTypeStat label="Blogs" count={stats?.blogCount || 0} total={stats?.totalPosts || 1} color="#8B5CF6" icon={FileText} />
              <ContentTypeStat label="News" count={stats?.newsCount || 0} total={stats?.totalPosts || 1} color="#0EA5E9" icon={Newspaper} />
              <ContentTypeStat label="Videos" count={stats?.videoCount || 0} total={stats?.totalPosts || 1} color="#EF4444" icon={Video} />
            </div>
          </Card>
        </div>

        {/* Column 2: Chart + Recent Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Performance Chart */}
          <Card title="Engagement overview" action={
            <span className="text-sm text-gray-400">Based on recent posts</span>
          }>
            <div className="flex flex-col h-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4" /> Votes
                  </div>
                  <div className="text-2xl font-medium text-gray-900 mt-2">{formatNumber(stats?.totalVotes || 0)}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Comments
                  </div>
                  <div className="text-2xl font-medium text-gray-900 mt-2">{formatNumber(stats?.totalComments || 0)}</div>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="h-48 -ml-4 w-full relative" style={{ minHeight: '192px' }}>
                  <ResponsiveContainer width="99%" height="100%" debounce={1}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontWeight: 500 }}
                      />
                      <Area type="monotone" dataKey="votes" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorVotes)" name="Votes" />
                      <Area type="monotone" dataKey="comments" stroke="#0EA5E9" strokeWidth={2} fillOpacity={0.1} fill="#0EA5E9" name="Comments" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                  No data yet. Publish content to see your engagement chart.
                </div>
              )}
            </div>
          </Card>

          {/* Recent Uploads Table */}
          <Card title="Recent content" className="flex-1">
            <div className="w-full">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="pb-4 px-4 w-1/2">Content</th>
                      <th className="pb-4 px-4">Type</th>
                      <th className="pb-4 px-4 text-right">Votes</th>
                      <th className="pb-4 px-4 text-right">Comments</th>
                      <th className="pb-4 px-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                    {recentPosts.length > 0 ? (
                      recentPosts.map((post) => {
                        const TypeIcon = TYPE_ICONS[post.type] || FileText;
                        return (
                          <tr key={post.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-4">
                                <div className="relative w-24 aspect-video rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                  {post.thumbnail ? (
                                    <img src={post.thumbnail} className="w-full h-full object-cover" alt={post.title} />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                      <TypeIcon className="w-6 h-6 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 pr-4">
                                  <div className="font-bold text-gray-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                                    {post.title}
                                  </div>
                                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{post.category}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span 
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                                style={{ backgroundColor: (TYPE_COLORS[post.type] || '#6366F1') + '15', color: TYPE_COLORS[post.type] || '#6366F1' }}
                              >
                                {post.type}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right font-black text-gray-900">{post.vote_count}</td>
                            <td className="py-4 px-4 text-right font-black text-gray-900">{post.comment_count}</td>
                            <td className="py-4 px-4 text-right text-gray-500 whitespace-nowrap text-xs font-bold">
                              {formatDate(post.created_at)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={5} className="py-12 text-center text-gray-400">No content yet.</td></tr>
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
                      <div key={post.id} className="p-4 flex gap-4 active:bg-gray-50 transition-colors">
                        <div className="relative w-24 aspect-video rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                          {post.thumbnail ? (
                            <img src={post.thumbnail} className="w-full h-full object-cover" alt={post.title} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <TypeIcon className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight mb-1">{post.title}</h4>
                          <div className="flex items-center justify-between mt-2">
                             <div className="flex items-center gap-2">
                               <ThumbsUp className="w-3.5 h-3.5 text-red-500" />
                               <span className="text-xs font-black text-gray-900">{post.vote_count}</span>
                             </div>
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{post.type}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-gray-400 text-sm">No content yet.</div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Latest Comments */}
      <div className="grid grid-cols-1 mt-6">
        <Card title="Latest comments">
          {recentComments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentComments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-gray-50/50">
                  <div className="w-8 h-8 rounded-full shrink-0 bg-red-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {comment.user.avatar_url ? (
                      <img src={comment.user.avatar_url} className="w-full h-full object-cover" alt={comment.user.username} />
                    ) : (
                      (comment.user.full_name || comment.user.username || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium text-gray-900">{comment.user.full_name || comment.user.username}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1 line-clamp-2">
                      {comment.content}
                    </p>
                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      on: {comment.post_title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              No comments yet. Comments on your posts will appear here.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* Helper Components */

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: color + '15' }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">{label}</div>
  </div>
);

const ContentTypeStat = ({ label, count, total, color, icon: Icon }: { label: string; count: number; total: number; color: string; icon: any }) => {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm text-gray-500">{count} ({percent}%)</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};
