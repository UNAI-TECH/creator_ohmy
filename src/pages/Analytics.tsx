import React, { useState, useEffect } from 'react';
import { 
  Sparkles, MoreVertical, ChevronDown, 
  Eye, Clock, Users, ArrowUpRight, FileText, Newspaper, Video
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BarChart, Bar, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { contentService, CreatorStats, CreatorPost } from '../services/contentService';

const tabs = ['Overview', 'Content', 'Audience', 'Trends'];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeMetric, setActiveMetric] = useState('Votes');
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, postsData] = await Promise.all([
          contentService.getMyStats(),
          contentService.getMyPosts(),
        ]);
        setStats(statsData);
        setPosts(postsData);
      } catch (e) {
        console.warn('Analytics fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build chart data from recent posts
  const chartData = posts.slice(0, 10).reverse().map(p => ({
    name: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    votes: p.vote_count,
    comments: p.comment_count,
  }));

  // Top performing posts
  const topPosts = [...posts].sort((a, b) => b.vote_count - a.vote_count).slice(0, 5);

  return (
    <div className="min-h-[calc(100vh-64px)] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-[#0f0f0f] text-white font-sans animate-in fade-in duration-300">
      <div className="max-w-[1600px] mx-auto w-full">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">Channel analytics</h1>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 mb-6 gap-4">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-3 text-sm font-medium whitespace-nowrap transition-colors relative",
                  activeTab === tab ? "text-white" : "text-gray-400 hover:text-gray-200"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              Loading analytics...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Chart Card */}
            <div className="lg:col-span-2 bg-[#1f1f1f] rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-lg">
              
              <div className="p-8 text-center border-b border-white/10">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Your channel has <span className="text-blue-400">{stats?.totalPosts || 0}</span> posts with <span className="text-blue-400">{stats?.totalVotes || 0}</span> total votes
                </h2>
              </div>

              <div className="flex border-b border-white/10">
                <button 
                  onClick={() => setActiveMetric('Votes')}
                  className={cn(
                    "flex-1 py-4 flex flex-col items-center justify-center transition-colors relative",
                    activeMetric === 'Votes' ? "bg-white/5" : "hover:bg-white/5"
                  )}
                >
                  <span className="text-sm font-medium text-gray-400">Votes</span>
                  <span className="text-2xl text-white font-medium mt-1">{stats?.totalVotes || 0}</span>
                  {activeMetric === 'Votes' && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#60a5fa] rounded-t-full shadow-[0_-2px_8px_rgba(96,165,250,0.5)]" />}
                </button>
                
                <div className="w-px bg-white/10 my-4" />
                
                <button 
                  onClick={() => setActiveMetric('Comments')}
                  className={cn(
                    "flex-1 py-4 flex flex-col items-center justify-center transition-colors relative",
                    activeMetric === 'Comments' ? "bg-white/5" : "hover:bg-white/5"
                  )}
                >
                  <span className="text-sm font-medium text-gray-400">Comments</span>
                  <span className="text-2xl text-white font-medium mt-1">{stats?.totalComments || 0}</span>
                  {activeMetric === 'Comments' && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#34d399] rounded-t-full shadow-[0_-2px_8px_rgba(52,211,153,0.5)]" />}
                </button>
                
                <div className="w-px bg-white/10 my-4" />
                
                <button 
                  onClick={() => setActiveMetric('Followers')}
                  className={cn(
                    "flex-1 py-4 flex flex-col items-center justify-center transition-colors relative",
                    activeMetric === 'Followers' ? "bg-white/5" : "hover:bg-white/5"
                  )}
                >
                  <span className="text-sm font-medium text-gray-400">Followers</span>
                  <span className="text-2xl text-white font-medium mt-1">{stats?.totalFollowers || 0}</span>
                  {activeMetric === 'Followers' && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#a78bfa] rounded-t-full shadow-[0_-2px_8px_rgba(167,139,250,0.5)]" />}
                </button>
              </div>

              <div className="p-6 flex-1 flex flex-col min-h-[350px]">
                {chartData.length > 0 ? (
                  <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" strokeOpacity={0.05} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={15} tickMargin={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} tickCount={5} orientation="right" dx={10} />
                        <RechartsTooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                          labelStyle={{ color: '#888', marginBottom: '8px' }}
                        />
                        {activeMetric === 'Votes' && (
                          <Bar dataKey="votes" name="Votes" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                        )}
                        {activeMetric === 'Comments' && (
                          <Bar dataKey="comments" name="Comments" fill="#34d399" radius={[6, 6, 0, 0]} />
                        )}
                        {activeMetric === 'Followers' && (
                          <Bar dataKey="votes" name="Engagement" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    No data yet. Publish content to see your analytics chart.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Content Distribution + Top Posts */}
            <div className="flex flex-col gap-6">
              {/* Content Distribution */}
              <div className="bg-[#1f1f1f] rounded-2xl border border-white/10 p-6 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4">Content Distribution</h2>
                <div className="space-y-4">
                  <DistributionRow label="Blogs" count={stats?.blogCount || 0} total={stats?.totalPosts || 1} color="#8B5CF6" icon={FileText} />
                  <DistributionRow label="News" count={stats?.newsCount || 0} total={stats?.totalPosts || 1} color="#0EA5E9" icon={Newspaper} />
                  <DistributionRow label="Videos" count={stats?.videoCount || 0} total={stats?.totalPosts || 1} color="#EF4444" icon={Video} />
                </div>
              </div>

              {/* Top performing */}
              <div className="bg-[#1f1f1f] rounded-2xl border border-white/10 p-6 shadow-lg flex-1">
                <h2 className="text-xl font-bold text-white mb-4">Top Performing</h2>
                {topPosts.length > 0 ? (
                  <div className="space-y-3">
                    {topPosts.map((post, i) => (
                      <div key={post.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{post.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{post.vote_count} votes · {post.comment_count} comments</div>
                        </div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ 
                          backgroundColor: (post.type === 'blog' ? '#8B5CF6' : post.type === 'news' ? '#0EA5E9' : '#EF4444') + '20',
                          color: post.type === 'blog' ? '#8B5CF6' : post.type === 'news' ? '#0EA5E9' : '#EF4444'
                        }}>
                          {post.type}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No posts yet. Publish content to see rankings.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const DistributionRow = ({ label, count, total, color, icon: Icon }: { label: string; count: number; total: number; color: string; icon: any }) => {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-sm font-medium text-gray-300">{label}</span>
        </div>
        <span className="text-sm text-gray-400">{count} ({percent}%)</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};
