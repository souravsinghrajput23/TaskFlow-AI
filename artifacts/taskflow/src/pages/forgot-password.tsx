import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
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
import { useForgotPassword } from "@workspace/api-client-react";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export default function ForgotPassword() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  
  const forgotPasswordMutation = useForgotPassword({
    mutation: {
      onSuccess: () => {
        setIsSubmitted(true);
      },
      onError: (error: any) => {
        toast({ title: "Failed to send reset email", description: error.message, variant: "destructive" });
      }
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await forgotPasswordMutation.mutateAsync({ data: values });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-primary/5 -skew-y-3 transform origin-top-left -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border shadow-xl"
      >
        <Link href="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Link>

        {isSubmitted ? (
          <div className="text-center space-y-4 py-8">
            <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
            <p className="text-muted-foreground">
              We've sent a password reset link to <span className="font-medium text-foreground">{form.getValues("email")}</span>.
            </p>
            <Button className="mt-4 w-full" variant="outline" onClick={() => setIsSubmitted(false)}>
              Try another email
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                Reset password
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter your email address and we'll send you a link to reset your password.
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
                        <Input placeholder="name@example.com" type="email" {...field} disabled={forgotPasswordMutation.isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isPending}>
                  {forgotPasswordMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send reset link"}
                </Button>
              </form>
            </Form>
          </>
        )}
      </motion.div>
    </div>
  );
}
