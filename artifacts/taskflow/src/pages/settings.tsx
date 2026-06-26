import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateUser, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, User as UserIcon } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateUser = useUpdateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Profile updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Failed to update profile", description: err.message, variant: "destructive" });
      }
    }
  });

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      avatarUrl: user?.avatarUrl || "",
    }
  });

  function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    updateUser.mutate({
      id: user.id,
      data: {
        fullName: values.fullName,
        avatarUrl: values.avatarUrl || undefined,
      }
    });
  }

  return (
    <div className="space-y-8 fade-in-up max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20 border">
                  <AvatarImage src={form.watch("avatarUrl") || undefined} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {user?.fullName?.charAt(0) || <UserIcon className="w-8 h-8" />}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm">Profile Picture</h3>
                  <p className="text-xs text-muted-foreground">Provide a URL for your avatar image.</p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/avatar.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Email Address</FormLabel>
                <Input value={user?.email || ""} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
              </div>

              <div className="space-y-2">
                <FormLabel>Role</FormLabel>
                <Input value={user?.role || ""} disabled className="capitalize" />
              </div>

              <div className="pt-4 flex justify-end border-t">
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
