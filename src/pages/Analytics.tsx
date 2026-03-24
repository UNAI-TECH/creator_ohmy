import React, { useState, useEffect } from 'react';
import { 
  Sparkles, MoreVertical, ChevronDown, 
  Eye, Clock, Users, ArrowUpRight, FileText, Newspaper, Video,
  TrendingUp, Globe, Smartphone, Tablet, Monitor, UserPlus,
  BarChart2, PieChart, MousePointer2, Share2, Settings, Bell
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BarChart, Bar, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { contentService, CreatorStats, CreatorPost } from '../services/contentService';

const tabs = ['Overview', 'Content', 'Audience', 'Trends'];

// Mock data for Audience
const audienceData = [
  { name: 'India', value: 45, icon: Globe },
  { name: 'United States', value: 25, icon: Globe },
  { name: 'United Kingdom', value: 15, icon: Globe },
  { name: 'Others', value: 15, icon: Globe },
];

const devicesData = [
  { name: 'Mobile', value: 65, icon: Smartphone, color: 'text-blue-600' },
  { name: 'Desktop', value: 30, icon: Monitor, color: 'text-purple-600' },
  { name: 'Tablet', value: 5, icon: Tablet, color: 'text-amber-600' },
];

// Mock data for Trends
const trendsData = [
  { name: 'Mon', views: 400, likes: 240 },
  { name: 'Tue', views: 300, likes: 139 },
  { name: 'Wed', views: 200, likes: 980 },
  { name: 'Thu', views: 278, likes: 390 },
  { name: 'Fri', views: 189, likes: 480 },
  { name: 'Sat', views: 239, likes: 380 },
  { name: 'Sun', views: 349, likes: 430 },
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeMetric, setActiveMetric] = useState('Views');
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, postsData] = await Promise.all([
          contentService.getMyStats().catch(() => null),
          contentService.getMyPosts().catch(() => []),
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

  // Build chart data
  const chartData = posts.length > 0 
    ? posts.slice(0, 10).reverse().map(p => ({
        name: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: p.vote_count * 12, // Mocking views for visual appeal
        likes: p.vote_count,
        comments: p.comment_count,
      }))
    : trendsData;

  const topPosts = [...posts].sort((a, b) => b.vote_count - a.vote_count).slice(0, 5);

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Chart Card */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col shadow-sm">
        <div className="p-8 text-center border-b border-gray-50">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Your channel has <span className="text-red-600">{stats?.totalViews || 1240}</span> views in the last 28 days
          </h2>
          <p className="text-sm text-gray-500 mt-1">That's about <span className="text-green-600 font-semibold">15% more</span> than usual</p>
        </div>

        <div className="flex border-b border-gray-50">
          {[
            { label: 'Views', value: stats?.totalViews || 1240, color: '#ef4444', key: 'Views' },
            { label: 'Watch time', value: '45.2', color: '#3b82f6', key: 'Watch time' },
            { label: 'Subscribers', value: stats?.totalFollowers || 12, color: '#8b5cf6', key: 'Subscribers' },
          ].map(metric => (
            <button 
              key={metric.key}
              onClick={() => setActiveMetric(metric.key)}
              className={cn(
                "flex-1 py-6 flex flex-col items-center justify-center transition-all relative",
                activeMetric === metric.key ? "bg-red-50/30" : "hover:bg-gray-50"
              )}
            >
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{metric.label}</span>
              <span className="text-2xl text-gray-900 font-black mt-1">{metric.value}</span>
              {activeMetric === metric.key && (
                <div className="absolute bottom-0 left-6 right-6 h-1 bg-red-600 rounded-t-full shadow-[0_-2px_8px_rgba(239,68,68,0.2)]" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6 flex-1 flex flex-col min-h-[350px]">
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickCount={6} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}
                />
                <Area type="monotone" dataKey="views" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-time Card */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">Real-time</h2>
          <span className="flex items-center gap-2 text-[10px] font-black tracking-widest text-red-600 bg-red-50 px-2 py-1 rounded-full animate-pulse">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" /> LIVE
          </span>
        </div>

        <div className="mb-8">
          <div className="text-sm font-bold text-gray-400 uppercase">Updating live</div>
          <div className="text-4xl font-black text-gray-900 mt-1">12</div>
          <div className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +2 in last 48h
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="h-24 w-full bg-gray-50 rounded-2xl flex items-end gap-1 p-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex-1 bg-red-100 rounded-t-sm" style={{ height: `${Math.random() * 80 + 20}%` }} />
            ))}
          </div>
          
          <div className="space-y-4">
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Top content</div>
            {topPosts.slice(0, 3).map(post => (
              <div key={post.id} className="flex items-center justify-between group cursor-pointer">
                <span className="text-sm font-medium text-gray-700 group-hover:text-red-600 truncate max-w-[150px]">{post.title}</span>
                <span className="text-sm font-black text-gray-900">{post.vote_count * 5}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="mt-8 text-xs font-black text-blue-600 hover:underline text-left">
          SEE MORE
        </button>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Impressions', value: '14.2K', icon: Eye, color: 'text-blue-600' },
          { label: 'Click rate', value: '4.8%', icon: MousePointer2, color: 'text-green-600' },
          { label: 'Avg. Duration', value: '3:20', icon: Clock, color: 'text-amber-600' },
          { label: 'Shares', value: '84', icon: Share2, color: 'text-purple-600' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <item.icon className={cn("w-5 h-5 mb-3", item.color)} />
            <div className="text-xs font-bold text-gray-400 uppercase">{item.label}</div>
            <div className="text-2xl font-black text-gray-900 mt-1">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Content Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <th className="pb-4 font-black">Content</th>
                <th className="pb-4 font-black">Type</th>
                <th className="pb-4 font-black">Views</th>
                <th className="pb-4 font-black">Avg. View Duration</th>
                <th className="pb-4 font-black">Impressions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.length > 0 ? posts.map(post => (
                <tr key={post.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-gray-100 rounded-md overflow-hidden shrink-0">
                        {post.thumbnail ? <img src={post.thumbnail} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Video className="w-3 h-3 text-gray-300" /></div>}
                      </div>
                      <span className="text-sm font-bold text-gray-900 truncate max-w-[300px]">{post.title}</span>
                    </div>
                  </td>
                  <td className="py-4 font-medium text-xs text-gray-500 capitalize">{post.type}</td>
                  <td className="py-4 font-bold text-sm text-gray-900">{post.vote_count * 12}</td>
                  <td className="py-4 text-sm text-gray-500">2:45 (84%)</td>
                  <td className="py-4 text-sm text-gray-500">{post.vote_count * 150}</td>
                </tr>
              )) : (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
                    <td className="py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                    <td className="py-4"><div className="h-4 bg-gray-100 rounded w-12"></div></td>
                    <td className="py-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                    <td className="py-4"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAudience = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-8">Top Geographies</h2>
        <div className="space-y-6">
          {audienceData.map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">{item.name}</span>
                <span className="text-sm font-black text-gray-900">{item.value}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 rounded-full transition-all duration-1000" 
                  style={{ width: `${item.value}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-8">Device Types</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {devicesData.map((item, i) => (
            <div key={i} className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-red-200 transition-all">
              <item.icon className={cn("w-8 h-8 mx-auto mb-4 transition-transform group-hover:scale-110", item.color)} />
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.name}</div>
              <div className="text-2xl font-black text-gray-900 mt-1">{item.value}%</div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">New vs Returning</div>
              <p className="text-xs text-gray-500 mt-0.5">Your returning subset has grown by 12.4% recently.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Engagement Trends</h2>
          <p className="text-sm text-gray-500 mt-1">Comparing total views and interactions over time</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl text-xs font-bold transition-all">
          LAST 7 DAYS <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="h-[400px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}
            />
            <Line type="monotone" dataKey="views" stroke="#ef4444" strokeWidth={4} dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="likes" stroke="#3b82f6" strokeWidth={4} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-50">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Velocity</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">Your content velocity is stable. Posting 3.2 times per week on average.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Interests</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">Audience interest in "Web Development" has peaked this week.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/50 font-sans animate-in fade-in duration-300 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1200px] mx-auto w-full">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Channel analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Detailed breakdown of your channel performance</p>
          </div>
          <div className="flex items-center gap-3">
             <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm">
               <Settings className="w-5 h-5" />
             </button>
             <button className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-black tracking-wide shadow-lg shadow-red-100 transition-all">
               EXPORT DATA
             </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm mb-8 flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 px-6 rounded-2xl text-xs font-black tracking-widest uppercase transition-all",
                activeTab === tab 
                  ? "bg-gray-900 text-white shadow-lg shadow-gray-200" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Analyzing Data...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'Overview' && renderOverview()}
            {activeTab === 'Content' && renderContent()}
            {activeTab === 'Audience' && renderAudience()}
            {activeTab === 'Trends' && renderTrends()}
          </div>
        )}
      </div>
    </div>
  );
}
