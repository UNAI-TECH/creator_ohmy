import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Users,
  ThumbsUp,
  MessageSquare,
  FileText,
  Languages,
  BarChart2,
  Aperture,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { cn } from '../lib/utils';
import { contentService } from '../services/contentService';
import { useToast } from '../context/ToastContext';

type RangeKey = '7d' | '28d' | '90d' | 'all';

export default function Analytics() {
  const navigate = useNavigate();
  const { error } = useToast();
  const [range, setRange] = useState<RangeKey>('28d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const loadAnalytics = async (selectedRange: RangeKey) => {
    setLoading(true);
    try {
      const now = new Date();
      let fromIso: string | undefined;
      if (selectedRange === '7d') {
        fromIso = new Date(now.getTime() - 7 * 86400000).toISOString();
      } else if (selectedRange === '28d') {
        fromIso = new Date(now.getTime() - 28 * 86400000).toISOString();
      } else if (selectedRange === '90d') {
        fromIso = new Date(now.getTime() - 90 * 86400000).toISOString();
      } else {
        fromIso = new Date('2024-01-01T00:00:00Z').toISOString();
      }

      const res = await contentService.getCreatorAnalytics(fromIso, now.toISOString());
      setData(res);
    } catch (e: any) {
      error(e?.message || 'Failed to load creator analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics(range);
  }, [range]);

  const summary = data?.summary || {};
  const viewsSeries = Array.isArray(data?.viewsSeries) ? data.viewsSeries : [];
  const topPosts = Array.isArray(data?.topPosts) ? data.topPosts : [];
  const byCategory = Array.isArray(data?.byCategory) ? data.byCategory : [];

  return (
    <div className="max-w-[1600px] mx-auto pb-12 w-full animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <BarChart2 className="text-[#D4191F]" size={24} />
            Channel Analytics
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Authoritative view, reaction, story, and bilingual coverage metrics computed from PostgreSQL.
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          {([
            { id: '7d', label: '7 Days' },
            { id: '28d', label: '28 Days' },
            { id: '90d', label: '90 Days' },
            { id: 'all', label: 'All Time' },
          ] as const).map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors',
                range === r.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400">
          <Loader2 size={32} className="animate-spin text-[#D4191F] mb-3" />
          <span className="text-sm">Calculating analytics...</span>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { label: 'Article Views', value: summary.totalViews ?? 0, icon: Eye, color: 'text-[#D4191F]' },
              { label: 'Total Likes', value: summary.totalLikes ?? 0, icon: ThumbsUp, color: 'text-emerald-600' },
              { label: 'Comments', value: summary.totalComments ?? 0, icon: MessageSquare, color: 'text-blue-600' },
              { label: 'Followers', value: summary.totalFollowers ?? 0, icon: Users, color: 'text-purple-600' },
              { label: 'Story Views', value: summary.storyViews ?? 0, icon: Aperture, color: 'text-amber-600' },
              {
                label: 'Published (EN/TA)',
                value: `${summary.englishCount ?? 0} / ${summary.tamilCount ?? 0}`,
                icon: Languages,
                color: 'text-gray-900',
              },
            ].map((k) => (
              <div key={k.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{k.label}</span>
                  <k.icon size={16} className={k.color} />
                </div>
                <p className="text-2xl font-black text-gray-900">{k.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Views Timeseries */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Daily Deduplicated Views</h2>
                  <p className="text-xs text-gray-500">Tracked via server-side PostView recording</p>
                </div>
                <span className="text-xs font-bold text-gray-500">
                  {summary.publishedPosts ?? 0} published · {summary.draftPosts ?? 0} drafts · {summary.scheduledPosts ?? 0} scheduled
                </span>
              </div>

              {viewsSeries.length === 0 ? (
                <div className="h-[280px] flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl">
                  <BarChart2 size={28} className="mb-2 text-gray-300" />
                  <p className="text-xs font-medium">No view activity recorded in this window yet.</p>
                </div>
              ) : (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={viewsSeries} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4191F" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#D4191F" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="views" stroke="#D4191F" strokeWidth={2.5} fill="url(#viewsGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-1">Views by Category</h2>
              <p className="text-xs text-gray-500 mb-4">Top categories across your published work</p>

              {byCategory.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                  No category data yet.
                </div>
              ) : (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byCategory.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis type="category" dataKey="name" width={85} tick={{ fontSize: 11, fill: '#374151' }} />
                      <RechartsTooltip />
                      <Bar dataKey="views" fill="#141414" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Top Performing Published Posts */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText size={17} className="text-[#D4191F]" />
                Top Performing Published Stories
              </h2>
            </div>
            {topPosts.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No published stories yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {topPosts.map((p: any) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/editor/${p.id}`)}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-1.5 py-0.5 bg-gray-900 text-white rounded text-[10px] font-bold uppercase">
                          {p.language || 'en'}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-500 uppercase">{p.category}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 truncate">{p.title}</p>
                    </div>
                    <div className="flex items-center gap-5 text-xs font-semibold text-gray-600 shrink-0">
                      <span className="flex items-center gap-1"><Eye size={13} /> {p.views_count || 0}</span>
                      <span className="flex items-center gap-1"><ThumbsUp size={13} /> {p.likes_count || 0}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={13} /> {p.comments_count || 0}</span>
                      <ExternalLink size={14} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
