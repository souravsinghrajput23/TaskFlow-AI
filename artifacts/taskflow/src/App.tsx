import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/projects/detail";
import MyTasks from "@/pages/tasks";
import TaskDetail from "@/pages/tasks/detail";
import Teams from "@/pages/teams";
import AIHub from "@/pages/ai-hub";
import Settings from "@/pages/settings";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminProjects from "@/pages/admin/projects";
import AdminTeams from "@/pages/admin/teams";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />

      <Route>
        <ProtectedRoute>
          <AppLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/projects" component={Projects} />
              <Route path="/projects/:id" component={ProjectDetail} />
              <Route path="/tasks/my" component={MyTasks} />
              <Route path="/tasks/:id" component={TaskDetail} />
              <Route path="/teams" component={Teams} />
              <Route path="/ai" component={AIHub} />
              <Route path="/settings" component={Settings} />
              
              {/* Admin Routes */}
              <Route path="/admin">
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              </Route>
              <Route path="/admin/users">
                <ProtectedRoute adminOnly>
                  <AdminUsers />
                </ProtectedRoute>
              </Route>
              <Route path="/admin/projects">
                <ProtectedRoute adminOnly>
                  <AdminProjects />
                </ProtectedRoute>
              </Route>
              <Route path="/admin/teams">
                <ProtectedRoute adminOnly>
                  <AdminTeams />
                </ProtectedRoute>
              </Route>
              
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="taskflow-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <Router />
              <Toaster />  {/* ✅ moved inside */}
            </AuthProvider>
          </WouterRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
