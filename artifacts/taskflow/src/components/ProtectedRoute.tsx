import { useAuth } from "@/contexts/AuthContext";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}
