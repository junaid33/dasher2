'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Form from "next/form";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, AlertCircle } from "lucide-react";
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
import { cn } from "@/lib/utils/cn";


// Server action for authentication
async function authenticateUser(formData) {
  'use server';
  
  const identity = formData.get('identity');
  const secret = formData.get('secret');
  
  // Direct GraphQL mutation
  const query = `
    mutation($identity: String!, $secret: String!) {
      authenticate: authenticateUserWithPassword(email: $identity, password: $secret) {
        ... on UserAuthenticationWithPasswordSuccess {
          item {
            id
          }
        }
        ... on UserAuthenticationWithPasswordFailure {
          message
        }
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
        variables: { identity, secret },
      }),
    });
    
    const result = await response.json();
    
    if (result.errors) {
      return { error: result.errors[0].message };
    }
    
    return { data: result.data };
  } catch (error) {
    return { error: error.message || 'Authentication failed' };
  }
}

export default function SignInPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authData, setAuthData] = useState(null);
  
  const identityFieldRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    identityFieldRef.current?.focus();
  }, []);

  // Handle authentication response
  useEffect(() => {
    if (!authData) return;

    if (authData.authenticate?.__typename === "UserAuthenticationWithPasswordSuccess") {
      // Revalidate the cache
      router.refresh();
      // Redirect to dashboard
      router.push('/dashboard');
    } else if (authData.authenticate?.__typename === "UserAuthenticationWithPasswordFailure") {
      setAuthError(authData.authenticate.message);
      setIsLoading(false);
    }
  }, [authData, router]);

  const handleFormAction = async (formData) => {
    setIsLoading(true);
    setAuthError(null);
    
    const result = await authenticateUser(formData);
    
    if (result.error) {
      setAuthError(result.error);
      setIsLoading(false);
      return;
    }
    
    setAuthData(result.data);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
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
                  <span>SIGN IN</span>
                  <div className="h-1 mt-0.5 bg-gradient-to-r from-emerald-700 to-emerald-200 dark:from-emerald-800 dark:to-emerald-600"></div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="identity" className="text-sm capitalize">
                    Email
                  </Label>
                  <Input
                    id="identity"
                    name="identity"
                    placeholder="Enter your email"
                    ref={identityFieldRef}
                    className="bg-muted"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="secret" className="text-sm capitalize">
                    <span className="flex justify-between">
                      Password <Link href="/dashboard/reset" className="text-muted-foreground text-xs">Forgot Password?</Link>
                    </span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="secret"
                      name="secret"
                      placeholder="Enter your password"
                      type={isPasswordVisible ? "text" : "password"}
                      className="bg-muted pe-9"
                    />
                    <button
                      className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                      type="button"
                      onClick={togglePasswordVisibility}
                      aria-label={
                        isPasswordVisible ? "Hide password" : "Show password"
                      }
                      aria-pressed={isPasswordVisible}
                      aria-controls="secret"
                    >
                      {isPasswordVisible ? (
                        <EyeOffIcon size={16} aria-hidden="true" />
                      ) : (
                        <EyeIcon size={16} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col justify-between">
              <button
                type="submit"
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "w-full text-md tracking-wide h-11 md:h-12 font-semibold text-white uppercase bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-700 dark:to-green-800 dark:hover:from-green-800 dark:hover:to-green-900 dark:text-gray-100 disabled:opacity-50 disabled:hover:from-green-600 disabled:hover:to-green-700 dark:disabled:hover:from-green-700 dark:disabled:hover:to-green-800",
                  {
                    "opacity-50": isLoading,
                  }
                )}
                disabled={isLoading}
              >
                {isLoading && (
                  <RiLoader2Fill className="size-4 shrink-0 animate-spin" />
                )}
                SIGN IN
              </button>
            </CardFooter>
          </Card>
        </Form>

        {authError && (
          <Badge color="rose" className="items-start gap-4 border p-4">
            <AlertCircle className="h-5 w-5" />
            <div className="flex flex-col">
              <h2 className="uppercase tracking-wide font-medium">Error</h2>
              <span>{authError}</span>
            </div>
          </Badge>
        )}
      </div>
    </div>
  );
} 