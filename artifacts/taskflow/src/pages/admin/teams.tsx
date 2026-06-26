import React from "react";
import { useListTeams, useDeleteTeam, getListTeamsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function AdminTeams() {
  const { data: teams, isLoading } = useListTeams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteTeam = useDeleteTeam({
    mutation: {
      onSuccess: () => {
        toast({ title: "Team deleted" });
        queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Failed to delete team", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this team? This cannot be undone.")) {
      deleteTeam.mutate({ id });
    }
  };

  return (
    <div className="space-y-8 fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Team Management
        </h1>
        <p className="text-muted-foreground mt-1">Manage system teams.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Teams</CardTitle>
          <CardDescription>A list of all organizational teams.</CardDescription>
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
                    <TableHead>Team Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Members Count</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams?.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell className="truncate max-w-[300px]">{team.description}</TableCell>
                      <TableCell>{team.members?.length || 0} members</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(team.createdAt), "MMM d, yyyy")}
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
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDelete(team.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Team
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
