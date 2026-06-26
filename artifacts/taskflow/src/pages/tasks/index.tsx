import React from "react";
import { useGetMyTasks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Clock } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function MyTasks() {
  const { data: myTasks, isLoading } = useGetMyTasks();

  // ✅ Safe normalization (prevents "map is not a function")
  const taskList = React.useMemo(() => {
  if (!myTasks) return [];

  if (Array.isArray(myTasks)) return myTasks;

  return (
    myTasks?.tasks ||
    myTasks?.data ||
    myTasks?.items ||
    []
  );
}, [myTasks]);

  return (
    <div className="space-y-8 fade-in-up">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <CheckSquare className="w-8 h-8 text-primary" />
          My Tasks
        </h1>
        <p className="text-muted-foreground mt-1">
          All tasks assigned to you across all projects.
        </p>
      </div>

      {/* CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned to Me</CardTitle>
        </CardHeader>

        <CardContent>
          {/* LOADING STATE */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : taskList.length > 0 ? (
            /* TASK LIST */
            <div className="space-y-3">
              {taskList.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-4"
                >
                  {/* LEFT SIDE */}
                  <div className="space-y-1.5">
                    <p className="font-medium">{task.title}</p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="font-normal capitalize"
                      >
                        {String(task.status ?? "unknown").replace("_", " ")}
                      </Badge>

                      <Badge
                        variant="secondary"
                        className="font-normal capitalize"
                      >
                        {String(task.priority ?? "low")}
                      </Badge>
                    </div>
                  </div>

                  {/* RIGHT SIDE (DUE DATE) */}
                  {task.dueDate && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border shrink-0">
                      <Clock className="w-4 h-4" />
                      {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            /* EMPTY STATE */
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
              <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>You have no tasks assigned right now.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}