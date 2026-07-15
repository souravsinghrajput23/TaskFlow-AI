'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { NotificationService } from '@/services/api.service';
import { Notification } from '@/types';
import { Bell, Menu, CheckCircle, CircleAlert, Check } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const getPageTitle = () => {
    const segment = pathname.split('/')[1];
    if (!segment) return 'Dashboard';
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const fetchNotifications = async () => {
    try {
      const data = await NotificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Mark all read failed:', error);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error('Mark single read failed:', error);
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 relative z-20">
      {/* Page Title & Mobile Trigger */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold text-white tracking-wide">{getPageTitle()}</h2>
      </div>

      {/* Action Items */}
      <div className="flex items-center gap-4 relative">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-slate-950 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-80 glass-panel border border-white/10 shadow-2xl p-4 z-20 max-h-96 overflow-y-auto animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.isRead && handleMarkRead(n.id)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                          n.isRead
                            ? 'bg-transparent border-transparent opacity-60'
                            : 'bg-purple-950/20 border-purple-500/20 hover:bg-purple-950/30'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {n.title.toLowerCase().includes('complete') ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <CircleAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <h4 className="text-xs font-semibold text-white">{n.title}</h4>
                            <p className="text-[11px] text-gray-300 mt-0.5 leading-normal">
                              {n.message}
                            </p>
                            <span className="text-[9px] text-gray-400 block mt-1.5">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Info Capsule */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
          <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center font-bold text-white uppercase text-xs">
            {user?.name.slice(0, 1)}
          </div>
          <span className="text-xs text-gray-300 font-medium">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
