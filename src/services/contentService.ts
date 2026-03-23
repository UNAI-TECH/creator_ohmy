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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...postData,
        author_id: user.id,
        published: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMyPosts(): Promise<CreatorPost[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .select('*, votes(vote_type), comments(id)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      type: post.type || 'blog',
      category: post.category || 'General',
      thumbnail: post.thumbnail,
      video_url: post.video_url,
      video_duration: post.video_duration,
      published: post.published,
      created_at: post.created_at,
      updated_at: post.updated_at,
      vote_count: post.votes?.length || 0,
      comment_count: post.comments?.length || 0,
      visibility: post.published ? 'Public' : 'Draft',
    }));
  },

  async getMyStats(): Promise<CreatorStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, type, votes(vote_type), comments(id)')
      .eq('author_id', user.id);

    if (error) throw error;

    const allPosts = posts || [];
    let totalVotes = 0;
    let totalComments = 0;

    allPosts.forEach((p: any) => {
      totalVotes += p.votes?.length || 0;
      totalComments += p.comments?.length || 0;
    });

    // Get follower count
    const { count: followerCount } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', user.id);

    return {
      totalPosts: allPosts.length,
      totalViews: totalVotes, // Using votes as proxy for views since views column may not exist
      totalComments,
      totalVotes,
      totalFollowers: followerCount || 0,
      blogCount: allPosts.filter((p: any) => p.type === 'blog').length,
      newsCount: allPosts.filter((p: any) => p.type === 'news').length,
      videoCount: allPosts.filter((p: any) => p.type === 'video').length,
    };
  },

  async getMyComments(): Promise<CreatorComment[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get creator's post IDs and titles
    const { data: myPosts } = await supabase
      .from('posts')
      .select('id, title, thumbnail')
      .eq('author_id', user.id);

    if (!myPosts || myPosts.length === 0) return [];

    const postIds = myPosts.map((p: any) => p.id);
    const postMap: Record<string, { title: string; thumbnail: string | null }> = {};
    myPosts.forEach((p: any) => { postMap[p.id] = { title: p.title, thumbnail: p.thumbnail }; });

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*, profiles!user_id(id, username, avatar_url, full_name)')
      .in('post_id', postIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (comments || []).map((c: any) => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      post_id: c.post_id,
      post_title: postMap[c.post_id]?.title || 'Unknown Post',
      post_thumbnail: postMap[c.post_id]?.thumbnail || null,
      user: {
        id: c.profiles?.id || '',
        username: c.profiles?.username || 'Anonymous',
        avatar_url: c.profiles?.avatar_url || null,
        full_name: c.profiles?.full_name || null,
      },
      likes: 0,
      hearted: false,
    }));
  },

  async updatePost(postId: string, updates: Partial<PostData & { published: boolean }>) {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePost(postId: string) {
    // Delete related records first
    await supabase.from('comments').delete().eq('post_id', postId);
    await supabase.from('votes').delete().eq('post_id', postId);

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  },

  async uploadMedia(file: File, folder: string = 'thumbnails') {
    const { data: { user } } = await supabase.auth.getUser();
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

  /**
   * Subscribe to real-time updates on the creator's posts
   */
  subscribeToMyPostUpdates(callback: (payload: any) => void) {
    return supabase
      .channel('creator-post-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
      }, callback)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
      }, callback)
      .subscribe();
  },
};
