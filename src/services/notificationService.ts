import { supabase } from '../lib/supabaseClient';

export interface CreatorNotification {
  id: string;
  type: 'FOLLOW' | 'LIKE' | 'COMMENT' | 'REPLY' | string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  targetId: string | null;
  actorName?: string;
  actorAvatar?: string | null;
  postTitle?: string | null;
  isReply?: boolean;
}

interface StoredNotifState {
  ids: string[];
  beforeIso?: string;
}

const NOTIF_SYNC_EVENT = 'creator-notifications-updated';

const getReadKey = (uid: string) => `postsapp_studio_read_notifs_${uid}`;
const getDeletedKey = (uid: string) => `postsapp_studio_deleted_notifs_${uid}`;

function readLocalNotifState(key: string): StoredNotifState {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ids: [] };
    const parsed = JSON.parse(raw);
    return {
      ids: Array.isArray(parsed?.ids) ? parsed.ids : [],
      beforeIso: typeof parsed?.beforeIso === 'string' ? parsed.beforeIso : undefined,
    };
  } catch {
    return { ids: [] };
  }
}

function writeLocalNotifState(key: string, state: StoredNotifState) {
  try {
    localStorage.setItem(key, JSON.stringify({
      ids: state.ids.slice(-500),
      beforeIso: state.beforeIso,
    }));
  } catch {}
}

function emitNotifSync() {
  try {
    window.dispatchEvent(new CustomEvent(NOTIF_SYNC_EVENT));
  } catch {}
}

function isBeforeCutoff(createdAt: string, cutoffIso?: string): boolean {
  if (!cutoffIso) return false;
  const createdMs = new Date(createdAt).getTime();
  const cutoffMs = new Date(cutoffIso).getTime();
  return !Number.isNaN(createdMs) && !Number.isNaN(cutoffMs) && createdMs <= cutoffMs;
}

function normalizeUserRelation(rel: any) {
  return Array.isArray(rel) ? rel[0] : rel;
}

function snippetText(text: string, maxLen = 70): string {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1)}…`;
}

export const notificationService = {
  async getMyNotifications(): Promise<CreatorNotification[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const [notifRes, postsRes, followsRes, myCommentsRes] = await Promise.all([
      supabase
        .from('Notification')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .limit(100),
      supabase
        .from('Post')
        .select('id, title')
        .eq('authorId', user.id),
      supabase
        .from('Follow')
        .select('id, followerId, createdAt, follower:User!followerId(id, username, channel_name, avatarUrl)')
        .eq('followingId', user.id)
        .order('createdAt', { ascending: false })
        .limit(60),
      supabase
        .from('Comment')
        .select('id')
        .eq('userId', user.id)
        .neq('content', '[SYSTEM_REPOST]')
        .limit(200),
    ]);

    if (notifRes.error) throw notifRes.error;

    const myPosts = postsRes.data || [];
    const postIds = myPosts.map((p: any) => p.id);
    const postTitleMap = Object.fromEntries(myPosts.map((p: any) => [p.id, p.title || 'Untitled Post']));
    const myCommentIds = (myCommentsRes.data || []).map((c: any) => c.id);

    const [likesRes, postCommentsRes, commentRepliesRes] = await Promise.all([
      postIds.length > 0
        ? supabase
            .from('Vote')
            .select('id, postId, userId, type, createdAt, User:userId(id, username, channel_name, avatarUrl)')
            .in('postId', postIds)
            .eq('type', 1)
            .order('createdAt', { ascending: false })
            .limit(80)
        : Promise.resolve({ data: [] as any[] }),
      postIds.length > 0
        ? supabase
            .from('Comment')
            .select('id, postId, userId, parentId, content, createdAt, User:userId(id, username, channel_name, avatarUrl)')
            .in('postId', postIds)
            .neq('content', '[SYSTEM_REPOST]')
            .order('createdAt', { ascending: false })
            .limit(80)
        : Promise.resolve({ data: [] as any[] }),
      myCommentIds.length > 0
        ? supabase
            .from('Comment')
            .select('id, postId, userId, parentId, content, createdAt, User:userId(id, username, channel_name, avatarUrl), Post:postId(id, title)')
            .in('parentId', myCommentIds)
            .neq('content', '[SYSTEM_REPOST]')
            .order('createdAt', { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const readState = readLocalNotifState(getReadKey(user.id));
    const deletedState = readLocalNotifState(getDeletedKey(user.id));
    const readIdSet = new Set(readState.ids);
    const deletedIdSet = new Set(deletedState.ids);

    // 1. Stored DB notifications (excluding reposts)
    const dbNotifs: CreatorNotification[] = (notifRes.data || [])
      .filter((item: any) => String(item.type || '').toLowerCase() !== 'repost')
      .map((item: any) => ({
        id: item.id,
        type: String(item.type || 'COMMENT').toUpperCase(),
        title: item.title || 'Notification',
        message: item.message || '',
        isRead: Boolean(item.isRead),
        createdAt: item.createdAt,
        userId: item.userId,
        targetId: item.targetId || null,
        isReply: String(item.title || '').toLowerCase().includes('reply') || String(item.type || '').toUpperCase() === 'REPLY',
      }));

    const hasDbMatch = (typeBucket: string, targetId: string | null, actorName: string) => {
      const normalizedActor = actorName.toLowerCase();
      return dbNotifs.some((n) => {
        const nType = String(n.type || '').toUpperCase();
        const typeMatch = nType === typeBucket || (typeBucket === 'COMMENT' && nType === 'REPLY');
        if (!typeMatch) return false;
        if (targetId && n.targetId && n.targetId !== targetId) return false;
        return n.message.toLowerCase().includes(normalizedActor);
      });
    };

    const activityNotifs: CreatorNotification[] = [];

    // 2. Follow notifications
    for (const f of followsRes.data || []) {
      if (!f.followerId || f.followerId === user.id) continue;
      const actor = normalizeUserRelation(f.follower);
      const actorName = actor?.username || actor?.channel_name || 'A reader';
      const syntheticId = `activity-follow-${f.id}`;
      if (deletedIdSet.has(syntheticId) || isBeforeCutoff(f.createdAt, deletedState.beforeIso)) continue;
      if (hasDbMatch('FOLLOW', f.followerId, actorName)) continue;

      activityNotifs.push({
        id: syntheticId,
        type: 'FOLLOW',
        title: 'New Follower',
        message: `@${actorName} started following your channel`,
        isRead: readIdSet.has(syntheticId) || isBeforeCutoff(f.createdAt, readState.beforeIso),
        createdAt: f.createdAt,
        userId: user.id,
        targetId: f.followerId,
        actorName,
        actorAvatar: actor?.avatarUrl || null,
      });
    }

    // 3. Post Like notifications
    for (const v of likesRes.data || []) {
      if (!v.userId || v.userId === user.id) continue;
      const actor = normalizeUserRelation(v.User);
      const actorName = actor?.username || actor?.channel_name || 'A reader';
      const postTitle = postTitleMap[v.postId] || 'your story';
      const syntheticId = `activity-like-${v.id}`;
      if (deletedIdSet.has(syntheticId) || isBeforeCutoff(v.createdAt, deletedState.beforeIso)) continue;
      if (hasDbMatch('LIKE', v.postId, actorName)) continue;

      activityNotifs.push({
        id: syntheticId,
        type: 'LIKE',
        title: 'New Like',
        message: `@${actorName} liked your post "${snippetText(postTitle, 55)}"`,
        isRead: readIdSet.has(syntheticId) || isBeforeCutoff(v.createdAt, readState.beforeIso),
        createdAt: v.createdAt,
        userId: user.id,
        targetId: v.postId,
        actorName,
        actorAvatar: actor?.avatarUrl || null,
        postTitle,
      });
    }

    // 4. Comments & Comment Replies on creator's posts OR replying directly to creator's comments
    const seenCommentIds = new Set<string>();
    const combinedComments = [
      ...(postCommentsRes.data || []).map((c: any) => ({ ...c, _source: 'post' })),
      ...(commentRepliesRes.data || []).map((c: any) => ({ ...c, _source: 'reply_to_me' })),
    ];

    for (const c of combinedComments) {
      if (!c.id || seenCommentIds.has(c.id)) continue;
      seenCommentIds.add(c.id);
      if (!c.userId || c.userId === user.id) continue;

      const actor = normalizeUserRelation(c.User);
      const postRel = normalizeUserRelation(c.Post);
      const actorName = actor?.username || actor?.channel_name || 'A reader';
      const postTitle = postTitleMap[c.postId] || postRel?.title || 'your story';
      const isReply = Boolean(c.parentId);
      const syntheticId = `activity-comment-${c.id}`;

      if (deletedIdSet.has(syntheticId) || isBeforeCutoff(c.createdAt, deletedState.beforeIso)) continue;
      if (hasDbMatch('COMMENT', c.postId, actorName) && dbNotifs.some(n => n.message.includes(snippetText(c.content, 20)))) continue;

      activityNotifs.push({
        id: syntheticId,
        type: 'COMMENT',
        title: isReply ? 'New Reply' : 'New Comment',
        message: isReply
          ? `@${actorName} replied "${snippetText(c.content, 60)}" on "${snippetText(postTitle, 45)}"`
          : `@${actorName} commented "${snippetText(c.content, 60)}" on "${snippetText(postTitle, 45)}"`,
        isRead: readIdSet.has(syntheticId) || isBeforeCutoff(c.createdAt, readState.beforeIso),
        createdAt: c.createdAt,
        userId: user.id,
        targetId: c.postId,
        actorName,
        actorAvatar: actor?.avatarUrl || null,
        postTitle,
        isReply,
      });
    }

    return [...dbNotifs, ...activityNotifs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async markAsRead(notificationId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    if (notificationId.startsWith('activity-')) {
      const key = getReadKey(user.id);
      const state = readLocalNotifState(key);
      if (!state.ids.includes(notificationId)) {
        state.ids.push(notificationId);
        writeLocalNotifState(key, state);
      }
      emitNotifSync();
      return;
    }

    const { error } = await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('id', notificationId);

    if (error) throw error;
    emitNotifSync();
  },

  async markAllAsRead() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const key = getReadKey(user.id);
    const state = readLocalNotifState(key);
    state.beforeIso = new Date().toISOString();
    writeLocalNotifState(key, state);

    const { error } = await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('userId', user.id)
      .eq('isRead', false);

    if (error) throw error;
    emitNotifSync();
  },

  async deleteNotifications(ids: string[]) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const activityIds = ids.filter(id => id.startsWith('activity-'));
    const dbIds = ids.filter(id => !id.startsWith('activity-'));

    if (activityIds.length > 0) {
      const key = getDeletedKey(user.id);
      const state = readLocalNotifState(key);
      state.ids = Array.from(new Set([...state.ids, ...activityIds]));
      writeLocalNotifState(key, state);
    }

    if (dbIds.length > 0) {
      const { error } = await supabase
        .from('Notification')
        .delete()
        .in('id', dbIds);

      if (error) throw error;
    }

    emitNotifSync();
  },

  async deleteAllNotifications() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const key = getDeletedKey(user.id);
    const state = readLocalNotifState(key);
    state.beforeIso = new Date().toISOString();
    writeLocalNotifState(key, state);

    const { error } = await supabase
      .from('Notification')
      .delete()
      .eq('userId', user.id);

    if (error) throw error;
    emitNotifSync();
  },

  subscribeToNotifications(callback: (payload?: any) => void) {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedCallback = (payload?: any) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => callback(payload), 200);
    };

    const handleLocalSync = () => debouncedCallback({ table: 'local_sync' });
    window.addEventListener(NOTIF_SYNC_EVENT, handleLocalSync);

    const channelName = `creator-notifications-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Notification' }, debouncedCallback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Follow' }, debouncedCallback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Vote' }, debouncedCallback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Comment' }, debouncedCallback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Post' }, debouncedCallback)
      .subscribe();

    return {
      unsubscribe: () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        window.removeEventListener(NOTIF_SYNC_EVENT, handleLocalSync);
        supabase.removeChannel(channel);
      },
    };
  },
};
