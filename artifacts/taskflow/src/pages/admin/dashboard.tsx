import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FolderKanban, Shield, LayoutDashboard } from "lucide-react";
import { Link } from "wouter";
import { useListUsers, useGetDashboardSummary } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: users, isLoading: loadingUsers } = useListUsers();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();

  return (
    <div className="space-y-8 fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Admin Workspace
        </h1>
        <p className="text-muted-foreground mt-2">
          System-wide oversight and management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold text-foreground">{users?.length || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold">{summary?.totalProjects || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link href="/admin/users">
          <a className="block h-full">
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardHeader>
                <Users className="w-8 h-8 text-primary mb-2" />
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage roles, access, and accounts.</CardDescription>
              </CardHeader>
            </Card>
          </a>
        </Link>
        <Link href="/admin/projects">
          <a className="block h-full">
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardHeader>
                <FolderKanban className="w-8 h-8 text-primary mb-2" />
                <CardTitle>All Projects</CardTitle>
                <CardDescription>Global view of all system projects.</CardDescription>
              </CardHeader>
            </Card>
          </a>
        </Link>
        <Link href="/admin/teams">
          <a className="block h-full">
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardHeader>
                <LayoutDashboard className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Team Structure</CardTitle>
                <CardDescription>Manage organizational layout.</CardDescription>
              </CardHeader>
            </Card>
          </a>
        </Link>
      </div>
    </div>
  );
}
