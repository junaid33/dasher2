'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Form from "next/form";
import { EyeIcon, EyeOffIcon, AlertCircle, CircleCheck } from "lucide-react";
import { RiLoader2Fill } from "@remixicon/react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

// Simple utility for combining class names
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Server action for password reset
async function resetPassword(formData, mode) {
  'use server';
  
  const email = formData.get('email');
  
  if (mode === 'reset') {
    const password = formData.get('password');
    const token = formData.get('token');
    
    const query = `
      mutation($email: String!, $password: String!, $token: String!) {
        redeemUserPasswordResetToken(
          email: $email
          token: $token
          password: $password
        ) {
          code
          message
        }
      }
    `;
    
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { email, password, token },
        }),
      });
      
      const result = await response.json();
      
      if (result.errors) {
        return { error: result.errors[0].message };
      }
      
      if (result.data.redeemUserPasswordResetToken?.code) {
        return { error: result.data.redeemUserPasswordResetToken.message };
      }
      
      return { success: 'Password has been reset. You can now sign in.' };
    } catch (error) {
      return { error: error.message || 'Reset operation failed' };
    }
  } else {
    // Request reset
    const query = `
      mutation($email: String!) {
        sendUserPasswordResetLink(email: $email)
      }
    `;
    
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { email },
        }),
      });
      
      const result = await response.json();
      
      if (result.errors) {
        return { error: result.errors[0].message };
      }
      
      if (result.data.sendUserPasswordResetLink === true) {
        return { success: 'Password reset link has been sent to your email.' };
      } else {
        return { error: 'Password reset request failed' };
      }
    } catch (error) {
      return { error: error.message || 'Reset operation failed' };
    }
  }
}

export default function ResetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const mode = token ? "reset" : "request";
  
  const emailRef = useRef(null);
  useEffect(() => {
    emailRef.current?.focus();
  }, [mode]);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleFormAction = async (formData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    // Add token to formData if in reset mode
    if (mode === 'reset') {
      formData.append('token', token);
    }
    
    const result = await resetPassword(formData, mode);
    
    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(result.success);
      
      if (mode === 'reset') {
        // Redirect to signin after successful reset
        setTimeout(() => router.push('/dashboard/signin'), 3000);
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div
      className={`px-2 h-screen flex justify-center items-center bg-[#0f172a] heropattern-topography-zinc-500/10 dark:bg-background`}
    >
      <div className="flex flex-col gap-2 md:gap-4 basis-[450px] px-2">
        <Form action={handleFormAction}>
          <Card className="overflow-hidden shadow-sm dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-wide text-slate-600 dark:text-white">
                <div className="inline-block">
                  <span>
                    {mode === "reset"
                      ? "RESET PASSWORD"
                      : "REQUEST PASSWORD RESET"}
                  </span>
                  <div className="h-1 mt-0.5 bg-gradient-to-r from-orange-700 to-orange-200 dark:from-orange-800 dark:to-orange-600"></div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email" className="text-md">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    placeholder="you@example.com"
                    ref={emailRef}
                    className="bg-muted"
                    required
                  />
                </div>
                {mode === "reset" && (
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="password" className="text-md">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        placeholder="New password"
                        type={isPasswordVisible ? "text" : "password"}
                        className="bg-muted pe-9"
                        required
                      />
                      <button
                        className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                        type="button"
                        onClick={togglePasswordVisibility}
                        aria-label={
                          isPasswordVisible ? "Hide password" : "Show password"
                        }
                        aria-pressed={isPasswordVisible}
                        aria-controls="password"
                      >
                        {isPasswordVisible ? (
                          <EyeOffIcon size={16} aria-hidden="true" />
                        ) : (
                          <EyeIcon size={16} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col justify-between">
              <button
                type="submit"
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "w-full text-md tracking-wide h-11 md:h-12 font-semibold text-white uppercase bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 dark:from-orange-700 dark:to-orange-800 dark:hover:from-orange-800 dark:hover:to-orange-900 dark:text-gray-100 disabled:opacity-50 disabled:hover:from-orange-600 disabled:hover:to-orange-700 dark:disabled:hover:from-orange-700 dark:disabled:hover:to-orange-800",
                  {
                    "opacity-50": isLoading,
                  }
                )}
                disabled={isLoading}
              >
                {isLoading && (
                  <RiLoader2Fill className="size-4 shrink-0 animate-spin" />
                )}
                {mode === "reset" ? "RESET PASSWORD" : "SEND RESET LINK"}
              </button>
            </CardFooter>
          </Card>
        </Form>

        {error && (
          <Badge color="rose" className="items-start gap-4 border p-4">
            <AlertCircle className="h-5 w-5" />
            <div className="flex flex-col">
              <h2 className="uppercase tracking-wide font-medium">Error</h2>
              <span>{error}</span>
            </div>
          </Badge>
        )}
        {success && (
          <Badge color="emerald" className="items-start gap-4 border p-4">
            <CircleCheck className="h-5 w-5" />
            <div className="flex flex-col">
              <h2 className="uppercase tracking-wide font-medium">Success</h2>
              <span>{success}</span>
            </div>
          </Badge>
        )}
      </div>
    </div>
  );
} 