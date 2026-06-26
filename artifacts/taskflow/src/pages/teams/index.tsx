import React from "react";
import {
  useListTeams,
  useCreateTeam,
  getListTeamsQueryKey,
} from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Users, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
});

export default function Teams() {
  const { data: teams, isLoading } = useListTeams();

  // ✅ SAFE normalization (prevents map crash)
  const teamList = Array.isArray(teams)
    ? teams
    : teams?.teams ?? [];

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof createTeamSchema>>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createTeam = useCreateTeam({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListTeamsQueryKey(),
        });
        setIsDialogOpen(false);
        form.reset();
        toast({ title: "Team created successfully" });
      },
      onError: (err: Error) => {
        toast({
          title: "Failed to create team",
          description: err.message,
          variant: "destructive",
        });
      },
    },
  });

  function onSubmit(values: z.infer<typeof createTeamSchema>) {
    createTeam.mutate({ data: values });
  }

  return (
    <div className="space-y-8 fade-in-up">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Manage organizational groups and members.
          </p>
        </div>

        {/* CREATE TEAM DIALOG */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="E.g. Frontend Engineering"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What does this team do?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createTeam.isPending}
                >
                  {createTeam.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Team
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* LOADING STATE */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : teamList.length > 0 ? (
        /* TEAM GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamList.map((team) => (
            <Card key={team.id} className="flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {team.name}
                </CardTitle>

                <CardDescription className="line-clamp-2 h-10 mt-1">
                  {team.description || "No description"}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="pt-4 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Members
                  </p>

                  <div className="flex -space-x-2 overflow-hidden">
                    {Array.isArray(team.members) &&
                    team.members.length > 0 ? (
                      team.members.map((member) => (
                        <Avatar
                          key={member.id}
                          className="inline-block border-2 border-background w-8 h-8"
                        >
                          <AvatarImage src={member.avatarUrl || undefined} />

                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {(member.fullName?.charAt(0) || "?").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        No members yet
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>

          <h3 className="text-lg font-semibold">No teams found</h3>

          <p className="text-muted-foreground mt-1 max-w-sm">
            Create teams to group users and manage project access more easily.
          </p>
        </div>
      )}
    </div>
  );
}