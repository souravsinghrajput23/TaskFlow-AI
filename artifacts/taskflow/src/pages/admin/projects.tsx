import React from "react";
import { useListProjects, useDeleteProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";

export default function AdminProjects() {
  const { data: projects, isLoading } = useListProjects();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteProject = useDeleteProject({
    mutation: {
      onSuccess: () => {
        toast({ title: "Project deleted" });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Failed to delete project", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this project? This cannot be undone.")) {
      deleteProject.mutate({ id });
    }
  };

  return (
    <div className="space-y-8 fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <FolderKanban className="w-8 h-8 text-primary" />
          Project Management
        </h1>
        <p className="text-muted-foreground mt-1">Manage all system projects.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>A list of all projects across all teams.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects?.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <Link href={`/projects/${project.id}`}>
                          <a className="hover:underline">{project.name}</a>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={project.status === "active" ? "default" : "secondary"} className="capitalize">
                          {project.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {project.completedTaskCount || 0} / {project.taskCount || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(project.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDelete(project.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
