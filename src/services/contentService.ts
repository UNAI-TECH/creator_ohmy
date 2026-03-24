import { supabase } from '../lib/supabaseClient';

export interface PostData {
  title: string;
  subtitle?: string;
  content: string;
  type: 'blog' | 'video' | 'news' | 'update';
  category?: string;
  thumbnail?: string;
  video_url?: string;
  video_duration?: string;
}

export interface CreatorPost {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  thumbnail: string | null;
  video_url: string | null;
  video_duration: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  vote_count: number;
  comment_count: number;
  visibility: string;
}

export interface CreatorStats {
  totalPosts: number;
  totalViews: number;
  totalComments: number;
  totalVotes: number;
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
  hearted: boolean;
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
    if (postData.thumbnail) insertPayload.thumbnail = postData.thumbnail;
    if (postData.video_duration) insertPayload.videoDuration = postData.video_duration;
    if (postData.video_url) insertPayload.videoUrl = postData.video_url;

    const { data, error } = await supabase
      .from('Post')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    // === Notify all followers about the new post ===
    try {
      // Get creator's profile for display name
      const { data: creatorProfile } = await supabase
        .from('User')
        .select('username')
        .eq('id', user.id)
        .single();
      const creatorName = creatorProfile?.username || 'A creator';
      const postType = (postData.type || 'post').toLowerCase();

      // Get all users who follow this creator
      const { data: followers } = await supabase
        .from('Follow')
        .select('followerId')
        .eq('followingId', user.id);

      if (followers && followers.length > 0) {
        const notifNow = new Date().toISOString();
        const notificationRows = followers.map((f: any) => ({
          id: crypto.randomUUID(),
          userId: f.followerId,
          type: 'NEW_POST',
          title: `${creatorName} published a new ${postType}`,
          message: postData.title,
          targetId: data.id,
          isRead: false,
          createdAt: notifNow,
        }));

        await supabase.from('Notification').insert(notificationRows);
      }
    } catch (notifError) {
      // Don't fail the post creation if notification fails
      console.warn('Failed to send follower notifications:', notifError);
    }

    return data;
  },

  async getMyPosts(): Promise<CreatorPost[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('Post')
      .select('*, Vote(type), Comment(id)')
      .eq('authorId', user.id)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return (data || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      type: post.type?.toLowerCase() || 'blog',
      category: post.category || 'General',
      thumbnail: post.thumbnail,
      video_url: null,
      video_duration: post.videoDuration,
      published: true,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      vote_count: post.Vote?.length || 0,
      comment_count: post.Comment?.length || 0,
      visibility: 'Public',
    }));
  },

  async getMyStats(): Promise<CreatorStats> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data: posts, error } = await supabase
      .from('Post')
      .select('id, type, Vote(type), Comment(id)')
      .eq('authorId', user.id);

    if (error) throw error;

    const allPosts = posts || [];
    let totalVotes = 0;
    let totalComments = 0;

    allPosts.forEach((p: any) => {
        totalVotes += p.Vote?.length || 0;
        totalComments += p.Comment?.length || 0;
    });

    // Get follower count
    const { count: followerCount } = await supabase
      .from('Follow')
      .select('id', { count: 'exact', head: true })
      .eq('followingId', user.id);

    return {
      totalPosts: allPosts.length,
      totalViews: totalVotes, // proxy
      totalComments,
      totalVotes,
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
      likes: 0,
      hearted: false,
    }));
  },

  async updatePost(postId: string, updates: Partial<PostData>) {
    const prismaUpdates: any = {};
    if (updates.title) prismaUpdates.title = updates.title;
    if (updates.content) prismaUpdates.content = updates.content;
    if (updates.category) prismaUpdates.category = updates.category;
    if (updates.thumbnail) prismaUpdates.thumbnail = updates.thumbnail;
    if (updates.video_duration) prismaUpdates.videoDuration = updates.video_duration;

    const { data, error } = await supabase
      .from('Post')
      .update(prismaUpdates)
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
