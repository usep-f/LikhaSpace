'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Bell, Check, Trash2, Calendar, FileText, MessageSquare, ShieldAlert, Activity } from 'lucide-react';
import { Notification } from '@/lib/types';
import { subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/db';

export const NotificationBell: React.FC = () => {
  const { address } = useWallet();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!address) return;
    const unsubscribe = subscribeToNotifications(address, (nots) => {
      setNotifications(nots);
    });
    return () => unsubscribe();
  }, [address]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    if (!address) return;
    await markAllNotificationsAsRead(address);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Calendar className="w-4 h-4 text-hotpink" />;
      case 'escrow': return <Activity className="w-4 h-4 text-neongreen" />;
      case 'deliverable': return <FileText className="w-4 h-4 text-neoncyan" />;
      case 'dispute': return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'chat': return <MessageSquare className="w-4 h-4 text-yellow-400" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-hotpink/50"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 w-2 h-2 bg-hotpink rounded-full shadow-[0_0_8px_rgba(255,0,127,0.8)]"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-violet-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 origin-top-right backdrop-blur-xl">
          <div className="flex justify-between items-center p-4 border-b border-white/5 bg-obsidian/50">
            <h3 className="font-heading font-bold text-sm text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-neoncyan hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" /> Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500">
                <Check className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">You are all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read) handleMarkAsRead(notif.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-start gap-3 p-4 cursor-pointer transition-colors group ${
                      notif.read ? 'hover:bg-white/5' : 'bg-hotpink/5 hover:bg-hotpink/10'
                    }`}
                  >
                    <div className="p-2 rounded-full bg-obsidian border border-white/5 shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <p className={`text-sm font-semibold truncate ${notif.read ? 'text-gray-200' : 'text-white'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-gray-500 shrink-0 whitespace-nowrap mt-0.5">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${notif.read ? 'text-gray-400' : 'text-gray-300'}`}>
                        {notif.message}
                      </p>
                      {!notif.read && (
                        <div className="mt-2 text-[10px] text-hotpink font-bold uppercase tracking-wider">Unread</div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-2 self-stretch pt-1">
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-hotpink shrink-0"></div>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, notif.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-all cursor-pointer p-1"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
