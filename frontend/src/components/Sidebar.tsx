'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FolderGit2,
  Users,
  BarChart3,
  UserCog,
  LogOut,
  KanbanSquare,
  X
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderGit2 },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Profile', href: '/profile', icon: UserCog },
  ];

  return (
    <div className="flex h-full w-64 flex-col glass-sidebar text-white relative">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <KanbanSquare className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            TaskFlow AI
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/20 text-white shadow-md shadow-purple-500/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <item.icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-white'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Card Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 mb-3">
          <div className="w-9 h-9 rounded-lg bg-purple-600/50 flex items-center justify-center font-bold text-white uppercase border border-purple-400/20 overflow-hidden">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name.slice(0, 2)
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-semibold truncate text-white">{user?.name}</h4>
            <span className="text-xs text-purple-300 font-medium px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 block w-max mt-0.5 scale-90 -translate-x-1.5">
              {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
