import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  ArrowLeft,
  Save,
  Send,
  Calendar,
  Archive,
  Eye,
  Monitor,
  Smartphone,
  Languages,
  Image as ImageIcon,
  Globe,
  History,
  RotateCcw,
  Link2,
  Unlink,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Film,
  Tag as TagIcon,
} from 'lucide-react';
import TipTapEditor from '../components/TipTapEditor';
import MediaLibraryModal from '../components/MediaLibraryModal';
import {
  contentService,
  slugifyText,
  SupportedLanguage,
  PostTypeLower,
  PostStatusUpper,
  CategoryRecord,
  TagRecord,
  PostRevisionRecord,
  MediaAssetRecord,
} from '../services/contentService';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';

type InspectorTab = 'taxonomy' | 'seo' | 'publish' | 'revisions';
type PreviewMode = 'edit' | 'desktop' | 'mobile';

export default function EditorPage({ userProfile }: { userProfile?: any }) {
  const { postId: paramPostId } = useParams<{ postId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error, toast } = useToast();

  const [postId, setPostId] = useState<string | null>(
    paramPostId && paramPostId !== 'new' ? paramPostId : null
  );
  const [loading, setLoading] = useState<boolean>(Boolean(paramPostId && paramPostId !== 'new'));
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [saveStateLabel, setSaveStateLabel] = useState('Not saved yet');
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState<string | null>(null);

  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('taxonomy');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('edit');
  const [showFeaturedPicker, setShowFeaturedPicker] = useState(false);
  const [showOgPicker, setShowOgPicker] = useState(false);
  const [showVideoPicker, setShowVideoPicker] = useState(false);

  // Content fields
  const initialLangParam = (searchParams.get('lang') === 'ta' ? 'ta' : 'en') as SupportedLanguage;
  const initialTypeParam = (['blog', 'news', 'video', 'update'].includes(searchParams.get('type') || '')
    ? searchParams.get('type')
    : 'news') as PostTypeLower;
  const translateFromId = searchParams.get('translateFrom');
  const initialGroupId = searchParams.get('groupId');

  const [language, setLanguage] = useState<SupportedLanguage>(initialLangParam);
  const [postType, setPostType] = useState<PostTypeLower>(initialTypeParam);
  const [status, setStatus] = useState<PostStatusUpper>('DRAFT');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugConflict, setSlugConflict] = useState(false);
  const [contentHtml, setContentHtml] = useState('');
  const [contentJson, setContentJson] = useState<any>(null);

  // Featured & video
  const [thumbnail, setThumbnail] = useState('');
  const [featuredAlt, setFeaturedAlt] = useState('');
  const [featuredCaption, setFeaturedCaption] = useState('');
  const [featuredCredit, setFeaturedCredit] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('');

  // Scheduling & Byline
  const [scheduledFor, setScheduledFor] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorPosition, setAuthorPosition] = useState('');

  // Taxonomy
  const [allCategories, setAllCategories] = useState<CategoryRecord[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<TagRecord[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagRecord[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Translation Group
  const [translationGroupId, setTranslationGroupId] = useState<string | null>(initialGroupId);
  const [siblings, setSiblings] = useState<any[]>([]);
  const [linkablePosts, setLinkablePosts] = useState<any[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState('');

  // SEO & Social
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [robotsIndex, setRobotsIndex] = useState(true);

  // Revisions & Local Draft Recovery
  const [revisions, setRevisions] = useState<PostRevisionRecord[]>([]);
  const [localRecoveryDraft, setLocalRecoveryDraft] = useState<any | null>(null);
  const isDirtyRef = useRef(false);

  const draftStorageKey = `postsapp_draft_${postId || 'new'}`;

  // Load categories, tags, and post details
  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const [cats, tags] = await Promise.all([
          contentService.getCategories(),
          contentService.getTags(),
        ]);
        setAllCategories(cats);
        setAllTags(tags);
      } catch (e: any) {
        console.warn('Taxonomy load failed:', e);
      }
    };
    loadTaxonomy();
  }, []);

  useEffect(() => {
    const targetId = paramPostId && paramPostId !== 'new' ? paramPostId : null;
    setPostId(targetId);

    if (!targetId) {
      setLoading(false);
      // Check local recovery for new draft
      const savedRaw = localStorage.getItem('postsapp_draft_new');
      if (savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw);
          if (parsed?.title || parsed?.contentHtml) {
            setLocalRecoveryDraft(parsed);
          }
        } catch {
          // ignore
        }
      }
      return;
    }

    const loadPost = async () => {
      setLoading(true);
      try {
        const detail = await contentService.getPostForEditor(targetId);
        const p = detail.post;
        setTitle(p.title || '');
        setSubtitle(p.subtitle || '');
        setShortDescription(p.short_description || '');
        setSlug(p.slug || '');
        setSlugTouched(Boolean(p.slug));
        setLanguage((p.language === 'ta' ? 'ta' : 'en') as SupportedLanguage);
        setPostType((p.type?.toLowerCase() || 'news') as PostTypeLower);
        setStatus((p.status || 'PUBLISHED') as PostStatusUpper);
        setContentHtml(p.content || '');
        setContentJson(p.content_json || null);
        setThumbnail(p.thumbnail || '');
        setFeaturedAlt(p.featured_image_alt || '');
        setFeaturedCaption(p.featured_image_caption || '');
        setFeaturedCredit(p.featured_image_credit || '');
        setVideoUrl(p.videoUrl || '');
        setVideoDuration(p.videoDuration || '');
        setScheduledFor(p.scheduledFor ? new Date(p.scheduledFor).toISOString().slice(0, 16) : '');
        setAuthorName(p.author_name || '');
        setAuthorPosition(p.author_position || '');
        setSelectedCategoryIds(detail.categoryIds);
        setSelectedTags(detail.tags);
        setTranslationGroupId(p.translation_group_id || null);
        setSiblings(detail.siblings || []);
        setSeoTitle(p.seo_title || '');
        setSeoDescription(p.seo_description || '');
        setCanonicalUrl(p.canonical_url || '');
        setOgTitle(p.og_title || '');
        setOgDescription(p.og_description || '');
        setOgImage(p.og_image || '');
        setRobotsIndex(p.robots_index !== false);
        setRevisions(detail.revisions || []);
        setLoadedUpdatedAt(p.updatedAt || null);
        setSaveStateLabel(`Loaded ${p.updatedAt ? new Date(p.updatedAt).toLocaleTimeString() : ''}`);
        isDirtyRef.current = false;

        // Check local draft recovery
        const savedRaw = localStorage.getItem(`postsapp_draft_${targetId}`);
        if (savedRaw) {
          try {
            const parsed = JSON.parse(savedRaw);
            if (parsed?.savedAt && p.updatedAt && new Date(parsed.savedAt).getTime() > new Date(p.updatedAt).getTime() + 5000) {
              setLocalRecoveryDraft(parsed);
            }
          } catch {
            // ignore
          }
        }
      } catch (e: any) {
        error(e?.message || 'Failed to open article');
      } finally {
        setLoading(false);
      }
    };

    loadPost();

    const postChannel = supabase
      .channel(`editor-post-realtime-${targetId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'Post', filter: `id=eq.${targetId}` },
        (payload) => {
          const updated = payload?.new as any;
          if (!updated) return;
          if (updated.status) setStatus(updated.status as PostStatusUpper);
          if (updated.updatedAt) setLoadedUpdatedAt(updated.updatedAt);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postChannel);
    };
  }, [paramPostId]);

  // Refresh linkable opposite-language posts
  useEffect(() => {
    const oppositeLang: SupportedLanguage = language === 'en' ? 'ta' : 'en';
    contentService
      .getLinkablePosts(postId, oppositeLang)
      .then(setLinkablePosts)
      .catch(() => setLinkablePosts([]));
  }, [language, postId]);

  // Auto-generate slug while not manually overridden
  useEffect(() => {
    if (!slugTouched && title.trim()) {
      setSlug(slugifyText(title, 'article'));
    }
  }, [title, slugTouched]);

  // Live duplicate slug validation
  useEffect(() => {
    const clean = slugifyText(slug, '');
    if (!clean) {
      setSlugConflict(false);
      return;
    }
    const timer = setTimeout(async () => {
      let q = supabase
        .from('Post')
        .select('id')
        .eq('language', language)
        .eq('slug', clean);
      if (postId) q = q.neq('id', postId);
      const { data } = await q.limit(1);
      setSlugConflict(Boolean(data && data.length > 0));
    }, 350);
    return () => clearTimeout(timer);
  }, [slug, language, postId]);

  // Mark dirty + save localStorage backup
  const markDirty = () => {
    isDirtyRef.current = true;
    setSaveStateLabel('Unsaved changes');
  };

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (!isDirtyRef.current) return;
      try {
        localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            title,
            subtitle,
            shortDescription,
            slug,
            language,
            postType,
            contentHtml,
            contentJson,
            thumbnail,
            featuredAlt,
            featuredCaption,
            featuredCredit,
            seoTitle,
            seoDescription,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {
        // ignore storage quota errors
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [title, subtitle, shortDescription, slug, language, postType, contentHtml, contentJson, thumbnail, featuredAlt, featuredCaption, featuredCredit, seoTitle, seoDescription]);

  // Debounced server autosave every 10s when editing an existing draft
  useEffect(() => {
    if (!postId || status !== 'DRAFT') return;
    const interval = setInterval(async () => {
      if (!isDirtyRef.current || !title.trim() || saving || autosaving || slugConflict) return;
      setAutosaving(true);
      try {
        await performSave('DRAFT', { silent: true, createRevision: false });
      } catch {
        // silent fail — keeps dirty flag
      } finally {
        setAutosaving(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [postId, status, title, saving, autosaving, slugConflict]);

  const primaryCategoryName = useMemo(() => {
    if (selectedCategoryIds.length === 0) return 'General';
    const cat = allCategories.find((c) => c.id === selectedCategoryIds[0]);
    return cat ? cat.name_en : 'General';
  }, [selectedCategoryIds, allCategories]);

  const performSave = async (
    targetStatus: PostStatusUpper,
    opts: { silent?: boolean; createRevision?: boolean } = {}
  ) => {
    if (!title.trim()) {
      error('Title is required.');
      return null;
    }
    if (slugConflict) {
      error(`Slug "${slug}" already exists in ${language === 'en' ? 'English' : 'Tamil'}. Change the slug before saving.`);
      return null;
    }
    if (!opts.silent && thumbnail.trim() && !featuredCredit.trim()) {
      error('Image Source is mandatory when a featured image is selected.');
      setInspectorTab('taxonomy');
      return null;
    }
    if (targetStatus === 'PUBLISHED') {
      if (!contentHtml.replace(/<[^>]+>/g, '').trim() && postType !== 'video') {
        error('Article body cannot be empty when publishing.');
        return null;
      }
      if (!thumbnail.trim()) {
        error('Featured image is required before publishing.');
        setInspectorTab('taxonomy');
        return null;
      }
      if (thumbnail.trim() && !featuredAlt.trim()) {
        error('Please provide Featured Image Alt Text for SEO & accessibility before publishing.');
        setInspectorTab('taxonomy');
        return null;
      }
      if (!featuredCredit.trim()) {
        error('Image Source is mandatory before publishing.');
        setInspectorTab('taxonomy');
        return null;
      }
      if (postType === 'video' && !videoUrl.trim()) {
        error('Video URL or uploaded video is required for video posts.');
        return null;
      }
    }
    if (targetStatus === 'SCHEDULED') {
      if (!scheduledFor || new Date(scheduledFor).getTime() <= Date.now()) {
        error('Scheduled date & time must be in the future.');
        return null;
      }
    }

    // Optimistic concurrency check on existing posts
    if (postId && loadedUpdatedAt && !opts.silent) {
      const { data: latest } = await supabase
        .from('Post')
        .select('updatedAt')
        .eq('id', postId)
        .maybeSingle();
      if (latest?.updatedAt && latest.updatedAt !== loadedUpdatedAt) {
        const proceed = window.confirm(
          'This article was modified in another tab or by an administrator since you opened it. Overwrite with your changes?'
        );
        if (!proceed) return null;
      }
    }

    if (!opts.silent) setSaving(true);
    setSaveStateLabel(opts.silent ? 'Autosaving...' : 'Saving...');

    try {
      const saved = await contentService.saveEditorialPost(postId, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        short_description: shortDescription.trim(),
        content: contentHtml,
        content_json: contentJson,
        type: postType,
        language,
        slug: slugifyText(slug || title, 'article'),
        category: primaryCategoryName,
        category_ids: selectedCategoryIds,
        tag_ids: selectedTags.map((t) => t.id),
        hashtags: selectedTags.map((t) => (language === 'ta' && t.name_ta ? t.name_ta : t.name_en)),
        thumbnail: thumbnail.trim() || undefined,
        featured_image_alt: featuredAlt.trim(),
        featured_image_caption: featuredCaption.trim(),
        featured_image_credit: featuredCredit.trim(),
        video_url: videoUrl.trim() || undefined,
        video_duration: videoDuration.trim() || undefined,
        status: targetStatus,
        scheduledFor: targetStatus === 'SCHEDULED' ? new Date(scheduledFor).toISOString() : undefined,
        is_active: targetStatus !== 'ARCHIVED',
        author_name: authorName.trim() || undefined,
        author_position: authorPosition.trim() || undefined,
        translation_group_id: translationGroupId,
        seo_title: seoTitle.trim() || undefined,
        seo_description: seoDescription.trim() || undefined,
        canonical_url: canonicalUrl.trim() || undefined,
        og_title: ogTitle.trim() || undefined,
        og_description: ogDescription.trim() || undefined,
        og_image: ogImage.trim() || undefined,
        robots_index: robotsIndex,
        create_revision: opts.createRevision ?? (targetStatus === 'PUBLISHED'),
      });

      // If translating from a source article that had no group yet, link them automatically
      if (!postId && translateFromId && saved?.id && !translationGroupId) {
        const grpId = await contentService.linkTranslationPair(translateFromId, saved.id);
        setTranslationGroupId(grpId);
      }

      isDirtyRef.current = false;
      localStorage.removeItem(draftStorageKey);
      setStatus(targetStatus);
      setLoadedUpdatedAt(saved?.updatedAt || new Date().toISOString());
      setSaveStateLabel(`Saved ${new Date().toLocaleTimeString()}`);

      if (!postId && saved?.id) {
        setPostId(saved.id);
        navigate(`/editor/${saved.id}`, { replace: true });
      } else if (postId && !opts.silent) {
        const refreshed = await contentService.getPostForEditor(postId);
        setRevisions(refreshed.revisions || []);
        setSiblings(refreshed.siblings || []);
      }

      if (!opts.silent) {
        success(
          targetStatus === 'PUBLISHED'
            ? 'Article published live!'
            : targetStatus === 'SCHEDULED'
            ? 'Article scheduled cleanly.'
            : targetStatus === 'ARCHIVED'
            ? 'Article moved to Archive.'
            : 'Draft saved.'
        );
      }
      return saved;
    } catch (e: any) {
      setSaveStateLabel('Save failed');
      if (!opts.silent) error(e?.message || 'Save failed');
      return null;
    } finally {
      if (!opts.silent) setSaving(false);
    }
  };

  const handleCreateTranslation = async () => {
    let activePostId = postId;
    if (!activePostId) {
      const saved = await performSave('DRAFT', { createRevision: false });
      if (!saved?.id) return;
      activePostId = saved.id;
    }
    const oppositeLang: SupportedLanguage = language === 'en' ? 'ta' : 'en';
    const params = new URLSearchParams({
      lang: oppositeLang,
      translateFrom: activePostId,
      type: postType,
    });
    if (translationGroupId) params.set('groupId', translationGroupId);
    navigate(`/editor/new?${params.toString()}`);
  };

  const handleLinkExisting = async () => {
    if (!selectedLinkId) return;
    let activePostId = postId;
    if (!activePostId) {
      const saved = await performSave('DRAFT');
      if (!saved?.id) return;
      activePostId = saved.id;
    }
    try {
      const grpId = await contentService.linkTranslationPair(activePostId, selectedLinkId);
      setTranslationGroupId(grpId);
      const refreshed = await contentService.getPostForEditor(activePostId);
      setSiblings(refreshed.siblings || []);
      setSelectedLinkId('');
      success('Translation pair linked.');
    } catch (e: any) {
      error(e?.message || 'Failed to link translation');
    }
  };

  const handleUnlinkTranslation = async () => {
    if (!postId) return;
    try {
      await contentService.unlinkTranslation(postId);
      setTranslationGroupId(null);
      setSiblings([]);
      success('Removed from translation group.');
    } catch (e: any) {
      error(e?.message || 'Failed to unlink translation');
    }
  };

  const handleAddTag = async (raw: string) => {
    const clean = raw.trim().replace(/^#+/, '');
    if (!clean) return;
    try {
      const tag = await contentService.createOrFindTag(clean, language);
      if (!selectedTags.some((t) => t.id === tag.id)) {
        setSelectedTags((prev) => [...prev, tag]);
        markDirty();
      }
      if (!allTags.some((t) => t.id === tag.id)) {
        setAllTags((prev) => [...prev, tag]);
      }
      setTagInput('');
    } catch (e: any) {
      error(e?.message || 'Failed to add tag');
    }
  };

  const handleRestoreRevision = async (revId: string) => {
    if (!window.confirm('Restore this version? Your current content will be preserved in revision history as well.')) return;
    try {
      const restored = await contentService.restoreRevision(revId);
      if (restored) {
        setTitle(restored.title || '');
        setSubtitle(restored.subtitle || '');
        setShortDescription(restored.short_description || '');
        setContentHtml(restored.content || '');
        setContentJson(restored.content_json || null);
        setThumbnail(restored.thumbnail || '');
        setLoadedUpdatedAt(restored.updatedAt || new Date().toISOString());
        if (postId) {
          const refreshed = await contentService.getPostForEditor(postId);
          setRevisions(refreshed.revisions || []);
        }
        isDirtyRef.current = false;
        success('Revision restored!');
      }
    } catch (e: any) {
      error(e?.message || 'Restore failed');
    }
  };

  const applyLocalRecovery = () => {
    if (!localRecoveryDraft) return;
    setTitle(localRecoveryDraft.title || title);
    setSubtitle(localRecoveryDraft.subtitle || subtitle);
    setShortDescription(localRecoveryDraft.shortDescription || shortDescription);
    if (localRecoveryDraft.slug) {
      setSlug(localRecoveryDraft.slug);
      setSlugTouched(true);
    }
    setLanguage(localRecoveryDraft.language || language);
    setPostType(localRecoveryDraft.postType || postType);
    setContentHtml(localRecoveryDraft.contentHtml || contentHtml);
    setContentJson(localRecoveryDraft.contentJson || contentJson);
    setThumbnail(localRecoveryDraft.thumbnail || thumbnail);
    setFeaturedAlt(localRecoveryDraft.featuredAlt || featuredAlt);
    setFeaturedCaption(localRecoveryDraft.featuredCaption || featuredCaption);
    setFeaturedCredit(localRecoveryDraft.featuredCredit || featuredCredit);
    setSeoTitle(localRecoveryDraft.seoTitle || seoTitle);
    setSeoDescription(localRecoveryDraft.seoDescription || seoDescription);
    setLocalRecoveryDraft(null);
    markDirty();
    toast('Recovered unsaved local draft.');
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-500">
        <Loader2 size={32} className="animate-spin text-[#D4191F] mb-3" />
        <p className="text-sm font-medium">Loading Editorial Studio...</p>
      </div>
    );
  }

  const displaySeoTitle = seoTitle.trim() || title.trim() || 'Article Headline';
  const displaySeoDesc =
    seoDescription.trim() ||
    shortDescription.trim() ||
    contentHtml.replace(/<[^>]+>/g, '').slice(0, 155) ||
    'Article description preview will appear here...';
  const displaySlug = slugifyText(slug || title, 'article');

  return (
    <div className="max-w-[1600px] mx-auto pb-14 w-full">
      {/* Top Sticky Action Bar (full-bleed opaque backdrop so preview never bleeds behind) */}
      <div className="sticky -top-4 sm:-top-6 lg:-top-8 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6 bg-white border-b border-gray-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/content')}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-700"
            title="Back to Content"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-gray-900">
                {postId ? 'Edit Story' : 'New Bilingual Story'}
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider',
                  status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'SCHEDULED'
                    ? 'bg-blue-100 text-blue-800'
                    : status === 'ARCHIVED'
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-amber-100 text-amber-800'
                )}
              >
                {status}
              </span>
              <span className="text-xs text-gray-400 hidden sm:inline">
                · {autosaving ? 'Autosaving...' : saveStateLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Edit / Preview switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {[
              { id: 'edit', label: 'Edit', icon: Eye },
              { id: 'desktop', label: 'Desktop', icon: Monitor },
              { id: 'mobile', label: 'Mobile', icon: Smartphone },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPreviewMode(m.id as PreviewMode)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors',
                  previewMode === m.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                )}
              >
                <m.icon size={13} />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => performSave('DRAFT', { createRevision: false })}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save size={14} />
            Save Draft
          </button>

          {postId && (
            status !== 'ARCHIVED' ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => performSave('ARCHIVED')}
                className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Archive size={14} />
                Archive
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => performSave('DRAFT', { createRevision: false })}
                className="px-3.5 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw size={14} />
                Unarchive
              </button>
            )
          )}

          <button
            type="button"
            disabled={saving || slugConflict}
            onClick={() => performSave('PUBLISHED', { createRevision: true })}
            className="px-5 py-2 bg-[#D4191F] hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {status === 'PUBLISHED' ? 'Update Published' : 'Publish Live'}
          </button>
        </div>
      </div>

      {/* Local Draft Recovery Banner */}
      {localRecoveryDraft && (
        <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-amber-900 text-xs sm:text-sm font-medium">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <span>
              An unsaved local backup from{' '}
              <strong>{new Date(localRecoveryDraft.savedAt).toLocaleString()}</strong> was found.
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(draftStorageKey);
                setLocalRecoveryDraft(null);
              }}
              className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={applyLocalRecovery}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold"
            >
              Recover Draft
            </button>
          </div>
        </div>
      )}

      {/* Two-pane Editor Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Main Editorial Pane */}
        <div className="xl:col-span-8 space-y-5">
          {previewMode === 'edit' ? (
            <>
              {/* Format + Language Row */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">Format:</span>
                  {([
                    { id: 'news', label: 'Article' },
                    { id: 'blog', label: 'Headline' },
                    { id: 'video', label: 'Video' },
                    { id: 'update', label: 'Update' },
                  ] as const).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setPostType(t.id);
                        markDirty();
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                        postType === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Languages size={15} className="text-gray-500" />
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    {([
                      { id: 'en', label: 'English (en)' },
                      { id: 'ta', label: 'தமிழ் (ta)' },
                    ] as const).map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setLanguage(l.id);
                          markDirty();
                        }}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-bold transition-colors',
                          language === l.id ? 'bg-[#D4191F] text-white' : 'text-gray-600 hover:text-gray-900'
                        )}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Headline, Subtitle, Excerpt & Slug */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Headline ({language === 'ta' ? 'தமிழ்' : 'English'}) *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      markDirty();
                    }}
                    placeholder={
                      language === 'ta' ? 'செய்தித் தலைப்பை இங்கே உள்ளிடவும்...' : 'Enter compelling news headline...'
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#D4191F] rounded-xl text-lg font-bold text-gray-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Subtitle / Deck
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => {
                      setSubtitle(e.target.value);
                      markDirty();
                    }}
                    placeholder="Optional secondary headline shown beneath the main title..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#D4191F] rounded-xl text-sm text-gray-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Short Description / Lead Summary
                  </label>
                  <textarea
                    rows={2}
                    value={shortDescription}
                    onChange={(e) => {
                      setShortDescription(e.target.value);
                      markDirty();
                    }}
                    placeholder="Concise 1-2 sentence summary used in feeds and social cards..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#D4191F] rounded-xl text-sm text-gray-800 outline-none resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      URL Slug (/{language}/article/{displaySlug})
                    </label>
                    {slugConflict ? (
                      <span className="text-xs font-bold text-red-600">Already used in {language.toUpperCase()}</span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Available
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setSlug(e.target.value);
                        markDirty();
                      }}
                      className={cn(
                        'flex-1 px-3.5 py-2 bg-gray-50 border rounded-xl text-xs font-mono outline-none',
                        slugConflict ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#D4191F]'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSlugTouched(false);
                        setSlug(slugifyText(title, 'article'));
                        markDirty();
                      }}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700"
                    >
                      Auto
                    </button>
                  </div>
                </div>
              </div>

              {/* Video Section if Video format */}
              {postType === 'video' && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Film size={17} className="text-[#D4191F]" />
                      Video Source
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowVideoPicker(true)}
                      className="px-3.5 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold"
                    >
                      Upload / Choose Video
                    </button>
                  </div>
                  {videoUrl ? (
                    <div className="space-y-2">
                      <video src={videoUrl} controls className="w-full max-h-[300px] rounded-xl bg-black" />
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={videoUrl}
                          onChange={(e) => {
                            setVideoUrl(e.target.value);
                            markDirty();
                          }}
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                        />
                        <input
                          type="text"
                          value={videoDuration}
                          onChange={(e) => {
                            setVideoDuration(e.target.value);
                            markDirty();
                          }}
                          placeholder="Duration e.g. 04:20"
                          className="w-36 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Upload an MP4/WebM/MOV video or choose from your Media Library.</p>
                  )}
                </div>
              )}

              {/* Rich TipTap Body */}
              <TipTapEditor
                key={`${postId || 'new'}-${loadedUpdatedAt || 'init'}`}
                contentHtml={contentHtml}
                contentJson={contentJson}
                language={language}
                placeholder={
                  language === 'ta'
                    ? 'விரிவான செய்திக் கட்டுரையை இங்கே எழுதத் தொடங்குங்கள்...'
                    : 'Start writing your story — use the toolbar for headings, quotes, images, galleries & YouTube embeds...'
                }
                onChange={({ html, json }) => {
                  setContentHtml(html);
                  setContentJson(json);
                  markDirty();
                }}
              />
            </>
          ) : (
            /* Live Desktop / Mobile Preview */
            <div className="bg-gray-100 rounded-2xl border border-gray-200 p-6 flex justify-center">
              <article
                className={cn(
                  'bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all',
                  previewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-3xl'
                )}
              >
                {thumbnail && (
                  <img src={thumbnail} alt={featuredAlt || title} className="w-full aspect-video object-cover" />
                )}
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4191F]">
                    <span>{primaryCategoryName}</span>
                    <span>·</span>
                    <span>{language === 'ta' ? 'தமிழ்' : 'English'}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                    {title || 'Untitled Story'}
                  </h1>
                  {subtitle && <p className="text-base text-gray-600 font-medium">{subtitle}</p>}
                  <div className="text-xs text-gray-500 border-y border-gray-100 py-2.5 flex items-center justify-between">
                    <span>
                      By <strong>{authorName || userProfile?.channel_name || userProfile?.username || 'Editorial Desk'}</strong>
                      {authorPosition ? ` · ${authorPosition}` : ''}
                    </span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  {videoUrl && <video src={videoUrl} controls className="w-full rounded-xl bg-black" />}
                  <div
                    className="prose prose-sm sm:prose-base max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentHtml || '<p>No content written yet.</p>') }}
                  />
                </div>
              </article>
            </div>
          )}
        </div>

        {/* Right Editorial Inspector Rail */}
        <aside className="xl:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden xl:sticky xl:top-20">
          <div className="grid grid-cols-4 border-b border-gray-200 bg-gray-50 text-[11px] font-bold">
            {[
              { id: 'taxonomy', label: 'Media/Tags', icon: ImageIcon },
              { id: 'seo', label: 'SEO', icon: Globe },
              { id: 'publish', label: 'Publish', icon: Send },
              { id: 'revisions', label: 'History', icon: History },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setInspectorTab(t.id as InspectorTab)}
                className={cn(
                  'py-3 px-2 flex flex-col items-center gap-1 border-b-2 transition-colors',
                  inspectorTab === t.id
                    ? 'border-[#D4191F] text-[#D4191F] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                )}
              >
                <t.icon size={14} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
            {inspectorTab === 'publish' && (
              <>
                {/* Schedule Control */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Calendar size={14} />
                    Schedule Publication
                  </h4>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => {
                      setScheduledFor(e.target.value);
                      markDirty();
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#D4191F]"
                  />
                  <button
                    type="button"
                    disabled={saving || !scheduledFor}
                    onClick={() => performSave('SCHEDULED', { createRevision: true })}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Schedule Publish (Server Cron)
                  </button>
                </div>

                {/* Translation Group Manager */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Languages size={14} />
                    Bilingual Translation Group
                  </h4>
                  <p className="text-xs text-gray-500">
                    Connect independent English and Tamil editions of this story so readers can switch cleanly between languages.
                  </p>

                  {siblings.length > 0 ? (
                    <div className="space-y-2">
                      {siblings.map((sib) => (
                        <div key={sib.id} className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-700 text-white">
                              {sib.language === 'ta' ? 'தமிழ் (TA)' : 'ENGLISH (EN)'} · {sib.status}
                            </span>
                            <button
                              type="button"
                              onClick={handleUnlinkTranslation}
                              className="text-xs text-red-600 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <Unlink size={12} /> Unlink
                            </button>
                          </div>
                          <p className="text-xs font-bold text-gray-900 line-clamp-2">{sib.title}</p>
                          <button
                            type="button"
                            onClick={() => navigate(`/editor/${sib.id}`)}
                            className="text-xs font-bold text-[#D4191F] hover:underline"
                          >
                            Open translation in Editor →
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={handleCreateTranslation}
                        className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Plus size={14} />
                        Create {language === 'en' ? 'Tamil (தமிழ்)' : 'English'} Translation
                      </button>

                      {linkablePosts.length > 0 && (
                        <div className="flex gap-2">
                          <select
                            value={selectedLinkId}
                            onChange={(e) => setSelectedLinkId(e.target.value)}
                            className="flex-1 px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                          >
                            <option value="">Link existing {language === 'en' ? 'Tamil' : 'English'} post...</option>
                            {linkablePosts.map((lp) => (
                              <option key={lp.id} value={lp.id}>
                                {lp.title}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={!selectedLinkId}
                            onClick={handleLinkExisting}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <Link2 size={13} /> Link
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Author Byline */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Byline Attribution</h4>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => {
                      setAuthorName(e.target.value);
                      markDirty();
                    }}
                    placeholder="Reporter / Author display name (optional)"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={authorPosition}
                    onChange={(e) => {
                      setAuthorPosition(e.target.value);
                      markDirty();
                    }}
                    placeholder="Role / Desk (e.g., Political Correspondent)"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </>
            )}

            {inspectorTab === 'taxonomy' && (
              <>
                {/* Featured Image */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Featured Image *</h4>
                    <button
                      type="button"
                      onClick={() => setShowFeaturedPicker(true)}
                      className="text-xs font-bold text-[#D4191F] hover:underline"
                    >
                      {thumbnail ? 'Change' : 'Choose / Upload'}
                    </button>
                  </div>
                  {thumbnail ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200">
                      <img src={thumbnail} alt={featuredAlt || title} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnail('');
                          markDirty();
                        }}
                        className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowFeaturedPicker(true)}
                      className="w-full py-8 border-2 border-dashed border-gray-300 hover:border-[#D4191F] rounded-xl text-xs font-semibold text-gray-500 flex flex-col items-center gap-1.5"
                    >
                      <ImageIcon size={22} className="text-gray-400" />
                      Pick from Media Library or Upload
                    </button>
                  )}

                  <input
                    type="text"
                    value={featuredAlt}
                    onChange={(e) => {
                      setFeaturedAlt(e.target.value);
                      markDirty();
                    }}
                    placeholder="Alt text (required for publishing)"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                  />
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Image Source *
                    </label>
                    <input
                      type="text"
                      required
                      value={featuredCredit}
                      onChange={(e) => {
                        setFeaturedCredit(e.target.value);
                        markDirty();
                      }}
                      placeholder="Image source * (e.g., Reuters, PTI, Staff)"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-[#D4191F] rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Categories (first selected is primary)
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {allCategories.map((cat) => {
                      const checked = selectedCategoryIds.includes(cat.id);
                      return (
                        <label
                          key={cat.id}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-colors',
                            checked ? 'bg-red-50 border-[#D4191F]/40 font-bold text-gray-900' : 'bg-gray-50 border-gray-200 text-gray-700'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedCategoryIds((prev) =>
                                prev.includes(cat.id) ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                              );
                              markDirty();
                            }}
                            className="accent-[#D4191F]"
                          />
                          <span className="truncate">
                            {language === 'ta' ? `${cat.name_ta} (${cat.name_en})` : cat.name_en}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Tags */}
                <div className="pt-4 border-t border-gray-100 space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <TagIcon size={13} /> Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTags.map((t) => (
                      <span
                        key={t.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-[#D4191F] rounded-full text-xs font-semibold border border-red-100"
                      >
                        #{language === 'ta' && t.name_ta ? t.name_ta : t.name_en}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTags((prev) => prev.filter((x) => x.id !== t.id));
                            markDirty();
                          }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          handleAddTag(tagInput);
                        }
                      }}
                      placeholder="Add tag + Enter..."
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag(tagInput)}
                      className="px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </>
            )}

            {inspectorTab === 'seo' && (
              <>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      <span>SEO Title</span>
                      <span className={seoTitle.length > 60 ? 'text-red-600' : 'text-gray-400'}>
                        {seoTitle.length || title.length}/60
                      </span>
                    </div>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => {
                        setSeoTitle(e.target.value);
                        markDirty();
                      }}
                      placeholder="Defaults to article headline"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      <span>Meta Description</span>
                      <span className={seoDescription.length > 160 ? 'text-red-600' : 'text-gray-400'}>
                        {seoDescription.length}/160
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={seoDescription}
                      onChange={(e) => {
                        setSeoDescription(e.target.value);
                        markDirty();
                      }}
                      placeholder="Concise summary for Google Search..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Canonical URL (optional)</label>
                    <input
                      type="url"
                      value={canonicalUrl}
                      onChange={(e) => {
                        setCanonicalUrl(e.target.value);
                        markDirty();
                      }}
                      placeholder={`https://postsapp.com/${language}/article/${displaySlug}`}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Open Graph Title (Social)</label>
                    <input
                      type="text"
                      value={ogTitle}
                      onChange={(e) => {
                        setOgTitle(e.target.value);
                        markDirty();
                      }}
                      placeholder="Optional social headline override"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Open Graph Description</label>
                    <textarea
                      rows={2}
                      value={ogDescription}
                      onChange={(e) => {
                        setOgDescription(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">OG Share Image</span>
                    <button
                      type="button"
                      onClick={() => setShowOgPicker(true)}
                      className="text-xs font-bold text-[#D4191F] hover:underline"
                    >
                      {ogImage ? 'Change' : 'Select Image'}
                    </button>
                  </div>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                    <span className="text-xs font-bold text-gray-700">Allow search indexing (index, follow)</span>
                    <input
                      type="checkbox"
                      checked={robotsIndex}
                      onChange={(e) => {
                        setRobotsIndex(e.target.checked);
                        markDirty();
                      }}
                      className="accent-[#D4191F]"
                    />
                  </label>
                </div>

                {/* Google SERP Preview */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Google Search Preview</p>
                  <p className="text-[11px] text-emerald-700 truncate">
                    https://postsapp.com/{language}/article/{displaySlug}
                  </p>
                  <p className="text-sm font-semibold text-blue-700 line-clamp-1">{displaySeoTitle}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{displaySeoDesc}</p>
                </div>

                {/* Social Share Card Preview */}
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                  {(ogImage || thumbnail) && (
                    <img src={ogImage || thumbnail} alt="" className="w-full aspect-video object-cover" />
                  )}
                  <div className="p-3">
                    <p className="text-[10px] uppercase text-gray-400 font-bold">postsapp.com</p>
                    <p className="text-xs font-bold text-gray-900 line-clamp-1">{ogTitle || displaySeoTitle}</p>
                    <p className="text-[11px] text-gray-600 line-clamp-2">{ogDescription || displaySeoDesc}</p>
                  </div>
                </div>
              </>
            )}

            {inspectorTab === 'revisions' && (
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Revision History</h4>
                {revisions.length === 0 ? (
                  <p className="text-xs text-gray-400 py-8 text-center">
                    Revisions are automatically saved whenever you publish or update a published article.
                  </p>
                ) : (
                  revisions.map((rev) => (
                    <div key={rev.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-gray-900">Version {rev.version_number}</span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(rev.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 line-clamp-1">{rev.title}</p>
                      <button
                        type="button"
                        onClick={() => handleRestoreRevision(rev.id)}
                        className="text-xs font-bold text-[#D4191F] hover:underline flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Restore this version
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Media Modals */}
      <MediaLibraryModal
        isOpen={showFeaturedPicker}
        onClose={() => setShowFeaturedPicker(false)}
        accept="image"
        title="Select Featured Image"
        onSelect={(asset: MediaAssetRecord) => {
          setThumbnail(asset.public_url);
          if (asset.alt_text && !featuredAlt) setFeaturedAlt(asset.alt_text);
          if (asset.caption && !featuredCaption) setFeaturedCaption(asset.caption);
          if (asset.credit && !featuredCredit) setFeaturedCredit(asset.credit);
          markDirty();
        }}
      />
      <MediaLibraryModal
        isOpen={showOgPicker}
        onClose={() => setShowOgPicker(false)}
        accept="image"
        title="Select Open Graph Social Image"
        onSelect={(asset: MediaAssetRecord) => {
          setOgImage(asset.public_url);
          markDirty();
        }}
      />
      <MediaLibraryModal
        isOpen={showVideoPicker}
        onClose={() => setShowVideoPicker(false)}
        accept="video"
        title="Select or Upload Video"
        onSelect={(asset: MediaAssetRecord) => {
          setVideoUrl(asset.public_url);
          markDirty();
        }}
      />
    </div>
  );
}
