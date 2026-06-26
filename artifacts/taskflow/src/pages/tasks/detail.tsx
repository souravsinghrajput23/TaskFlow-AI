import React from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetTask, 
  useUpdateTask, 
  useListComments, 
  useCreateComment,
  getGetTaskQueryKey,
  getListCommentsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, MessageSquare, Save, User, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

export default function TaskDetail() {
  const { id } = useParams();
  const taskId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: task, isLoading: loadingTask } = useGetTask(taskId, {
    query: { enabled: !!taskId, queryKey: getGetTaskQueryKey(taskId) }
  });

  const { data: comments, isLoading: loadingComments } = useListComments(taskId, {
    query: { enabled: !!taskId, queryKey: getListCommentsQueryKey(taskId) }
  });

  const updateTask = useUpdateTask({
    mutation: {
      onSuccess: () => {
        toast({ title: "Task updated" });
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
      }
    }
  });

  const createComment = useCreateComment({
    mutation: {
      onSuccess: () => {
        setNewComment("");
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(taskId) });
      }
    }
  });

  const [newComment, setNewComment] = React.useState("");

  const handleStatusChange = (val: string) => {
    updateTask.mutate({ id: taskId, data: { status: val as any } });
  };

  const handlePriorityChange = (val: string) => {
    updateTask.mutate({ id: taskId, data: { priority: val as any } });
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createComment.mutate({ id: taskId, data: { content: newComment } });
  };

  if (loadingTask) {
    return <div className="space-y-6"><Skeleton className="h-12 w-32" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!task) {
    return <div className="p-8 text-center">Task not found</div>;
  }

  return (
    <div className="space-y-6 fade-in-up max-w-4xl mx-auto">
      <Button variant="ghost" className="mb-4 text-muted-foreground pl-0 hover:bg-transparent hover:text-foreground" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{task.title}</h1>
            <div className="text-sm text-muted-foreground flex gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Created {format(new Date(task.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none bg-card p-6 rounded-xl border">
            {task.description ? (
              <p className="whitespace-pre-wrap m-0">{task.description}</p>
            ) : (
              <p className="text-muted-foreground italic m-0">No description provided.</p>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Discussion
            </h3>
            
            <div className="space-y-4">
              {loadingComments ? (
                <Skeleton className="h-20 w-full" />
              ) : comments && comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-4">
                    <Avatar className="w-8 h-8 shrink-0 mt-1">
                      <AvatarImage src={comment.author?.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {comment.author?.fullName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted/30 p-4 rounded-xl border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">{comment.author?.fullName || "User"}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), "MMM d, h:mm a")}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}
            </div>

            <form onSubmit={submitComment} className="mt-6 flex gap-4 items-start">
              <Avatar className="w-8 h-8 shrink-0 mt-1">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">ME</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea 
                  placeholder="Add a comment..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={!newComment.trim() || createComment.isPending} size="sm">
                    {createComment.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Post Comment
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="w-full md:w-72 shrink-0 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                <Select value={task.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">In Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
                <Select value={task.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignee</label>
                {task.assignedUser ? (
                  <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/20">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={task.assignedUser.avatarUrl || undefined} />
                      <AvatarFallback className="text-[10px]">{task.assignedUser.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{task.assignedUser.fullName}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-md border border-dashed text-muted-foreground text-sm">
                    <User className="w-4 h-4" />
                    Unassigned
                  </div>
                )}
              </div>
              
              {task.dueDate && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</label>
                  <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/20 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {format(new Date(task.dueDate), "MMM d, yyyy")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
