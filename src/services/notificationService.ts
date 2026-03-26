import { supabase } from '../lib/supabaseClient';

export interface CreatorNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  targetId: string | null;
}

export const notificationService = {
  async getMyNotifications(): Promise<CreatorNotification[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('Notification')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    
    // Map database fields to interface if needed (though they should match if select * is used)
    return (data || []).map(item => ({
      ...item,
      isRead: item.isRead,
      createdAt: item.createdAt,
      userId: item.userId,
      targetId: item.targetId
    }));
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('userId', user.id)
      .eq('isRead', false);

    if (error) throw error;
  },

  async deleteNotifications(ids: string[]) {
    const { error } = await supabase
      .from('Notification')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  async deleteAllNotifications() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('Notification')
      .delete()
      .eq('userId', user.id);

    if (error) throw error;
  },

  subscribeToNotifications(callback: (payload: any) => void) {
    return supabase
      .channel('creator-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Notification' }, callback)
      .subscribe();
  }
};
