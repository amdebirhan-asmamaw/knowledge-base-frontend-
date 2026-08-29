"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { appConfig } from "@/config/app.config";

// ─── Zod schema ───────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

function LoginForm() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/admin/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    setSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        // NextAuth encodes the thrown Error message after "Error: "
        // result.error is either the literal message or a code like "CredentialsSignin"
        if (result.error === "AdminAccessDenied") {
          setServerError("Your account does not have admin access.");
        } else if (result.error === "CredentialsSignin") {
          // Fallback when NextAuth swallows the message
          setServerError("Invalid email or password.");
        } else {
          // This carries the raw backend message when thrown via new Error(message)
          setServerError(result.error);
        }
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <AppLogo variant="admin" />

        {/* Card */}
        <div className="bg-card rounded-xl shadow-lg border border-border p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder={appConfig.admin.emailPlaceholder}
                          disabled={submitting}
                          autoFocus
                          autoComplete="email"
                          className="pl-9"
                          onChange={(e) => {
                            field.onChange(e);
                            setServerError(null);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          disabled={submitting}
                          autoComplete="current-password"
                          className="pl-9"
                          onChange={(e) => {
                            field.onChange(e);
                            setServerError(null);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Backend / server error banner */}
              {serverError && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return <LoginForm />;
}
