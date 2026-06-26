import React, { useState } from "react";
import { useParams } from "wouter";
import { 
  useGetProject, 
  useGetProjectStats, 
  useListTasks, 
  useGetProjectRiskAlerts,
  useCreateTask
} from "@workspace/api-client-react";
import { 
  getGetProjectQueryKey, 
  getGetProjectStatsQueryKey, 
  getListTasksQueryKey, 
  getGetProjectRiskAlertsQueryKey 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, Zap, Loader2, ListTodo, Plus } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = id ? parseInt(id, 10) : undefined; // ✅ undefined instead of 0
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  const { data: project, isLoading: loadingProject } = useGetProject(projectId!, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId!) }
  });
  
  const { data: stats, isLoading: loadingStats } = useGetProjectStats(projectId!, {
    query: { enabled: !!projectId, queryKey: getGetProjectStatsQueryKey(projectId!) }
  });

  const { data: tasks, isLoading: loadingTasks } = useListTasks(
    { projectId },
    { query: { enabled: !!projectId, queryKey: getListTasksQueryKey({ projectId }) } }
  );

  const { data: risks, isLoading: loadingRisks } = useGetProjectRiskAlerts(projectId!, {
    query: { enabled: !!projectId, queryKey: getGetProjectRiskAlertsQueryKey(projectId!), retry: false }
  });

  const createTask = useCreateTask({
    mutation: {
      onSuccess: () => {
        toast({ title: "Task created successfully" });
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ projectId }) });
        setIsTaskDialogOpen(false);
        form.reset();
      },
      onError: (err: any) => {
        toast({ title: "Failed to create task", description: err.message, variant: "destructive" });
      }
    }
  });

  const form = useForm<z.infer<typeof createTaskSchema>>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    }
  });

  function onSubmit(values: z.infer<typeof createTaskSchema>) {
    if (!projectId) return; // ✅ guard before mutating
    createTask.mutate({ 
      data: { 
        title: values.title, 
        description: values.description, 
        priority: values.priority as any,
        projectId 
      } 
    });
  }

  if (loadingProject) {
    return <div className="space-y-6"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!project) {
    return <div className="p-8 text-center">Project not found</div>;
  }

  return (
    <div className="space-y-8 fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={project.status === "active" ? "default" : "secondary"} className="capitalize">
              {project.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/ai">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                AI Schedule
              </span>
            </Link>
          </Button>
          
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Title</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g. Design database schema" {...field} />
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
                          <Textarea placeholder="More details about this task..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createTask.isPending}>
                    {createTask.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Task
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <div className="text-lg font-semibold flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-primary" />
                Tasks
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingTasks ? (
                <div className="space-y-4"><Skeleton className="h-12 w-full"/><Skeleton className="h-12 w-full"/></div>
              ) : tasks && tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.map(task => (
                    <Link 
                      key={task.id} 
                      href={`/tasks/${task.id}`}
                      className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-green-500' : 'bg-primary'}`} />
                        <span className="font-medium text-sm">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-xs font-normal">
                          {task.status.replace("_", " ")}
                        </Badge>
                        <Badge variant="secondary" className="capitalize text-xs font-normal">
                          {task.priority}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                  <ListTodo className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>No tasks yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="text-sm font-medium text-muted-foreground">Project Stats</div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-32 w-full" />
              ) : stats ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Completion</span>
                      <span className="font-medium">{Math.round(stats.completionRate)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${stats.completionRate}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Tasks</p>
                      <p className="text-xl font-bold">{stats.total}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Overdue</p>
                      <p className={`text-xl font-bold ${stats.overdueTasks > 0 ? 'text-destructive' : ''}`}>
                        {stats.overdueTasks}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {risks && risks.alerts.length > 0 && (
            <Card className="border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20">
              <CardHeader className="pb-2">
                <div className="text-sm font-medium flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <AlertTriangle className="w-4 h-4" />
                  AI Risk Alerts
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {risks.alerts.map((alert, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-orange-600 dark:text-orange-500" />
                      <span className="text-orange-900 dark:text-orange-200">{alert.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}