'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Form from "next/form";
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

// Simple utility for combining class names
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Simple field validation
function useInvalidFields(fields, value) {
  const invalidFields = new Set();

  Object.keys(value).forEach(fieldPath => {
    const val = value[fieldPath];
    if (val.kind === 'value') {
      // Simple validation - check if required fields have values
      if (fields[fieldPath]?.required && !val.value) {
        invalidFields.add(fieldPath);
      }
    }
  });
  
  return invalidFields;
}

// Server action for creating initial admin user
async function createInitialUser(formData, listKey) {
  'use server';
  
  // Convert formData to a regular object
  const data = {};
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  
  const query = `
    mutation($data: CreateInitial${listKey}Input!) {
      authenticate: createInitial${listKey}(data: $data) {
        ... on ${listKey}AuthenticationWithPasswordSuccess {
          item {
            id
          }
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
        variables: { data },
      }),
    });
    
    const result = await response.json();
    
    if (result.errors) {
      return { error: result.errors[0].message };
    }
    
    return { data: result.data };
  } catch (error) {
    return { error: error.message || 'Failed to create initial user' };
  }
}

export default function InitPage() {
  const fieldPaths = ["name", "email", "password"];
  const listKey = "User";
  const enableWelcome = true;
  
  // Define fields with simple validation
  const fields = {
    name: {
      label: "Name",
      type: "text",
      required: true,
      defaultValue: "",
    },
    email: {
      label: "Email",
      type: "email",
      required: true,
      defaultValue: "",
    },
    password: {
      label: "Password",
      type: "password",
      required: true,
      defaultValue: "",
    },
  };

  const [value, setValue] = useState(() => {
    let state = {};
    fieldPaths.forEach((fieldPath) => {
      state[fieldPath] = {
        kind: "value",
        value: fields[fieldPath].defaultValue,
      };
    });
    return state;
  });

  const invalidFields = useInvalidFields(fields, value);
  const [forceValidation, setForceValidation] = useState(false);
  const [mode, setMode] = useState("init");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authData, setAuthData] = useState(null);

  const router = useRouter();

  // Handle successful creation
  useEffect(() => {
    if (!authData) return;

    if (authData.authenticate?.item?.id) {
      // Revalidate the cache
      router.refresh();
      
      if (enableWelcome) {
        setMode("welcome");
      } else {
        router.push('/dashboard');
      }
    }
  }, [authData, router, enableWelcome]);

  const handleFormAction = async (formData) => {
    // Check if there are any invalidFields
    const newForceValidation = invalidFields.size !== 0;
    setForceValidation(newForceValidation);

    // if yes, don't submit the form
    if (newForceValidation) return;

    setIsLoading(true);
    setError(null);
    
    const result = await createInitialUser(formData, listKey);
    
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }
    
    setAuthData(result.data);
  };

  const onComplete = () => {
    router.push('/dashboard');
  };

  const handleFieldChange = (fieldPath, value) => {
    setValue(prev => ({
      ...prev,
      [fieldPath]: {
        kind: "value",
        value,
      },
    }));
  };

  return (
    <div
      className={`h-screen flex justify-center items-center bg-[#0f172a] heropattern-topography-zinc-500/10 dark:bg-background`}
    >
      <div className="flex flex-col gap-2 md:gap-4 basis-[450px] px-2">
        {mode === "init" ? (
          <Form action={handleFormAction}>
            <Card className="overflow-hidden shadow-sm dark:bg-zinc-950">
              <CardHeader>
                <CardTitle className="text-lg font-bold tracking-wide text-slate-600 dark:text-white">
                  CREATE ADMIN
                  <div className="h-1 w-36 mt-0.5 bg-gradient-to-r from-[#9a6a39] to-[#eeba7e] dark:from-[#9a6a39] dark:to-[#9c7952]"></div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4 text-red-800 dark:text-red-300">
                    {error}
                  </div>
                )}
                <div className="grid w-full items-center gap-4">
                  {fieldPaths.map(fieldPath => (
                    <div key={fieldPath} className="flex flex-col space-y-1.5">
                      <Label htmlFor={fieldPath} className="text-md capitalize">
                        {fields[fieldPath].label}
                      </Label>
                      <Input
                        id={fieldPath}
                        name={fieldPath}
                        type={fields[fieldPath].type}
                        value={value[fieldPath].value}
                        onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
                        placeholder={`Enter ${fields[fieldPath].label.toLowerCase()}`}
                        className={`bg-muted ${forceValidation && invalidFields.has(fieldPath) ? 'border-red-500 dark:border-red-500' : ''}`}
                        required={fields[fieldPath].required}
                      />
                      {forceValidation && invalidFields.has(fieldPath) && (
                        <p className="text-red-500 text-sm mt-1">This field is required</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: "secondary" }),
                    "w-full text-md tracking-wide h-11 md:h-12 font-semibold text-white uppercase bg-gradient-to-r from-[#8d5e32] to-[#d7a76e] hover:from-[#7d5322] hover:to-[#c79760] dark:from-[#8d5e32] dark:to-[#a37f53] dark:hover:from-[#7d5322] dark:hover:to-[#c79760] dark:text-gray-100 disabled:opacity-50 disabled:hover:from-[#8d5e32] disabled:hover:to-[#d7a76e] dark:disabled:hover:from-[#8d5e32] dark:disabled:hover:to-[#a37f53]",
                    {
                      "opacity-50": isLoading || authData?.authenticate?.item?.id,
                    }
                  )}
                  disabled={isLoading || authData?.authenticate?.item?.id}
                >
                  {(isLoading || authData?.authenticate?.item?.id) && (
                    <RiLoader2Fill className="size-4 shrink-0 animate-spin" />
                  )}
                  GET STARTED
                </button>
              </CardFooter>
            </Card>
          </Form>
        ) : (
          <Card className="overflow-hidden shadow-sm dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-wide text-slate-600 dark:text-white">
                WELCOME
                <div className="h-1 w-36 mt-0.5 bg-gradient-to-r from-[#9a6a39] to-[#eeba7e] dark:from-[#9a6a39] dark:to-[#9c7952]"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your admin account has been created successfully. You can now access the admin dashboard.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <button
                onClick={onComplete}
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "w-full text-md tracking-wide h-11 md:h-12 font-semibold text-white uppercase bg-gradient-to-r from-[#8d5e32] to-[#d7a76e] hover:from-[#7d5322] hover:to-[#c79760] dark:from-[#8d5e32] dark:to-[#a37f53] dark:hover:from-[#7d5322] dark:hover:to-[#c79760] dark:text-gray-100"
                )}
              >
                CONTINUE TO DASHBOARD
              </button>
            </CardFooter>
          </Card>
        )}

        {error && (
          <Badge color="rose" className="items-start gap-4 border p-4">
            <AlertCircle className="h-5 w-5" />
            <div className="flex flex-col">
              <h2 className="uppercase tracking-wide font-medium">Error</h2>
              <span>{error}</span>
            </div>
          </Badge>
        )}
      </div>
    </div>
  );
} 