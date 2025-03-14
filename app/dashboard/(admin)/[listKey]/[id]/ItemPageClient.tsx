"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, CircleAlert, X, Undo2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BadgeButton } from "@/components/ui/badge-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ItemFormFields } from "./ItemFormFields";
import { updateItemData } from "@/lib/utils/updateItemData";
import { deleteItemData } from "@/lib/utils/deleteItemData";
import { deserializeValue, DeserializedValue } from "@/lib/utils/deserializeValue";
import { useChangedFields } from "@/lib/utils/useChangedFields";
import { useInvalidFields } from "@/lib/utils/useInvalidFields";

interface ItemPageClientProps {
  list: List;
  item: any;
  id: string;
  searchParams: Record<string, any>;
}

interface Field {
  path: string;
  label: string;
  viewsIndex: number;
  description?: string;
  fieldMeta?: {
    validation?: {
      isRequired?: boolean;
      length?: { min: number | null; max: number | null };
      match?: { regex: RegExp; explanation?: string };
    };
    defaultValue?: any;
    isNullable?: boolean;
    options?: Array<{ value: any; label: string }>;
  };
  itemView?: {
    fieldMode?: string;
    fieldPosition?: string;
  };
}

interface List {
  key: string;
  path: string;
  label: string;
  singular: string;
  description?: string;
  labelField: string;
  fields: Record<string, Field>;
}

// Helper function to format values for display
function formatValue(value: any): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return '[Complex Object]';
    }
  }
  return String(value);
}

function ErrorDisplay({ title, message, list }: { title: string; message: string; list?: { path: string; label: string } }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-red-600">{title}</h1>
      <p className="mt-2 text-gray-600">{message}</p>
      {list && (
        <Link href={`/${list.path}`}>
          <Button variant="outline" className="mt-4">Back to {list.label}</Button>
        </Link>
      )}
    </div>
  );
}

export function ItemPageClient({ list, item, id, searchParams }: ItemPageClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastState, setToastState] = useState<'initial' | 'loading' | 'success'>('initial');
  const [forceValidation, setForceValidation] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(true);
  
  // Deserialize the initial values
  const initialFormValue = deserializeValue(list.fields, item);
  const [formValue, setFormValue] = useState<DeserializedValue>(initialFormValue);

  // Get fields for the form
  const fields = list.fields || {};
  
  // Create a map of current values for debugging
  const currentValues: Record<string, any> = {};
  const initialValues: Record<string, any> = {};
  
  Object.entries(formValue).forEach(([key, value]) => {
    currentValues[key] = value.kind === 'value' ? value.value : null;
  });
  
  Object.entries(initialFormValue).forEach(([key, value]) => {
    initialValues[key] = value.kind === 'value' ? value.value : null;
  });
  
  // Use the useChangedFields hook to calculate changed fields
  const { changedFields: changedFieldsSet, dataForUpdate } = useChangedFields(
    fields,
    initialFormValue,
    formValue
  );
  
  const invalidFields = useInvalidFields(fields, formValue);
  
  // Filter fields based on their itemView.fieldMode
  const allFields = Object.values(fields).filter(field => field.itemView?.fieldMode !== "hidden");
  const formFields = allFields.filter(f => (f.itemView?.fieldPosition || "form") === "form");
  const sidebarFields = allFields.filter(f => (f.itemView?.fieldPosition || "form") === "sidebar");
  
  // Handle field changes
  const handleChange = useCallback((fieldPath: string) => (newValue: any) => {
    setFormValue(prev => {
      const updatedValue = {
        ...prev,
        [fieldPath]: { kind: 'value' as const, value: newValue.value }
      };
      return updatedValue;
    });
  }, []);
  
  // Handle form submission
  const handleSave = async () => {
    if (invalidFields.size > 0) {
      setForceValidation(true);
      return;
    }
    
    try {
      setToastState('loading');
      await updateItemData(list.key, id, dataForUpdate);
      setToastState('success');
      
      // Reset toast state after a delay
      setTimeout(() => {
        setToastState('initial');
      }, 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the item.");
      setToastState('initial');
    }
  };
  
  // Handle form reset
  const handleReset = () => {
    setFormValue(initialFormValue);
    setForceValidation(false);
  };
  
  // Handle item deletion
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteItemData(list.key, id);
      router.push(`/${list.path}`);
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting the item.");
      setIsDeleting(false);
    }
  };
  
  if (error) {
    return <ErrorDisplay 
      title="Error" 
      message={error} 
      list={{ path: list.path, label: list.label }}
    />;
  }
  
  const itemLabel = item[list.labelField] || item.id;
  const hasChangedFields = changedFieldsSet.size > 0;
  
  return (
    <section className="flex flex-col">
      <div className="flex flex-col p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-col">
            <h1 className="text-lg font-semibold md:text-2xl">Manage {itemLabel}</h1>
            <p className="text-muted-foreground">
              {list.description || `Update or delete this ${list.singular.toLowerCase()}`}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {/* Debug toggle */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDebugInfo(!showDebugInfo)}
            >
              {showDebugInfo ? "Hide Debug Info" : "Show Debug Info"}
            </Button>
            
            {/* Delete Button with Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="relative pe-12" size="sm" variant="destructive" data-delete-trigger>
                  Delete
                  <span className="pointer-events-none absolute inset-y-0 end-0 flex w-9 items-center justify-center bg-primary-foreground/15">
                    <X className="opacity-60" size={16} strokeWidth={2} />
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border">
                    <CircleAlert className="opacity-80" size={16} strokeWidth={2} />
                  </div>
                  <DialogHeader>
                    <DialogTitle className="text-sm line-clamp-3">Are you sure you want to delete {itemLabel}?</DialogTitle>
                    <DialogDescription className="mt-1">This action cannot be undone.</DialogDescription>
                  </DialogHeader>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button className="rounded-lg" variant="outline">Cancel</Button></DialogClose>
                  <Button 
                    className="rounded-lg" 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Spinner size="sm" className="mr-2" /> : null}
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Save Button */}
            <Button 
              className="relative pe-12" 
              size="sm" 
              disabled={!hasChangedFields || invalidFields.size > 0 || toastState === 'loading'}
              onClick={handleSave}
            >
              {toastState === 'loading' ? <Spinner size="sm" className="mr-2" /> : null}
              Save changes
              <span className="pointer-events-none absolute inset-y-0 end-0 flex w-9 items-center justify-center bg-primary-foreground/15">
                <Check className="opacity-60" size={16} strokeWidth={2} />
              </span>
            </Button>
            
            {/* Reset Button */}
            {hasChangedFields && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Changed Fields Summary */}
        {showDebugInfo && changedFieldsSet.size > 0 && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-semibold mb-2">Changed Fields ({changedFieldsSet.size})</h3>
            <div className="space-y-2">
              {Array.from(changedFieldsSet).map(fieldPath => {
                const field = fields[fieldPath];
                const initialVal = initialValues[fieldPath];
                const currentVal = currentValues[fieldPath];
                
                return (
                  <div key={fieldPath} className="bg-white p-3 rounded border border-blue-100">
                    <div className="font-medium text-sm">{field?.label || fieldPath}</div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Initial Value:</div>
                        <div className="font-mono bg-gray-100 p-1 rounded text-xs overflow-auto max-h-24">
                          {formatValue(initialVal)}
                        </div>
                        <div className="text-xs font-medium text-gray-500 mt-2 mb-1">Raw Value:</div>
                        <pre className="font-mono bg-gray-50 p-1 rounded text-xs overflow-auto max-h-24 border border-gray-200">
                          {JSON.stringify(initialVal, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Current Value:</div>
                        <div className="font-mono bg-blue-100 p-1 rounded text-xs overflow-auto max-h-24">
                          {formatValue(currentVal)}
                        </div>
                        <div className="text-xs font-medium text-gray-500 mt-2 mb-1">Raw Value:</div>
                        <pre className="font-mono bg-blue-50 p-1 rounded text-xs overflow-auto max-h-24 border border-blue-200">
                          {JSON.stringify(currentVal, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Form and Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="space-y-8">
              <ItemFormFields 
                fields={formFields} 
                itemData={item} 
                kind="update" 
                onChange={handleChange}
                forceValidation={forceValidation}
                initialValues={initialValues}
                currentValues={currentValues}
                showDebugInfo={showDebugInfo}
                changedFields={changedFieldsSet}
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Item ID</label>
                <code className="py-[9px] border flex px-4 items-center rounded-md shadow-sm bg-muted/40 font-mono text-sm font-medium">
                  {item.id}
                </code>
              </div>
              <ItemFormFields 
                fields={sidebarFields} 
                itemData={item} 
                kind="update" 
                onChange={handleChange}
                forceValidation={forceValidation}
                initialValues={initialValues}
                currentValues={currentValues}
                showDebugInfo={showDebugInfo}
                changedFields={changedFieldsSet}
              />
            </div>
          </div>
        </div>
        
        {/* Floating Action Button (Mobile) */}
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 md:hidden">
          <div className="flex items-center gap-x-1 rounded-full bg-zinc-950 p-1 text-sm shadow-xl shadow-black/20 ring-1 ring-white/10">
            {toastState === 'loading' ? (
              <div className="flex items-center gap-x-2 whitespace-nowrap rounded-full bg-zinc-900 py-2 px-4 font-semibold text-zinc-50 ring-1 ring-inset ring-white/20">
                <Spinner size="sm" />
                <span className="text-sm font-medium whitespace-nowrap">Saving...</span>
              </div>
            ) : toastState === 'success' ? (
              <BadgeButton color="emerald" className="flex items-center gap-x-2 whitespace-nowrap rounded-full py-2 px-4 font-semibold ring-1 ring-emerald-600/30">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium whitespace-nowrap">Changes Saved</span>
              </BadgeButton>
            ) : (
              <>
                {/* Delete button */}
                <a
                  className="flex items-center gap-x-2 whitespace-nowrap rounded-l-[20px] rounded-r-md bg-zinc-900 py-2 pl-4 pr-2 font-semibold text-zinc-50 ring-1 ring-inset ring-white/20 hover:bg-zinc-800/90 hover:text-white transition-colors"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    // Open delete dialog
                    const deleteButton = document.querySelector(
                      "[data-delete-trigger]"
                    );
                    if (deleteButton) {
                      (deleteButton as HTMLButtonElement).click();
                    }
                  }}
                >
                  <X className="-ml-1 size-5 shrink-0" />
                  Delete
                </a>

                {/* Reset button - shown only when there are changes */}
                {hasChangedFields && (
                  <a
                    className="flex items-center gap-x-2 whitespace-nowrap rounded-md bg-zinc-900 py-2 px-4 font-semibold text-zinc-50 ring-1 ring-inset ring-white/20 hover:bg-zinc-800/90 hover:text-white transition-colors"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleReset();
                    }}
                  >
                    <Undo2 className="-ml-1 size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                    Reset
                  </a>
                )}

                {/* Save button - always shown, disabled when no changes */}
                <button
                  className={`group flex items-center gap-0.5 whitespace-nowrap rounded-l-md rounded-r-[20px] px-4 py-2 font-semibold ring-1 ring-inset transition-all duration-200 ${
                    hasChangedFields && invalidFields.size === 0
                      ? "bg-gradient-to-b from-white to-zinc-200 text-zinc-900 ring-indigo-400/30 cursor-pointer hover:shadow-md hover:bg-white"
                      : "bg-zinc-800 text-zinc-400 ring-white/10 cursor-not-allowed opacity-80"
                  }`}
                  onClick={handleSave}
                  disabled={!hasChangedFields || invalidFields.size > 0}
                >
                  Save changes
                  <Check
                    className="-mr-1 ml-1.5 stroke-[1.5px] transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    width="11"
                    height="11"
                    aria-hidden="true"
                  />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 