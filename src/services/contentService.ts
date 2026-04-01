import { supabase } from '../lib/supabaseClient';

export interface PostData {
  title: string;
  subtitle?: string;
  content: string;
  type: 'blog' | 'video' | 'news' | 'update';
  category?: string;
  custom_category?: string;
  thumbnail?: string;
  video_url?: string;
  video_duration?: string;
  status?: 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  scheduledFor?: string;
  is_active?: boolean;
}

export interface CreatorPost {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  custom_category: string | null;
  thumbnail: string | null;
  video_url: string | null;
  video_duration: string | null;
  status?: string;
  scheduledFor?: string;
  published: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  like_count: number;
  dislike_count: number;
  view_count: number;
  comment_count: number;
  visibility: string;
}

export interface CreatorStats {
  totalPosts: number;
  totalViews: number;
  totalComments: number;
  totalVotes: number;
  totalLikes: number;
  totalDislikes: number;
  totalFollowers: number;
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

export const contentService = {
  async createPost(postData: PostData) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const now = new Date().toISOString();
    const insertPayload: any = {
      id: crypto.randomUUID(),
      title: postData.title,
      content: postData.content || '',
      type: postData.type ? postData.type.toUpperCase() : 'BLOG',
      authorId: user.id,
      createdAt: now,
      updatedAt: now,
    };
    if (postData.category) insertPayload.category = postData.category;
    if (postData.custom_category) insertPayload.custom_category = postData.custom_category;
    if (postData.thumbnail) insertPayload.thumbnail = postData.thumbnail;
    if (postData.video_duration) insertPayload.videoDuration = postData.video_duration;
    if (postData.video_url) insertPayload.videoUrl = postData.video_url;
    if (postData.status) insertPayload.status = postData.status;
    if (postData.scheduledFor) insertPayload.scheduledFor = postData.scheduledFor;
    if (postData.is_active !== undefined) insertPayload.is_active = postData.is_active;

    const { data, error } = await supabase
      .from('Post')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    // === Notify followers about the new post ===
    // This is now handled automatically by a Supabase Database Webhook + Edge Function
    // for significantly better performance and scalability.

    return data;
  },

  async getMyPosts(): Promise<CreatorPost[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('Post')
      .select('*, Vote(type), Comment(id), PostView(id)')
      .eq('authorId', user.id)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return (data || []).map((post: any) => {
      const likes = post.Vote?.filter((v: any) => v.type === 1).length || 0;
      const dislikes = post.Vote?.filter((v: any) => v.type === -1).length || 0;
      const views = post.PostView?.length || 0;

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type?.toLowerCase() || 'blog',
        category: post.category || 'General',
        custom_category: post.custom_category || null,
        thumbnail: post.thumbnail,
        video_url: post.videoUrl || null,
        video_duration: post.videoDuration,
        status: post.status || 'PUBLISHED',
        scheduledFor: post.scheduledFor,
        published: post.published !== false,
        is_active: post.is_active !== false,
        created_at: post.createdAt,
        updated_at: post.updatedAt,
        like_count: likes,
        dislike_count: dislikes,
        view_count: views,
        comment_count: post.Comment?.length || 0,
        visibility: 'Public',
      };
    });
  },

  async getMyStats(): Promise<CreatorStats> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data: posts, error } = await supabase
      .from('Post')
      .select('id, type, Vote(type), Comment(id), PostView(id)')
      .eq('authorId', user.id);

    if (error) throw error;

    const allPosts = posts || [];
    let totalVotes = 0;
    let totalLikes = 0;
    let totalDislikes = 0;
    let totalComments = 0;
    let totalPostViews = 0;

    allPosts.forEach((p: any) => {
        totalVotes += p.Vote?.length || 0;
        totalComments += p.Comment?.length || 0;
        totalPostViews += p.PostView?.length || 0;
        p.Vote?.forEach((v: any) => {
          if (v.type === 1) totalLikes++;
          else if (v.type === -1) totalDislikes++;
        });
    });

    // Get follower count
    const { count: followerCount } = await supabase
      .from('Follow')
      .select('id', { count: 'exact', head: true })
      .eq('followingId', user.id);

    // Get story views sum
    const { data: stories } = await supabase
      .from('stories')
      .select('viewers_count')
      .eq('creator_id', user.id);
      
    let storyViews = 0;
    (stories || []).forEach((s: any) => storyViews += (s.viewers_count || 0));

    return {
      totalPosts: allPosts.length,
      totalViews: totalPostViews + storyViews, // Real post views + actual Story views
      totalComments,
      totalVotes,
      totalLikes,
      totalDislikes,
      totalFollowers: followerCount || 0,
      blogCount: allPosts.filter((p: any) => p.type === 'BLOG').length,
      newsCount: allPosts.filter((p: any) => p.type === 'NEWS').length,
      videoCount: allPosts.filter((p: any) => p.type === 'VIDEO').length,
    };
  },

  async getMyComments(): Promise<CreatorComment[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data: myPosts } = await supabase
      .from('Post')
      .select('id, title, thumbnail')
      .eq('authorId', user.id);

    if (!myPosts || myPosts.length === 0) return [];

    const postIds = myPosts.map((p: any) => p.id);
    const postMap: Record<string, { title: string; thumbnail: string | null }> = {};
    myPosts.forEach((p: any) => { postMap[p.id] = { title: p.title, thumbnail: p.thumbnail }; });

    const { data: comments, error } = await supabase
      .from('Comment')
      .select('*, User(id, username, avatarUrl)')
      .in('postId', postIds)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return (comments || []).map((c: any) => ({
      id: c.id,
      content: c.content,
      created_at: c.createdAt,
      post_id: c.postId,
      post_title: postMap[c.postId]?.title || 'Unknown Post',
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

    // Check if vote exists
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

  async updatePost(postId: string, updates: Partial<PostData>) {
    const payload: any = {};
    if (updates.title) payload.title = updates.title;
    if (updates.content) payload.content = updates.content;
    if (updates.category) payload.category = updates.category;
    if (updates.custom_category !== undefined) payload.custom_category = updates.custom_category;
    if (updates.thumbnail !== undefined) payload.thumbnail = updates.thumbnail;
    if (updates.video_url !== undefined) payload.videoUrl = updates.video_url;
    if (updates.video_duration !== undefined) payload.videoDuration = updates.video_duration;
    if (updates.status) payload.status = updates.status;
    if (updates.scheduledFor) payload.scheduledFor = updates.scheduledFor;
    if (updates.is_active !== undefined) payload.is_active = updates.is_active;

    const { data, error } = await supabase
      .from('Post')
      .update(payload)
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePost(postId: string) {
    await supabase.from('Comment').delete().eq('postId', postId);
    await supabase.from('Vote').delete().eq('postId', postId);
    await supabase.from('Save').delete().eq('postId', postId);
    const { error } = await supabase.from('Post').delete().eq('id', postId);
    if (error) throw error;
  },

  async uploadMedia(file: File, folder: string = 'thumbnails') {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${folder}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  async uploadVideo(file: File) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/videos/${Date.now()}.${fileExt}`;

    // Try 'videos' bucket first, fall back to 'media'
    let bucketName = 'media';
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (buckets?.some((b: any) => b.name === 'videos')) {
        bucketName = 'videos';
      }
    } catch {
      // If listing buckets fails (permissions), default to 'media'
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrl;
  },

  subscribeToMyPostUpdates(callback: (payload: any) => void) {
    // Debounce to prevent rapid refetches
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedCallback = (payload: any) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => callback(payload), 300);
    };

    return supabase
      .channel('creator-post-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Vote' }, debouncedCallback)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Comment' }, debouncedCallback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Post' }, debouncedCallback)
      .subscribe();
  }
};
