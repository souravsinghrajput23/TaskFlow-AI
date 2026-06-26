import React from "react";
import {
  useGetDashboardSummary,
  useGetRecentActivity,
  useGetMyTasks,
} from "@workspace/api-client-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Link } from "wouter";

import {
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Users,
  Activity,
  Clock,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";


export default function Dashboard() {

  const { data: summary, isLoading: loadingSummary } =
    useGetDashboardSummary();

  const { data: activity, isLoading: loadingActivity } =
    useGetRecentActivity();

  const { data: myTasks, isLoading: loadingTasks } =
    useGetMyTasks();


  // FIX: API returns object sometimes
  const tasks = Array.isArray(myTasks)
    ? myTasks
    : myTasks?.tasks ?? [];


  const activities = Array.isArray(activity)
    ? activity
    : activity?.activities ?? [];


  return (
    <div className="space-y-8 fade-in-up">


      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

        <div>

          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard
          </h1>

          <p className="text-muted-foreground mt-1">
            Here's what's happening across your projects.
          </p>

        </div>


        <Button asChild>

          <Link href="/projects">

            <span className="flex items-center gap-2">

              <Plus className="w-4 h-4" />

              New Project

            </span>

          </Link>

        </Button>


      </div>



      {loadingSummary ? (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {[1,2,3,4].map(i=>

            <Skeleton
              key={i}
              className="h-32 w-full rounded-xl"
            />

          )}

        </div>


      ) : summary && (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">


          <Card>
            <CardHeader className="flex flex-row justify-between">

              <CardTitle className="text-sm">
                Total Projects
              </CardTitle>

              <FolderKanban />

            </CardHeader>

            <CardContent>

              <div className="text-2xl font-bold">
                {summary.totalProjects}
              </div>

            </CardContent>
          </Card>



          <Card>

            <CardHeader className="flex flex-row justify-between">

              <CardTitle className="text-sm">
                Total Tasks
              </CardTitle>

              <CheckSquare />

            </CardHeader>


            <CardContent>

              <div className="text-2xl font-bold">
                {summary.totalTasks}
              </div>


              <p className="text-xs text-muted-foreground">

                {summary.completedTasks} completed

              </p>


            </CardContent>

          </Card>




          <Card>

            <CardHeader className="flex flex-row justify-between">

              <CardTitle className="text-sm">
                Overdue Tasks
              </CardTitle>

              <AlertTriangle />

            </CardHeader>


            <CardContent>

              <div className="text-2xl font-bold text-destructive">

                {summary.overdueTasks}

              </div>

            </CardContent>

          </Card>




          <Card>

            <CardHeader className="flex flex-row justify-between">

              <CardTitle className="text-sm">
                Active Members
              </CardTitle>

              <Users />

            </CardHeader>


            <CardContent>

              <div className="text-2xl font-bold">

                {summary.activeMembers}

              </div>

            </CardContent>


          </Card>



        </div>

      )}






      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


        <Card className="lg:col-span-2">


          <CardHeader>

            <CardTitle className="flex gap-2">

              <CheckSquare />

              My Assigned Tasks

            </CardTitle>

            <CardDescription>
              Tasks that need your attention
            </CardDescription>


          </CardHeader>



          <CardContent>


            {loadingTasks ? (

              <Skeleton className="h-20 w-full"/>


            ) : tasks.length > 0 ? (


              <div className="space-y-4">


                {tasks.slice(0,5).map((task:any)=>(


                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                  >


                    <a className="
                    flex justify-between p-3 rounded-lg border
                    hover:bg-muted/50">


                      <div>


                        <p className="font-medium">

                          {task.title}

                        </p>



                        <div className="flex gap-2 mt-2">


                          <Badge variant="outline">

                            {task.status?.replace("_"," ")}

                          </Badge>


                          <Badge variant="secondary">

                            {task.priority}

                          </Badge>


                        </div>


                      </div>




                      {task.dueDate && (

                        <div className="text-xs">

                          <Clock className="w-3 h-3 inline"/>

                          {format(
                            new Date(task.dueDate),
                            "MMM d"
                          )}

                        </div>

                      )}


                    </a>


                  </Link>


                ))}


              </div>


            ) : (

              <p className="text-muted-foreground text-center">

                No tasks assigned.

              </p>

            )}


          </CardContent>


        </Card>






        <Card>


          <CardHeader>


            <CardTitle className="flex gap-2">

              <Activity/>

              Recent Activity

            </CardTitle>


          </CardHeader>



          <CardContent>


            {activities.length > 0 ? (

              activities.map((item:any)=>(


                <div
                  key={item.id}
                  className="mb-5"
                >

                  <p className="text-sm">

                    {item.description}

                  </p>


                  <p className="text-xs text-muted-foreground">

                    {format(
                      new Date(item.createdAt),
                      "MMM d, h:mm a"
                    )}

                  </p>


                </div>


              ))


            ) : (

              <p className="text-muted-foreground">

                No recent activity.

              </p>

            )}


          </CardContent>


        </Card>



      </div>


    </div>
  );
}