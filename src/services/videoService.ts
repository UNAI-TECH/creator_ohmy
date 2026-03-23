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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('posts')
      .select('*, votes(vote_type), comments(id)')
      .eq('author_id', user.id)
      .eq('type', 'video')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching videos:', error);
      return [];
    }

    return (data || []).map((post: any) => ({
      ...post,
      votes_count: post.votes?.length || 0,
      comments_count: post.comments?.length || 0,
    }));
  },

  async getVideoAnalytics(videoId: string) {
    const [
      { data: votes },
      { data: comments },
    ] = await Promise.all([
      supabase.from('votes').select('vote_type').eq('post_id', videoId),
      supabase.from('comments').select('id').eq('post_id', videoId),
    ]);

    const upvotes = votes?.filter((v: any) => v.vote_type === 1).length || 0;
    const downvotes = votes?.filter((v: any) => v.vote_type === -1).length || 0;
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, callback)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, callback)
      .subscribe();
  },
};
