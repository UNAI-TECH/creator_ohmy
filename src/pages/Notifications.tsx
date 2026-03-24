import React, { useState } from 'react';
import { 
  Bell, MessageSquare, AtSign, Copyright, 
  Trash2, Settings, CheckCircle2, MoreVertical,
  Filter, Search
} from 'lucide-react';
import { cn } from '../lib/utils';

const notificationsData = [
  {
    id: 1,
    type: 'Comments',
    title: 'New comment on "Building a Modern Dashboard"',
    description: 'Awesome tutorial! Can you show how to integrate with Supabase?',
    user: 'Alex Rivers',
    time: '2 hours ago',
    unread: true,
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 2,
    type: 'Mentions',
    title: 'TechDaily mentioned you',
    description: 'Check out this amazing new creator we found!',
    user: 'TechDaily',
    time: '5 hours ago',
    unread: true,
    icon: AtSign,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 3,
    type: 'System',
    title: 'Channel performance update',
    description: 'Your views are up 15% this week! Keep up the great work.',
    time: 'Yesterday',
    unread: false,
    icon: Bell,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  {
    id: 4,
    type: 'Copyright',
    title: 'Copyright claim found',
    description: 'A copyright claim was found on your video "Viksit Bharat Intro".',
    time: '2 days ago',
    unread: false,
    icon: Copyright,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  },
  {
    id: 5,
    type: 'Comments',
    title: 'New reply from Sarah Chen',
    description: 'I had the same question, thanks for asking!',
    user: 'Sarah Chen',
    time: '3 hours ago',
    unread: false,
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 6,
    type: 'System',
    title: 'Security Alert',
    description: 'A new device signed into your account from Mumbai, India.',
    time: '5 hours ago',
    unread: true,
    icon: Bell,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  {
    id: 7,
    type: 'Mentions',
    title: 'DesignWeekly tagged you in a post',
    description: 'Top 10 creators to follow in 2024.',
    user: 'DesignWeekly',
    time: '8 hours ago',
    unread: false,
    icon: AtSign,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 8,
    type: 'Copyright',
    title: 'Manual claim resolved',
    description: 'The manual claim on your video "My Journey" has been retracted.',
    time: '4 days ago',
    unread: false,
    icon: Copyright,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  }
];

const tabs = ['All', 'Comments', 'Mentions', 'Copyright', 'System'];

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = notificationsData.filter(notif => {
    const matchesTab = activeTab === 'All' || notif.type === activeTab;
    const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         notif.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-[1000px] mx-auto pb-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Channel notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with your channel's activity</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors tooltip" title="Notification Settings">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors tooltip" title="Mark all as read">
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
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
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
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className={cn(
                  "p-5 flex gap-4 hover:bg-gray-50 transition-all cursor-pointer group relative",
                  notif.unread && "bg-blue-50/20"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                  notif.bgColor
                )}>
                  <notif.icon className={cn("w-6 h-6", notif.color)} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={cn(
                      "text-sm font-semibold truncate",
                      notif.unread ? "text-gray-900" : "text-gray-700"
                    )}>
                      {notif.title}
                    </h3>
                    <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">{notif.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                    {notif.description}
                    {notif.user && <span className="text-red-600 font-medium ml-1 cursor-pointer hover:underline">@{notif.user}</span>}
                  </p>
                  
                  <div className="mt-3 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-xs font-bold text-red-600 hover:underline">View details</button>
                    <button className="text-xs font-bold text-gray-400 hover:text-gray-600">Archive</button>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  {notif.unread && <div className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-sm animate-pulse"></div>}
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
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
          <button className="px-6 py-2 text-xs font-bold text-gray-500 hover:text-red-600 border border-transparent hover:border-red-100 hover:bg-red-50 rounded-full transition-all">
            Load more notifications
          </button>
        </div>
      </div>
    </div>
  );
}
