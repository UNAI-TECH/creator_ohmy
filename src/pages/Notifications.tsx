import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Search, MoreVertical, Trash2, CheckSquare, Square } from 'lucide-react';
import { cn } from '../lib/utils';
import { notificationService, CreatorNotification } from '../services/notificationService';

export default function Notifications() {
  const [notifications, setNotifications] = useState<CreatorNotification[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showGlobalMenu, setShowGlobalMenu] = useState(false);

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
    if (isSelectionMode) {
      toggleSelection(id);
      return;
    }
    if (!isRead) {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
    setShowGlobalMenu(false);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
    setShowGlobalMenu(false);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(`Delete ${count} selected notifications?`)) return;
    
    try {
      setLoading(true);
      const idsToDelete = Array.from(selectedIds) as string[];
      console.log('Deleting notification IDs:', idsToDelete);
      await notificationService.deleteNotifications(idsToDelete);
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      await fetchNotifs();
    } catch (e) {
      console.error('Delete error:', e);
      alert('Failed to delete notifications. Please try again.');
    } finally {
      setLoading(false);
    }
    setShowGlobalMenu(false);
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete all notifications? This cannot be undone.')) return;
    try {
      await notificationService.deleteAllNotifications();
      fetchNotifs();
    } catch (e) {
      alert('Failed to delete all notifications');
    }
    setShowGlobalMenu(false);
  };

  const tabs = ['All', 'Comments', 'Likes', 'Follows', 'Repost'];

  const filteredNotifications = notifications.filter(notif => {
    const type = notif.type?.toLowerCase() || '';
    const tab = activeTab.toLowerCase();
    
    if (tab === 'all') return true;
    
    if (tab === 'repost') {
      return type === 'repost' || type === 'system' || type === 'new_post';
    }
    
    // Exact match or singular/plural common cases (e.g., 'comments' matches 'comment')
    return type === tab || type === tab.slice(0, -1) || tab === type.slice(0, -1);
  });

  const allRead = filteredNotifications.every(n => n.isRead) && filteredNotifications.length > 0;

  return (
    <div className="max-w-[1000px] mx-auto pb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between mb-8 gap-4 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase">Channel notifications</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Stay updated with your channel's activity in realtime</p>
        </div>
        <div className="flex items-center gap-2 relative">
          <button 
            onClick={handleMarkAllRead} 
            className={cn(
              "p-2 sm:p-2.5 rounded-xl transition-all tooltip border shadow-sm flex items-center gap-2",
              allRead 
                ? "bg-green-50 text-green-600 border-green-200" 
                : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
            )} 
            title={allRead ? "All Read" : "Mark all as read"}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase hidden sm:block">{allRead ? 'ALL READ' : 'MARK ALL READ'}</span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowGlobalMenu(!showGlobalMenu)}
              className="p-2 sm:p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors border border-gray-100 shadow-sm"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {showGlobalMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in zoom-in-95 duration-200">
                <div className="p-2 space-y-1">
                  <button onClick={toggleSelectionMode} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                    <CheckSquare className="w-4 h-4 text-blue-500" />
                    {isSelectionMode ? 'Cancel Selection' : 'Select Notifications'}
                  </button>
                  <button onClick={handleSelectAll} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                    <Square className="w-4 h-4 text-purple-500" />
                    {selectedIds.size === filteredNotifications.length ? 'Deselect All' : 'Select All Notifications'}
                  </button>
                  <div className="h-px bg-gray-100 my-1 mx-2" />
                  <button 
                    onClick={handleDeleteSelected} 
                    disabled={selectedIds.size === 0}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected ({selectedIds.size})
                  </button>
                  <button onClick={handleDeleteAll} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                    <Bell className="w-4 h-4 opacity-50" />
                    Delete All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
        {/* Search and Tabs */}
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row items-center gap-4 bg-gray-50/30">
          <div className="flex-1 relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/5 rounded-2xl text-sm outline-none transition-all placeholder:text-gray-400 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto max-w-full">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === tab
                    ? "bg-red-600 text-white shadow-lg shadow-red-200"
                    : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
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
            <div className="p-12 text-center text-gray-500 animate-pulse font-bold uppercase tracking-widest text-xs">Loading notifications...</div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => handleMarkRead(notif.id, notif.isRead)}
                className={cn(
                  "p-5 flex gap-5 hover:bg-gray-50/80 transition-all cursor-pointer group relative",
                  !notif.isRead && "bg-blue-50/30",
                  selectedIds.has(notif.id) && "bg-red-50/50"
                )}
              >
                {isSelectionMode && (
                  <div className="flex items-center">
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      selectedIds.has(notif.id) 
                        ? "bg-red-600 border-red-600 text-white shadow-md" 
                        : "bg-white border-gray-200 text-transparent"
                    )}>
                      <CheckSquare className="w-4 h-4" />
                    </div>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className={cn(
                      "text-sm font-bold tracking-tight truncate",
                      !notif.isRead ? "text-gray-900" : "text-gray-600"
                    )}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded-full">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed font-medium">
                    {notif.message}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  {!notif.isRead && !isSelectionMode && (
                    <div className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-lg shadow-red-200 animate-pulse"></div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-24 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-6 shadow-inner">
                <Bell className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">No notifications yet</h3>
              <p className="text-xs text-gray-400 mt-2 max-w-[200px] leading-relaxed font-medium">When you receive {activeTab.toLowerCase()} notifications, they will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
