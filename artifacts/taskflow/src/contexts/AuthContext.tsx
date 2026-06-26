import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe, useLogin, useLogout, useRegister } from "@workspace/api-client-react";
import type { User, LoginInput, RegisterInput } from "@workspace/api-client-react/src/generated/api.schemas";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { QueryClient, useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "taskflow_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState<boolean>(() => {
    // Check for token on initial mount
    if (typeof window !== "undefined") {
      return !!localStorage.getItem(TOKEN_KEY);
    }
    return false;
  });
  const [authError, setAuthError] = useState<string | null>(null);

  // Fetch user only if token exists
  const { data: user, isLoading: isUserLoading, error: fetchError } = useGetMe({
    query: {
      enabled: hasToken,
      retry: false,
    },
  });

  // Handle fetch errors
  useEffect(() => {
    if (fetchError) {
      setAuthError((fetchError as any)?.message || "Failed to fetch user");
      // If 401, token is invalid
      if ((fetchError as any)?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setHasToken(false);
      }
    }
  }, [fetchError]);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem(TOKEN_KEY, data.token);
        setHasToken(true);
        setAuthError(null);
        // Invalidate and refetch user
        queryClient.invalidateQueries({ queryKey: ["users", "me"] });
        setLocation("/");
        toast({ title: "Welcome back!" });
      },
      onError: (error: any) => {
        const errorMsg = error?.response?.data?.message || error?.message || "Invalid credentials";
        setAuthError(errorMsg);
        toast({
          title: "Login failed",
          description: errorMsg,
          variant: "destructive",
        });
      },
    },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem(TOKEN_KEY, data.token);
        setHasToken(true);
        setAuthError(null);
        // Invalidate and refetch user
        queryClient.invalidateQueries({ queryKey: ["users", "me"] });
        setLocation("/");
        toast({ title: "Account created!" });
      },
      onError: (error: any) => {
        const errorMsg = error?.response?.data?.message || error?.message || "Could not create account";
        setAuthError(errorMsg);
        toast({
          title: "Registration failed",
          description: errorMsg,
          variant: "destructive",
        });
      },
    },
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        localStorage.removeItem(TOKEN_KEY);
        setHasToken(false);
        setAuthError(null);
        queryClient.clear();
        setLocation("/login");
        toast({ title: "Logged out successfully" });
      },
      onError: (error: any) => {
        // Even if logout fails on backend, clear local state
        localStorage.removeItem(TOKEN_KEY);
        setHasToken(false);
        setAuthError(null);
        queryClient.clear();
        setLocation("/login");
      },
    },
  });

  const login = async (data: LoginInput) => {
    setAuthError(null);
    try {
      await loginMutation.mutateAsync({ data });
    } catch (err) {
      // Error is handled by onError in mutation
    }
  };

  const register = async (data: RegisterInput) => {
    setAuthError(null);
    try {
      await registerMutation.mutateAsync({ data });
    } catch (err) {
      // Error is handled by onError in mutation
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (err) {
      // Error is handled by onError in mutation
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: hasToken && isUserLoading,
        isAuthenticated: !!user && hasToken,
        login,
        logout,
        register,
        error: authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}