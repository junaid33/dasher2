'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Form from "next/form";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
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

// Server action for user registration
async function registerUser(formData) {
  'use server';
  
  const email = formData.get('email');
  const password = formData.get('password');
  const name = email.split('@')[0]; // Simple name derivation from email
  
  // First create the user
  const createUserQuery = `
    mutation($email: String!, $name: String!, $password: String!) {
      createUser(data: { email: $email, name: $name, password: $password }) {
        id
        email
        name
      }
    }
  `;
  
  try {
    const createResponse = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: createUserQuery,
        variables: { email, name, password },
      }),
    });
    
    const createResult = await createResponse.json();
    
    if (createResult.errors) {
      return { error: createResult.errors[0].message };
    }
    
    if (!createResult.data.createUser) {
      return { error: 'Failed to create user' };
    }
    
    // Then authenticate the user
    const authQuery = `
      mutation($email: String!, $password: String!) {
        authenticate: authenticateUserWithPassword(email: $email, password: $password) {
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
    
    const authResponse = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: authQuery,
        variables: { email, password },
      }),
    });
    
    const authResult = await authResponse.json();
    
    if (authResult.errors) {
      return { error: authResult.errors[0].message };
    }
    
    return { data: authResult.data };
  } catch (error) {
    return { error: error.message || 'Registration failed' };
  }
}

export default function SignUpPage() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authData, setAuthData] = useState(null);
  
  const emailRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Handle authentication response
  useEffect(() => {
    if (!authData) return;

    if (authData.authenticate?.__typename === "UserAuthenticationWithPasswordSuccess") {
      // Revalidate the cache
      router.refresh();
      // Redirect to dashboard
      router.push('/dashboard');
    }
  }, [authData, router]);

  const handleFormAction = async (formData) => {
    setIsLoading(true);
    setError(null);
    
    const result = await registerUser(formData);
    
    if (result.error) {
      // Special case for email already exists
      if (result.error.includes("Unique constraint failed on the fields: (`email`)")) {
        router.push('/dashboard/signin');
        return;
      }
      
      setError(result.error);
      setIsLoading(false);
      return;
    }
    
    setAuthData(result.data);
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
                  <span>SIGN UP</span>
                  <div className="h-1 mt-0.5 bg-gradient-to-r from-blue-700 to-blue-200 dark:from-blue-800 dark:to-blue-600"></div>
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
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password" className="text-md">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    placeholder="supersecretpassword"
                    type="password"
                    className="bg-muted"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col justify-between">
              <button
                type="submit"
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "w-full text-md tracking-wide h-11 md:h-12 font-semibold text-white uppercase bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-700 dark:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 dark:text-gray-100 disabled:opacity-50 disabled:hover:from-blue-600 disabled:hover:to-blue-700 dark:disabled:hover:from-blue-700 dark:disabled:hover:to-blue-800",
                  {
                    "opacity-50": isLoading
                  }
                )}
                disabled={isLoading}
              >
                {isLoading && (
                  <RiLoader2Fill className="size-4 shrink-0 animate-spin" />
                )}
                SIGN UP
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

        <div className="text-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/dashboard/signin"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign In
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
} 