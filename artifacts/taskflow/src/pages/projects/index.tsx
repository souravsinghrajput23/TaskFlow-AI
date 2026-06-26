import React from "react";
import { useListProjects, useCreateProject } from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Link } from "wouter";
import { FolderKanban, Plus, Clock, CheckSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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
import { getListProjectsQueryKey } from "@workspace/api-client-react";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

export default function Projects() {
  const { data: projects, isLoading } = useListProjects();

  const projectList = Array.isArray(projects)
    ? projects
    : projects?.projects ?? [];

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof createProjectSchema>>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createProject = useCreateProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListProjectsQueryKey(),
        });
        setIsDialogOpen(false);
        form.reset();
        toast({ title: "Project created successfully" });
      },
      onError: (err: Error) => {
        toast({
          title: "Failed to create project",
          description: err.message,
          variant: "destructive",
        });
      },
    },
  });

  function onSubmit(values: z.infer<typeof createProjectSchema>) {
    createProject.mutate({
      data: {
        name: values.name,
        description: values.description,
      },
    });
  }

  return (
    <div className="space-y-8 fade-in-up">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your active projects.
          </p>
        </div>

        {/* CREATE PROJECT DIALOG */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
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
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="E.g. Q4 Marketing Campaign"
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
                          placeholder="What is this project about?"
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
                  disabled={createProject.isPending}
                >
                  {createProject.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Project
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* LOADING STATE */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : projectList.length > 0 ? (
        /* PROJECT GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectList.map((project) => {
            const progress =
              project.taskCount > 0
                ? Math.round(
                    ((project.completedTaskCount || 0) /
                      project.taskCount) *
                      100
                  )
                : 0;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block h-full"
              >
                <Card className="h-full hover:border-primary/50 transition-colors flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="line-clamp-1">
                        {project.name}
                      </CardTitle>

                      <Badge
                        variant={
                          project.status === "active"
                            ? "default"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {(project.status ?? "unknown").replace("_", " ")}
                      </Badge>
                    </div>

                    <CardDescription className="line-clamp-2 mt-2 h-10">
                      {project.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4" />
                          <span>
                            {project.completedTaskCount || 0} /{" "}
                            {project.taskCount || 0}
                          </span>
                        </div>

                        {project.dueDate && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>
                              {format(new Date(project.dueDate), "MMM d")}
                            </span>
                          </div>
                        )}
                      </div>

                      {project.taskCount > 0 && (
                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <FolderKanban className="w-8 h-8 text-muted-foreground" />
          </div>

          <h3 className="text-lg font-semibold">No projects yet</h3>

          <p className="text-muted-foreground mt-1 max-w-sm">
            Create your first project to start organizing tasks and
            collaborating with your team.
          </p>

          <Button className="mt-6" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      )}
    </div>
  );
}