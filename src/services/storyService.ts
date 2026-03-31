import { supabase } from '../lib/supabaseClient';

export interface Story {
  id: string;
  creator_id: string;
  media_url?: string;
  text_content?: string;
  type: 'image' | 'video' | 'text';
  background_color?: string;
  caption?: string;
  created_at: string;
  expires_at: string;
  viewers_count: number;
  allow_comments?: boolean;
  allow_sharing?: boolean;
}

export const storyService = {
  async createStory(payload: {
    type: 'image' | 'video' | 'text';
    mediaUrl?: string;
    textContent?: string;
    caption?: string;
    backgroundColor?: string;
    allow_comments?: boolean;
    allow_sharing?: boolean;
  }) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('stories')
      .insert({
        creator_id: user.id,
        media_url: payload.mediaUrl,
        text_content: payload.textContent,
        type: payload.type,
        caption: payload.caption,
        background_color: payload.backgroundColor,
        allow_comments: payload.allow_comments ?? true,
        allow_sharing: payload.allow_sharing ?? true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteStory(storyId: string) {
    const { error } = await supabase.from('stories').delete().eq('id', storyId);
    if (error) throw error;
  },

  subscribeToCreatorStories(creatorId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`stories-${creatorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
          filter: `creator_id=eq.${creatorId}`,
        },
        callback
      )
      .subscribe();
  },

  async uploadStoryMedia(file: File) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}/stories/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(data.path);

    return publicUrl;
  }
};
