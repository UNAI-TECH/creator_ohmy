import { supabase } from '../lib/supabaseClient';
import { getMemCache, setMemCache, invalidateMemCache } from '../lib/cache';

export type SupportedLanguage = 'en' | 'ta';
export type PostTypeLower = 'blog' | 'video' | 'news' | 'update';
export type PostStatusUpper = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';

export interface PostData {
  title: string;
  subtitle?: string;
  short_description?: string;
  content: string;
  content_json?: any;
  type: PostTypeLower;
  language?: SupportedLanguage;
  slug?: string;
  category?: string;
  custom_category?: string | null;
  category_ids?: string[];
  tag_ids?: string[];
  thumbnail?: string;
  featured_image_alt?: string;
  featured_image_caption?: string;
  featured_image_credit?: string;
  video_url?: string;
  video_duration?: string;
  status?: PostStatusUpper;
  scheduledFor?: string;
  is_active?: boolean;
  author_name?: string;
  author_position?: string;
  hashtags?: string[];
  translation_group_id?: string | null;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  robots_index?: boolean;
  create_revision?: boolean;
}

export interface CreatorPost {
  id: string;
  title: string;
  subtitle: string | null;
  short_description: string | null;
  content: string;
  content_json: any;
  type: string;
  language: SupportedLanguage;
  slug: string | null;
  category: string;
  custom_category: string | null;
  thumbnail: string | null;
  video_url: string | null;
  video_duration: string | null;
  status: string;
  scheduledFor?: string | null;
  published_at?: string | null;
  published: boolean;
  is_active: boolean;
  translation_group_id: string | null;
  created_at: string;
  updated_at: string;
  like_count: number;
  dislike_count: number;
  view_count: number;
  comment_count: number;
  save_count: number;
  share_count: number;
  visibility: string;
}

export interface CategoryRecord {
  id: string;
  name_en: string;
  name_ta: string;
  slug_en: string;
  slug_ta: string;
  description_en: string | null;
  description_ta: string | null;
  display_order: number;
  is_active: boolean;
}

export interface TagRecord {
  id: string;
  name_en: string;
  name_ta: string | null;
  slug_en: string;
  slug_ta: string | null;
}

export interface MediaAssetRecord {
  id: string;
  owner_id: string | null;
  bucket: string;
  storage_path: string;
  public_url: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  caption: string | null;
  credit: string | null;
  asset_kind: string;
  is_public: boolean;
  created_at: string;
}

export interface PostRevisionRecord {
  id: string;
  post_id: string;
  version_number: number;
  title: string;
  subtitle: string | null;
  short_description: string | null;
  content: string | null;
  content_json: any;
  featured_image: string | null;
  seo_metadata: Record<string, any> | null;
  modified_by: string | null;
  created_at: string;
}

export interface CreatorStats {
  totalPosts: number;
  totalViews: number;
  totalComments: number;
  totalVotes: number;
  totalLikes: number;
  totalDislikes: number;
  totalFollowers: number;
  totalSaves: number;
  totalShares: number;
  blogCount: number;
  newsCount: number;
  videoCount: number;
}

export interface CreatorComment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  post_title: string;
  post_thumbnail: string | null;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
  likes: number;
  dislikes: number;
  hearted: boolean;
  parentId: string | null;
}

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
]);

export function slugifyText(input: string, fallback = 'article'): string {
  const cleaned = (input || '')
    .toLowerCase()
    .trim()
    .replace(/['’`]/g, '')
    .replace(/[^\w\u0B80-\u0BFF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
    .replace(/-+$/, '');
  return cleaned || fallback;
}

function getImageDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ width: null, height: null });
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const width = img.naturalWidth || null;
      const height = img.naturalHeight || null;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: null, height: null });
    };
    img.src = url;
  });
}

export const contentService = {
  async saveEditorialPost(postId: string | null, postData: PostData) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const payload: Record<string, any> = {
      title: postData.title,
      subtitle: postData.subtitle ?? null,
      short_description: postData.short_description ?? null,
      content: postData.content || '',
      type: (postData.type || 'news').toUpperCase(),
      language: postData.language || 'en',
      category: postData.category || 'General',
      custom_category: postData.custom_category ?? null,
      thumbnail: postData.thumbnail ?? null,
      featured_image_alt: postData.featured_image_alt ?? null,
      featured_image_caption: postData.featured_image_caption ?? null,
      featured_image_credit: postData.featured_image_credit ?? null,
      videoUrl: postData.video_url ?? null,
      videoDuration: postData.video_duration ?? null,
      status: postData.status || 'DRAFT',
      is_active: postData.is_active !== undefined ? postData.is_active : true,
      author_name: postData.author_name ?? null,
      author_position: postData.author_position ?? null,
      hashtags: postData.hashtags ?? [],
      seo_title: postData.seo_title ?? null,
      seo_description: postData.seo_description ?? null,
      canonical_url: postData.canonical_url ?? null,
      og_title: postData.og_title ?? null,
      og_description: postData.og_description ?? null,
      og_image: postData.og_image ?? null,
      robots_index: postData.robots_index !== undefined ? postData.robots_index : true,
      create_revision: Boolean(postData.create_revision),
    };

    if (postData.slug !== undefined && postData.slug.trim()) {
      payload.slug = postData.slug.trim();
    }
    if (postData.content_json !== undefined) {
      payload.content_json = postData.content_json;
    }
    if (postData.scheduledFor) {
      payload.scheduledFor = postData.scheduledFor;
    }
    if (postData.translation_group_id !== undefined) {
      payload.translation_group_id = postData.translation_group_id || '';
    }
    if (postData.category_ids !== undefined) {
      payload.category_ids = postData.category_ids;
    }
    if (postData.tag_ids !== undefined) {
      payload.tag_ids = postData.tag_ids;
    }

    const { data, error } = await supabase.rpc('save_editorial_post', {
      p_post_id: postId,
      p_payload: payload,
    });

    if (error) throw error;

    invalidateMemCache(`creator:posts:${user.id}`);
    invalidateMemCache(`creator:stats:${user.id}`);
    invalidateMemCache(`creator:comments:${user.id}`);
    return data;
  },

  async createPost(postData: PostData) {
    return this.saveEditorialPost(null, postData);
  },

  async updatePost(postId: string, updates: Partial<PostData>) {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Fetch existing so partial updates keep required fields intact when calling RPC
    const { data: existing, error: fetchErr } = await supabase
      .from('Post')
      .select('*')
      .eq('id', postId)
      .single();
    if (fetchErr || !existing) throw fetchErr || new Error('Post not found');

    const payload: PostData = {
      title: updates.title ?? existing.title,
      subtitle: updates.subtitle !== undefined ? updates.subtitle : existing.subtitle,
      short_description: updates.short_description !== undefined ? updates.short_description : existing.short_description,
      content: updates.content !== undefined ? updates.content : existing.content,
      content_json: updates.content_json !== undefined ? updates.content_json : existing.content_json,
      type: (updates.type ?? (existing.type?.toLowerCase() || 'news')) as PostTypeLower,
      language: (updates.language ?? existing.language ?? 'en') as SupportedLanguage,
      slug: updates.slug !== undefined ? updates.slug : existing.slug,
      category: updates.category ?? existing.category ?? 'General',
      custom_category: updates.custom_category !== undefined ? updates.custom_category : existing.custom_category,
      thumbnail: updates.thumbnail !== undefined ? updates.thumbnail : existing.thumbnail,
      featured_image_alt: existing.featured_image_alt,
      featured_image_caption: existing.featured_image_caption,
      featured_image_credit: existing.featured_image_credit,
      video_url: updates.video_url !== undefined ? updates.video_url : existing.videoUrl,
      video_duration: updates.video_duration !== undefined ? updates.video_duration : existing.videoDuration,
      status: (updates.status ?? existing.status ?? 'PUBLISHED') as PostStatusUpper,
      scheduledFor: updates.scheduledFor !== undefined ? updates.scheduledFor : existing.scheduledFor,
      is_active: updates.is_active !== undefined ? updates.is_active : existing.is_active,
      author_name: updates.author_name !== undefined ? updates.author_name : existing.author_name,
      author_position: updates.author_position !== undefined ? updates.author_position : existing.author_position,
      hashtags: updates.hashtags !== undefined ? updates.hashtags : existing.hashtags,
      create_revision: updates.create_revision,
    };

    const result = await this.saveEditorialPost(postId, payload);
    if (userId) {
      invalidateMemCache(`creator:posts:${userId}`);
      invalidateMemCache(`creator:stats:${userId}`);
    }
    return result;
  },

  async getPostForEditor(postId: string) {
    const [{ data: post, error }, { data: postCats }, { data: postTags }, { data: revisions }] = await Promise.all([
      supabase.from('Post').select('*').eq('id', postId).single(),
      supabase.from('post_categories').select('category_id, is_primary').eq('post_id', postId),
      supabase.from('post_tags').select('tag_id, tag:tags(*)').eq('post_id', postId),
      supabase.from('post_revisions').select('*').eq('post_id', postId).order('version_number', { ascending: false }).limit(25),
    ]);

    if (error || !post) throw error || new Error('Article not found');

    let siblings: any[] = [];
    if (post.translation_group_id) {
      const { data: sibData } = await supabase
        .from('Post')
        .select('id, title, language, slug, status, published_at, updatedAt')
        .eq('translation_group_id', post.translation_group_id)
        .neq('id', post.id);
      siblings = sibData || [];
    }

    return {
      post,
      categoryIds: (postCats || []).sort((a, b) => Number(b.is_primary) - Number(a.is_primary)).map((c) => c.category_id),
      tags: (postTags || []).map((t: any) => t.tag).filter(Boolean) as TagRecord[],
      revisions: (revisions || []) as PostRevisionRecord[],
      siblings,
    };
  },

  async getCategories(): Promise<CategoryRecord[]> {
    const cached = getMemCache<CategoryRecord[]>('studio:categories');
    if (cached) return cached;

    const { data, error } = await supabase
      .from('categories')
      .select('id, name_en, name_ta, slug_en, slug_ta, description_en, description_ta, display_order, is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name_en', { ascending: true });

    if (error) throw error;
    const rows = (data || []) as CategoryRecord[];
    setMemCache('studio:categories', rows, 120000);
    return rows;
  },

  async getTags(): Promise<TagRecord[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('id, name_en, name_ta, slug_en, slug_ta')
      .order('name_en', { ascending: true });
    if (error) throw error;
    return (data || []) as TagRecord[];
  },

  async createOrFindTag(name: string, language: SupportedLanguage): Promise<TagRecord> {
    const clean = name.trim().replace(/^#+/, '');
    if (!clean) throw new Error('Tag name cannot be empty');
    const slug = slugifyText(clean, `tag-${Date.now()}`);

    const { data: existing } = await supabase
      .from('tags')
      .select('id, name_en, name_ta, slug_en, slug_ta')
      .or(`slug_en.eq.${slug},slug_ta.eq.${slug}`)
      .maybeSingle();

    if (existing) return existing as TagRecord;

    const { data: inserted, error } = await supabase
      .from('tags')
      .insert({
        name_en: language === 'en' ? clean : clean,
        name_ta: language === 'ta' ? clean : clean,
        slug_en: slug,
        slug_ta: slug,
      })
      .select('id, name_en, name_ta, slug_en, slug_ta')
      .single();

    if (error) throw error;
    return inserted as TagRecord;
  },

  async getLinkablePosts(currentPostId: string | null, targetLang: SupportedLanguage) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return [];

    let q = supabase
      .from('Post')
      .select('id, title, language, slug, status, translation_group_id, createdAt')
      .eq('authorId', user.id)
      .eq('language', targetLang)
      .order('createdAt', { ascending: false })
      .limit(50);

    if (currentPostId) {
      q = q.neq('id', currentPostId);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  async linkTranslationPair(sourcePostId: string, targetPostId: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data: posts, error: fetchErr } = await supabase
      .from('Post')
      .select('id, language, translation_group_id')
      .in('id', [sourcePostId, targetPostId]);

    if (fetchErr || !posts || posts.length !== 2) {
      throw fetchErr || new Error('Could not load both articles to link');
    }
    if (posts[0].language === posts[1].language) {
      throw new Error('Cannot link two articles of the same language. Select the opposite language.');
    }

    let groupId = posts[0].translation_group_id || posts[1].translation_group_id;
    if (!groupId) {
      const { data: newGroup, error: grpErr } = await supabase
        .from('translation_groups')
        .insert({ created_by: user.id })
        .select('id')
        .single();
      if (grpErr || !newGroup) throw grpErr || new Error('Failed to create translation group');
      groupId = newGroup.id;
    }

    const { error: updErr } = await supabase
      .from('Post')
      .update({ translation_group_id: groupId })
      .in('id', [sourcePostId, targetPostId]);
    if (updErr) throw updErr;

    invalidateMemCache(`creator:posts:${user.id}`);
    return groupId;
  },

  async unlinkTranslation(postId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const { error } = await supabase
      .from('Post')
      .update({ translation_group_id: null })
      .eq('id', postId);
    if (error) throw error;
    if (user) invalidateMemCache(`creator:posts:${user.id}`);
  },

  async restoreRevision(revisionId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.rpc('restore_post_revision', { p_revision_id: revisionId });
    if (error) throw error;
    if (session?.user?.id) {
      invalidateMemCache(`creator:posts:${session.user.id}`);
    }
    return data;
  },

  async duplicatePost(postId: string) {
    const detail = await this.getPostForEditor(postId);
    const p = detail.post;
    const newSlug = `${slugifyText(p.slug || p.title, 'copy')}-copy-${Date.now().toString().slice(-4)}`;
    return await this.saveEditorialPost(null, {
      title: `${p.title} (Copy)`,
      subtitle: p.subtitle || '',
      short_description: p.short_description || '',
      content: p.content || '',
      content_json: p.content_json,
      type: (p.type?.toLowerCase() || 'news') as PostTypeLower,
      language: (p.language || 'en') as SupportedLanguage,
      slug: newSlug,
      category: p.category || 'General',
      custom_category: p.custom_category,
      category_ids: detail.categoryIds,
      tag_ids: detail.tags.map((t) => t.id),
      thumbnail: p.thumbnail,
      featured_image_alt: p.featured_image_alt,
      featured_image_caption: p.featured_image_caption,
      featured_image_credit: p.featured_image_credit,
      video_url: p.videoUrl,
      video_duration: p.videoDuration,
      status: 'DRAFT',
      is_active: true,
      author_name: p.author_name,
      author_position: p.author_position,
      hashtags: p.hashtags || [],
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      og_title: p.og_title,
      og_description: p.og_description,
      og_image: p.og_image,
      robots_index: p.robots_index !== false,
    });
  },

  async getMyPosts(): Promise<CreatorPost[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const cacheKey = `creator:posts:${user.id}`;
    const cached = getMemCache<CreatorPost[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('Post')
      .select('*, Vote(type), Comment(id, content), PostView(id), Save(id)')
      .eq('authorId', user.id)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    const postIds = (data || []).map((p: any) => p.id);
    const shareCountByPost: Record<string, number> = {};
    if (postIds.length > 0) {
      try {
        const { data: shareRows } = await supabase
          .from('post_shares')
          .select('post_id')
          .in('post_id', postIds);
        (shareRows || []).forEach((s: any) => {
          shareCountByPost[s.post_id] = (shareCountByPost[s.post_id] || 0) + 1;
        });
      } catch (_) {}
    }

    const result = (data || []).map((post: any) => {
      const likes = post.Vote?.filter((v: any) => v.type === 1).length || 0;
      const dislikes = post.Vote?.filter((v: any) => v.type === -1).length || 0;
      const views = Math.max(post.views_count || 0, post.PostView?.length || 0);
      const allComments = post.Comment || [];
      const realComments = allComments.filter((c: any) => c.content !== '[SYSTEM_REPOST]').length;
      const reposts = allComments.filter((c: any) => c.content === '[SYSTEM_REPOST]').length;
      const saves = Math.max(post.saves_count || 0, post.Save?.length || 0);
      const shares = Math.max(post.shares_count || 0, reposts + (shareCountByPost[post.id] || 0));

      return {
        id: post.id,
        title: post.title,
        subtitle: post.subtitle || null,
        short_description: post.short_description || null,
        content: post.content,
        content_json: post.content_json || null,
        type: post.type?.toLowerCase() || 'blog',
        language: (post.language || 'en') as SupportedLanguage,
        slug: post.slug || null,
        category: post.category || 'General',
        custom_category: post.custom_category || null,
        thumbnail: post.thumbnail,
        video_url: post.videoUrl || null,
        video_duration: post.videoDuration,
        status: post.status || 'PUBLISHED',
        scheduledFor: post.scheduledFor,
        published_at: post.published_at || null,
        published: post.status === 'PUBLISHED',
        is_active: post.is_active !== false,
        translation_group_id: post.translation_group_id || null,
        created_at: post.createdAt,
        updated_at: post.updatedAt,
        like_count: likes,
        dislike_count: dislikes,
        view_count: views,
        comment_count: realComments,
        save_count: saves,
        share_count: shares,
        visibility: post.status === 'PUBLISHED' && post.is_active !== false ? 'Public' : post.status || 'Draft',
      };
    });

    setMemCache(cacheKey, result, 30000);
    return result;
  },

  async getMyStats(): Promise<CreatorStats> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const cacheKey = `creator:stats:${user.id}`;
    const cached = getMemCache<CreatorStats>(cacheKey);
    if (cached) return cached;

    const { data: posts, error } = await supabase
      .from('Post')
      .select('id, type, views_count, saves_count, shares_count, Vote(type), Comment(id, content), PostView(id), Save(id)')
      .eq('authorId', user.id);

    if (error) throw error;

    const allPosts = posts || [];
    const postIds = allPosts.map((p: any) => p.id);
    const shareCountByPost: Record<string, number> = {};
    if (postIds.length > 0) {
      try {
        const { data: shareRows } = await supabase
          .from('post_shares')
          .select('post_id')
          .in('post_id', postIds);
        (shareRows || []).forEach((s: any) => {
          shareCountByPost[s.post_id] = (shareCountByPost[s.post_id] || 0) + 1;
        });
      } catch (_) {}
    }

    let totalVotes = 0;
    let totalLikes = 0;
    let totalDislikes = 0;
    let totalComments = 0;
    let totalPostViews = 0;
    let totalSaves = 0;
    let totalShares = 0;

    allPosts.forEach((p: any) => {
      const likes = p.Vote?.filter((v: any) => v.type === 1).length || 0;
      const dislikes = p.Vote?.filter((v: any) => v.type === -1).length || 0;
      const allC = p.Comment || [];
      const realComments = allC.filter((c: any) => c.content !== '[SYSTEM_REPOST]').length;
      const reposts = allC.filter((c: any) => c.content === '[SYSTEM_REPOST]').length;

      totalLikes += likes;
      totalDislikes += dislikes;
      totalVotes += likes - dislikes;
      totalComments += realComments;
      totalPostViews += Math.max(p.views_count || 0, p.PostView?.length || 0);
      totalSaves += Math.max(p.saves_count || 0, p.Save?.length || 0);
      totalShares += Math.max(p.shares_count || 0, reposts + (shareCountByPost[p.id] || 0));
    });

    const { count: followerCount } = await supabase
      .from('Follow')
      .select('*', { count: 'exact', head: true })
      .eq('followingId', user.id);

    const stats: CreatorStats = {
      totalPosts: allPosts.length,
      totalViews: totalPostViews,
      totalComments,
      totalVotes,
      totalLikes,
      totalDislikes,
      totalFollowers: followerCount || 0,
      totalSaves,
      totalShares,
      blogCount: allPosts.filter((p: any) => p.type === 'BLOG').length,
      newsCount: allPosts.filter((p: any) => p.type === 'NEWS').length,
      videoCount: allPosts.filter((p: any) => p.type === 'VIDEO').length,
    };

    setMemCache(cacheKey, stats, 60000);
    return stats;
  },

  async getMyComments(): Promise<CreatorComment[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const commentsCacheKey = `creator:comments:${user.id}`;
    const cached = getMemCache<CreatorComment[]>(commentsCacheKey);
    if (cached) return cached;

    const { data: myPosts } = await supabase
      .from('Post')
      .select('id, title, thumbnail')
      .eq('authorId', user.id);

    if (!myPosts || myPosts.length === 0) return [];

    const postIds = myPosts.map((p: any) => p.id);
    const postMap = Object.fromEntries(myPosts.map((p: any) => [p.id, p]));

    const { data: comments, error } = await supabase
      .from('Comment')
      .select(`
        id, content, createdAt, postId, creatorLiked, upvotes, downvotes, parentId,
        User:userId (id, username, avatarUrl)
      `)
      .in('postId', postIds)
      .neq('content', '[SYSTEM_REPOST]')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    const commentsResult = (comments || []).map((c: any) => ({
      id: c.id,
      content: c.content,
      created_at: c.createdAt,
      post_id: c.postId,
      post_title: postMap[c.postId]?.title || 'Untitled',
      post_thumbnail: postMap[c.postId]?.thumbnail || null,
      user: {
        id: c.User?.id || '',
        username: c.User?.username || 'Anonymous',
        avatar_url: c.User?.avatarUrl || null,
        full_name: c.User?.username || null,
      },
      likes: c.upvotes || 0,
      dislikes: c.downvotes || 0,
      hearted: c.creatorLiked || false,
      parentId: c.parentId || null,
    }));

    setMemCache(commentsCacheKey, commentsResult, 30000);
    return commentsResult;
  },

  async toggleCommentHeart(commentId: string, currentHeartState: boolean) {
    const { error } = await supabase
      .from('Comment')
      .update({ creatorLiked: !currentHeartState })
      .eq('id', commentId);
    if (error) throw error;
  },

  async deleteComment(commentId: string) {
    const { error } = await supabase
      .from('Comment')
      .delete()
      .eq('id', commentId);
    if (error) throw error;
  },

  async replyToComment(postId: string, parentId: string, content: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('Comment')
      .insert({
        id: crypto.randomUUID(),
        postId,
        userId: user.id,
        content,
        parentId,
        createdAt: now,
        updatedAt: now,
      });
    if (error) throw error;
  },

  async voteComment(commentId: string, voteType: 1 | -1) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('CommentVote')
      .select('id, type')
      .eq('userId', user.id)
      .eq('commentId', commentId)
      .maybeSingle();

    if (existing) {
      if (existing.type === voteType) {
        await supabase.from('CommentVote').delete().eq('id', existing.id);
      } else {
        await supabase.from('CommentVote').update({ type: voteType }).eq('id', existing.id);
      }
    } else {
      await supabase.from('CommentVote').insert({
        id: crypto.randomUUID(),
        commentId,
        userId: user.id,
        type: voteType,
      });
    }
  },

  async deletePost(postId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    await supabase.from('Comment').delete().eq('postId', postId);
    await supabase.from('Vote').delete().eq('postId', postId);
    await supabase.from('Save').delete().eq('postId', postId);
    const { error } = await supabase.from('Post').delete().eq('id', postId);
    if (error) throw error;

    if (userId) {
      invalidateMemCache(`creator:posts:${userId}`);
      invalidateMemCache(`creator:stats:${userId}`);
      invalidateMemCache(`creator:comments:${userId}`);
    }
  },

  // Media Library (tracked in public.media_assets + Storage)
  async getMediaAssets(assetKind?: string): Promise<MediaAssetRecord[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    let q = supabase
      .from('media_assets')
      .select('*')
      .or(`owner_id.eq.${user.id},is_public.eq.true`)
      .order('created_at', { ascending: false })
      .limit(120);

    if (assetKind && assetKind !== 'all') {
      q = q.eq('asset_kind', assetKind);
    }

    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as MediaAssetRecord[];
  },

  async uploadTrackedMedia(
    file: File,
    options: {
      folder?: string;
      assetKind?: 'article_image' | 'avatar' | 'cover' | 'branding' | 'video' | 'story';
      altText?: string;
      caption?: string;
      credit?: string;
    } = {}
  ): Promise<{ asset: MediaAssetRecord; publicUrl: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const isVideo = options.assetKind === 'video' || file.type.startsWith('video/');
    if (isVideo) {
      if (!VIDEO_MIME_TYPES.has(file.type)) {
        throw new Error('Unsupported video format. Allowed: MP4, WebM, MOV.');
      }
      if (file.size > 500 * 1024 * 1024) {
        throw new Error('Video exceeds 500MB limit.');
      }
    } else {
      if (!IMAGE_MIME_TYPES.has(file.type)) {
        throw new Error('Unsupported image format. Allowed: JPG, PNG, WebP, GIF.');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image exceeds 5MB limit.');
      }
    }

    const folder = options.folder || (isVideo ? 'videos' : 'thumbnails');
    const bucket = isVideo ? 'videos' : 'media';
    const fileExt = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${user.id}/${folder}/${Date.now()}_${safeName.slice(0, 40)}.${fileExt}`;

    const dims = await getImageDimensions(file);

    const { data: uploaded, error: upErr } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file, { cacheControl: '3600', upsert: false });

    if (upErr || !uploaded) {
      // Fallback to 'media' if 'videos' bucket fails
      if (bucket === 'videos') {
        const fallback = await supabase.storage
          .from('media')
          .upload(storagePath, file, { cacheControl: '3600', upsert: false });
        if (fallback.error || !fallback.data) throw fallback.error || new Error('Upload failed');
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fallback.data.path);
        const { data: assetRow, error: insErr } = await supabase
          .from('media_assets')
          .insert({
            owner_id: user.id,
            bucket: 'media',
            storage_path: fallback.data.path,
            public_url: publicUrl,
            file_name: file.name,
            mime_type: file.type,
            file_size: file.size,
            width: dims.width,
            height: dims.height,
            alt_text: options.altText || null,
            caption: options.caption || null,
            credit: options.credit || null,
            asset_kind: options.assetKind || 'video',
            is_public: true,
          })
          .select()
          .single();
        if (insErr) throw insErr;
        return { asset: assetRow as MediaAssetRecord, publicUrl };
      }
      throw upErr || new Error('Upload failed');
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(uploaded.path);
    const { data: assetRow, error: insErr } = await supabase
      .from('media_assets')
      .insert({
        owner_id: user.id,
        bucket,
        storage_path: uploaded.path,
        public_url: publicUrl,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        width: dims.width,
        height: dims.height,
        alt_text: options.altText || null,
        caption: options.caption || null,
        credit: options.credit || null,
        asset_kind: options.assetKind || (isVideo ? 'video' : 'article_image'),
        is_public: true,
      })
      .select()
      .single();

    if (insErr) throw insErr;
    return { asset: assetRow as MediaAssetRecord, publicUrl };
  },

  async updateMediaAssetMeta(assetId: string, meta: { alt_text?: string; caption?: string; credit?: string }) {
    const { data, error } = await supabase
      .from('media_assets')
      .update(meta)
      .eq('id', assetId)
      .select()
      .single();
    if (error) throw error;
    return data as MediaAssetRecord;
  },

  async deleteMediaAsset(asset: MediaAssetRecord) {
    // Usage guard: check if referenced by any Post thumbnail, Post content, or post_media
    const [{ count: postRefCount }, { count: pmRefCount }] = await Promise.all([
      supabase
        .from('Post')
        .select('id', { count: 'exact', head: true })
        .or(`thumbnail.eq.${asset.public_url},og_image.eq.${asset.public_url}`),
      supabase
        .from('post_media')
        .select('post_id', { count: 'exact', head: true })
        .eq('media_id', asset.id),
    ]);

    if ((postRefCount || 0) > 0 || (pmRefCount || 0) > 0) {
      throw new Error('Cannot delete: this asset is actively used in one or more articles.');
    }

    await supabase.storage.from(asset.bucket).remove([asset.storage_path]);
    const { error } = await supabase.from('media_assets').delete().eq('id', asset.id);
    if (error) throw error;
  },

  async uploadMedia(file: File, folder: string = 'thumbnails') {
    const res = await this.uploadTrackedMedia(file, { folder, assetKind: 'article_image' });
    return res.publicUrl;
  },

  async uploadVideo(file: File) {
    const res = await this.uploadTrackedMedia(file, { folder: 'videos', assetKind: 'video' });
    return res.publicUrl;
  },

  async getCreatorAnalytics(fromIso?: string, toIso?: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const [{ data, error }, liveStats] = await Promise.all([
      supabase.rpc('get_creator_analytics', {
        p_creator_id: user.id,
        ...(fromIso ? { p_from: fromIso } : {}),
        ...(toIso ? { p_to: toIso } : {}),
      }),
      this.getMyStats().catch(() => null),
    ]);
    if (error) throw error;

    const summary = {
      ...(data?.summary || {}),
      totalSaves: data?.summary?.totalSaves ?? liveStats?.totalSaves ?? 0,
      totalShares: data?.summary?.totalShares ?? liveStats?.totalShares ?? 0,
      totalViews: Math.max(Number(data?.summary?.totalViews || 0), Number(liveStats?.totalViews || 0)),
      totalFollowers: Math.max(Number(data?.summary?.totalFollowers || 0), Number(liveStats?.totalFollowers || 0)),
    };
    return {
      ...data,
      summary,
    };
  },

  subscribeToMyPostUpdates(callback: (payload: any) => void) {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedCallback = (payload: any) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => callback(payload), 250);
    };

    return supabase
      .channel(`creator-live-updates-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Vote' }, debouncedCallback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Comment' }, debouncedCallback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Post' }, debouncedCallback)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'PostView' }, debouncedCallback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Save' }, debouncedCallback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Follow' }, debouncedCallback)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_shares' }, debouncedCallback)
      .subscribe();
  },
};
