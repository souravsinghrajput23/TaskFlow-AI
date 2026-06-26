import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config";
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
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Login() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      await login(values);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
              Log in to {APP_NAME}
            </h1>
            <p className="text-muted-foreground">
              Enter your email and password to access your command center.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" type="email" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Log in"}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </div>
        </motion.div>
      </div>
      
      <div className="hidden md:flex flex-1 bg-muted items-center justify-center p-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-[length:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 max-w-lg w-full"
        >
          <div className="p-8 rounded-2xl bg-card border shadow-2xl flex flex-col gap-6">
             <div className="flex gap-4 items-start">
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                 <div className="w-4 h-4 bg-primary rounded-sm" />
               </div>
               <div>
                 <h3 className="font-semibold text-lg">AI-Powered Insights</h3>
                 <p className="text-muted-foreground text-sm leading-relaxed mt-1">
                   TaskFlow analyzes your team's velocity and automatically suggests optimal schedules to prevent burnout and ensure on-time delivery.
                 </p>
               </div>
             </div>
             
             <div className="flex gap-4 items-start opacity-50">
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0" />
               <div>
                 <div className="h-5 w-32 bg-muted rounded-md mb-2" />
                 <div className="h-4 w-full bg-muted rounded-md mb-1" />
                 <div className="h-4 w-4/5 bg-muted rounded-md" />
               </div>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
