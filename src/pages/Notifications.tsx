import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Search, MoreVertical } from 'lucide-react';
import { cn } from '../lib/utils';
import { notificationService, CreatorNotification } from '../services/notificationService';

export default function Notifications() {
  const [notifications, setNotifications] = useState<CreatorNotification[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const sub = notificationService.subscribeToNotifications(() => {
      fetchNotifs();
    });
    return () => { sub?.unsubscribe(); };
  }, []);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    fetchNotifs();
  };

  const handleMarkRead = async (id: string, isRead: boolean) => {
    if (!isRead) {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const tabs = ['All', 'Comments', 'Likes', 'Follows', 'System'];

  const filteredNotifications = notifications.filter(notif => {
    const matchesTab = activeTab === 'All' || notif.type === activeTab;
    const matchesSearch = notif.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          notif.message?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-[1000px] mx-auto pb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Channel notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with your channel's activity in realtime</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleMarkAllRead} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors tooltip" title="Mark all as read">
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Search and Tabs */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4 bg-gray-50/30">
          <div className="flex-1 relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-sm outline-none transition-all placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                  activeTab === tab
                    ? "bg-red-600 text-white shadow-md shadow-red-200"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-12 text-center text-gray-500 animate-pulse">Loading notifications...</div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => handleMarkRead(notif.id, notif.isRead)}
                className={cn(
                  "p-5 flex gap-4 hover:bg-gray-50 transition-all cursor-pointer group relative",
                  !notif.isRead && "bg-blue-50/20"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={cn(
                      "text-sm font-semibold truncate",
                      !notif.isRead ? "text-gray-900" : "text-gray-700"
                    )}>
                      {notif.title}
                    </h3>
                    <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  {!notif.isRead && <div className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-sm animate-pulse"></div>}
                  <button className="p-1.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-200" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">No notifications yet</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-[200px]">When you receive {activeTab.toLowerCase()} notifications, they will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
