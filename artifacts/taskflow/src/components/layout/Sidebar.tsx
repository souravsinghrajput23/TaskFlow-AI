import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  BrainCircuit,
  Shield,
  LogOut,
} from "lucide-react";
import { APP_NAME } from "@/config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FolderKanban, label: "Projects", href: "/projects" },
  { icon: CheckSquare, label: "My Tasks", href: "/tasks/my" },
  { icon: Users, label: "Teams", href: "/teams" },
  { icon: BrainCircuit, label: "AI Hub", href: "/ai" },
];

const adminItems = [
  { icon: Shield, label: "Admin Dashboard", href: "/admin" },
];

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (val: boolean) => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300 z-20 h-screen sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center h-14 px-4 border-b shrink-0 justify-between">
        {!collapsed && <span className="font-bold text-lg tracking-tight font-mono text-primary">{APP_NAME}</span>}
        {collapsed && <span className="font-bold text-lg tracking-tight font-mono text-primary mx-auto text-center w-full block">TF</span>}
      </div>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          {!collapsed && "Platform"}
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              location === item.href || (location.startsWith(item.href) && item.href !== "/")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}

        {user?.role === "admin" && (
          <>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-2">
              {!collapsed && "Admin"}
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.startsWith(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </>
        )}
      </div>

      <div className="p-4 border-t mt-auto shrink-0 flex flex-col gap-4">
        <Link href="/settings" className="flex items-center gap-3 w-full" title={collapsed ? "Settings" : undefined}>
          <Avatar className="w-8 h-8 rounded-md shrink-0">
            <AvatarImage src={user?.avatarUrl || undefined} />
            <AvatarFallback className="rounded-md bg-primary/10 text-primary">
              {user?.fullName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate">{user?.fullName}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.role}</span>
            </div>
          )}
        </Link>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout} 
          className={cn("w-full justify-start text-muted-foreground hover:text-foreground", collapsed && "justify-center px-0")}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className={cn("w-4 h-4", !collapsed && "mr-2")} />
          {!collapsed && "Logout"}
        </Button>
      </div>
    </aside>
  );
}