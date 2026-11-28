import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Newspaper,
  Video,
  TrendingUp,
  Trash2,
  Search,
  Edit3,
  Pause,
  Play,
  CopyPlus,
  Archive,
  RotateCcw,
  Plus,
  Languages,
  ChevronLeft,
  ChevronRight,
  Eye,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { contentService, CreatorPost } from '../services/contentService';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { logAndGetFriendlyError } from '../lib/errorHandler';

const TYPE_TABS = [
  { id: 'All', label: 'All' },
  { id: 'blog', label: 'Headlines' },
  { id: 'news', label: 'Articles' },
  { id: 'video', label: 'Videos' },
];

const TYPE_ICONS: Record<string, any> = {
  blog: FileText,
  news: Newspaper,
  video: Video,
  update: TrendingUp,
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
};

export default function Content() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [typeTab, setTypeTab] = useState('All');
  const [langFilter, setLangFilter] = useState<'ALL' | 'en' | 'ta'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views' | 'title'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { confirm } = useModal();
  const { success, error } = useToast();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await contentService.getMyPosts();
      setPosts(data);
    } catch (e: any) {
      error(logAndGetFriendlyError(e, 'Something went wrong while loading your content.', 'Content:fetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    const sub = contentService.subscribeToMyPostUpdates(() => {
      fetchPosts();
    });
    return () => {
      sub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [typeTab, langFilter, statusFilter, sortBy, searchQuery]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = posts.filter((p) => {
      if (typeTab !== 'All' && p.type !== typeTab) return false;
      if (langFilter !== 'ALL' && p.language !== langFilter) return false;
      if (statusFilter !== 'ALL' && (p.status || 'PUBLISHED') !== statusFilter) return false;
      if (q) {
        const hit =
          p.title.toLowerCase().includes(q) ||
          (p.slug || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'views') return b.view_count - a.view_count;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [posts, typeTab, langFilter, statusFilter, sortBy, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (postId: string, title: string) => {
    const ok = await confirm({
      title: 'Delete Content',
      message: `Are you sure you want to permanently delete "${title}"?`,
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await contentService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      success('Deleted successfully.');
    } catch (e: any) {
      error('Delete failed: ' + (e?.message || 'Unknown error'));
    }
  };

  const handleToggleActive = async (post: CreatorPost) => {
    try {
      const next = !post.is_active;
      await contentService.updatePost(post.id, { is_active: next });
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, is_active: next } : p)));
      success(next ? 'Story resumed and visible.' : 'Story paused from public feed.');
    } catch (e: any) {
      error('Failed to update visibility: ' + (e?.message || 'Unknown error'));
    }
  };

  const handleArchiveToggle = async (post: CreatorPost) => {
    try {
      const nextStatus = post.status === 'ARCHIVED' ? 'DRAFT' : 'ARCHIVED';
      await contentService.updatePost(post.id, { status: nextStatus });
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p)));
      success(nextStatus === 'ARCHIVED' ? 'Moved to Archive.' : 'Restored to Drafts.');
    } catch (e: any) {
      error('Failed to update status: ' + (e?.message || 'Unknown error'));
    }
  };

  const handleDuplicate = async (postId: string) => {
    try {
      const dup = await contentService.duplicatePost(postId);
      success('Duplicated as new Draft.');
      if (dup?.id) navigate(`/editor/${dup.id}`);
      else fetchPosts();
    } catch (e: any) {
      error('Duplicate failed: ' + (e?.message || 'Unknown error'));
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10 w-full animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Channel Content</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage bilingual English &amp; Tamil stories, drafts, scheduled releases, and revisions.
          </p>
        </div>
        <button
          onClick={() => navigate('/editor/new')}
          className="px-4 py-2.5 bg-[#D4191F] hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={15} /> New Story
        </button>
      </div>

      {/* Type Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-5 overflow-x-auto no-scrollbar">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTypeTab(tab.id)}
            className={cn(
              'pb-3 text-sm font-semibold whitespace-nowrap transition-colors relative',
              typeTab === tab.id ? 'text-[#D4191F]' : 'text-gray-500 hover:text-gray-900'
            )}
          >
            {tab.label}
            {tab.id !== 'All' && (
              <span className="ml-1.5 text-xs text-gray-400">
                ({posts.filter((p) => p.type === tab.id).length})
              </span>
            )}
            {typeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4191F] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Search & Filters Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, slug, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#D4191F]"
            />
          </div>

          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value as any)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
          >
            <option value="ALL">All Languages</option>
            <option value="en">English (en)</option>
            <option value="ta">தமிழ் (ta)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="views">Most Viewed</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm">Loading content...</div>
        ) : paginated.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">No stories found</p>
            <p className="text-xs text-gray-400 mt-1">Adjust your filters or create a new story.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {paginated.map((post) => {
              const TypeIcon = TYPE_ICONS[post.type] || FileText;
              const status = post.status || 'PUBLISHED';
              return (
                <div
                  key={post.id}
                  className="p-4 sm:px-6 hover:bg-gray-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div
                    className="flex gap-4 flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/editor/${post.id}`)}
                  >
                    <div className="w-28 aspect-video rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                      {post.thumbnail ? (
                        <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <TypeIcon size={20} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded bg-gray-900 text-white text-[10px] font-bold uppercase">
                          {post.language === 'ta' ? 'TA' : 'EN'}
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                            status === 'PUBLISHED'
                              ? post.is_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                              : status === 'SCHEDULED'
                              ? 'bg-blue-100 text-blue-800'
                              : status === 'ARCHIVED'
                              ? 'bg-gray-200 text-gray-700'
                              : 'bg-amber-100 text-amber-800'
                          )}
                        >
                          {status === 'PUBLISHED' && !post.is_active ? 'PAUSED' : status}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-semibold uppercase">
                          {post.category}
                        </span>
                        {post.translation_group_id && (
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold flex items-center gap-1">
                            <Languages size={11} /> Linked
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{post.title}</h3>
                      <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5">
                        /{post.language}/article/{post.slug || post.id} · {formatDate(post.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-5">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1" title="Views">
                        <Eye size={13} /> {post.view_count}
                      </span>
                      <span className="flex items-center gap-1" title="Likes">
                        <ThumbsUp size={13} /> {post.like_count}
                      </span>
                      <span className="flex items-center gap-1" title="Comments">
                        <MessageSquare size={13} /> {post.comment_count}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/editor/${post.id}`)}
                        className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        title="Open in Bilingual Editor"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDuplicate(post.id)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                        title="Duplicate as Draft"
                      >
                        <CopyPlus size={14} />
                      </button>
                      {status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleToggleActive(post)}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                          title={post.is_active ? 'Pause' : 'Resume'}
                        >
                          {post.is_active ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                      )}
                      <button
                        onClick={() => handleArchiveToggle(post)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                        title={status === 'ARCHIVED' ? 'Restore to Drafts' : 'Archive'}
                      >
                        {status === 'ARCHIVED' ? <RotateCcw size={14} /> : <Archive size={14} />}
                      </button>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600"
                        title="Delete permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="font-bold">
                Page {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
