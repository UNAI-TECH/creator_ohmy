import { supabase } from '../lib/supabaseClient';

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  video_duration: string;
  type: string;
  published: boolean;
  created_at: string;
  // Aggregated fields
  votes_count?: number;
  comments_count?: number;
}

export const videoService = {
  async getRecentVideos(limit = 10) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return [];

    const { data, error } = await supabase
      .from('Post')
      .select('*, Vote(type), Comment(id)')
      .eq('authorId', user.id)
      .eq('type', 'VIDEO')
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching videos:', error);
      return [];
    }

    return (data || []).map((post: any) => ({
      ...post,
      created_at: post.createdAt,
      video_duration: post.videoDuration,
      votes_count: post.Vote?.length || 0,
      comments_count: post.Comment?.length || 0,
    }));
  },

  async getVideoAnalytics(videoId: string) {
    const [
      { data: votes },
      { data: comments },
    ] = await Promise.all([
      supabase.from('Vote').select('type').eq('postId', videoId),
      supabase.from('Comment').select('id').eq('postId', videoId),
    ]);

    const upvotes = votes?.filter((v: any) => v.type === 1).length || 0;
    const downvotes = votes?.filter((v: any) => v.type === -1).length || 0;
    const totalVotes = upvotes + downvotes;

    return {
      upvotes,
      downvotes,
      likesPercentage: totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0,
      commentsCount: comments?.length || 0,
    };
  },

  /**
   * Subscribe to real-time analytics for videos
   */
  subscribeToVideoAnalytics(callback: (payload: any) => void) {
    return supabase
      .channel('video-analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Vote' }, callback)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Comment' }, callback)
      .subscribe();
  },
};
