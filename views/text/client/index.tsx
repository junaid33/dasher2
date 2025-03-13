/**
 * Client-side implementation for text fields
 */

"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Field {
  path: string
  label: string
  description?: string
  fieldMeta?: {
    isRequired?: boolean;
    displayMode?: "input" | "textarea";
    defaultValue?: any;
    validation?: any;
  }
}

interface FilterProps {
  value: string
  onChange: (value: string) => void
}

interface CellProps {
  item: Record<string, any>
  field: Field
}

interface FieldProps {
  field: Field
  value?: Value
  rawValue?: any
  kind?: 'create' | 'update'
  disabled?: boolean
  autoFocus?: boolean
  forceValidation?: boolean
}

interface FilterLabelProps {
  label: string
  type: keyof FilterTypes
  value: string
}

interface GraphQLProps {
  path: string
  type: keyof FilterTypes
  value: string
}

interface FilterType {
  label: string
  initialValue: string
}

interface FilterTypes {
  contains_i: FilterType
  not_contains_i: FilterType
  equals_i: FilterType
  not_equals_i: FilterType
  starts_with_i: FilterType
  not_starts_with_i: FilterType
  ends_with_i: FilterType
  not_ends_with_i: FilterType
}

type Value =
  | { value: string | null; kind: 'create' }
  | { value: string | null; initial: string | null; kind: 'update' }

// Filter component for text fields
export function Filter({ value, onChange }: FilterProps) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search..."
      className="h-8"
    />
  )
}

// Get available filter types for text fields
export function getFilterTypes(): FilterTypes {
  return {
    contains_i: {
      label: "Contains",
      initialValue: "",
    },
    not_contains_i: {
      label: "Does not contain", 
      initialValue: "",
    },
    equals_i: {
      label: "Equals",
      initialValue: "",
    },
    not_equals_i: {
      label: "Does not equal",
      initialValue: "",
    },
    starts_with_i: {
      label: "Starts with",
      initialValue: "",
    },
    not_starts_with_i: {
      label: "Does not start with",
      initialValue: "",
    },
    ends_with_i: {
      label: "Ends with",
      initialValue: "",
    },
    not_ends_with_i: {
      label: "Does not end with",
      initialValue: "",
    }
  }
}

// Cell renderer for list view
export function Cell({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <div className="flex items-center">
      <span className="truncate">{value || <span className="text-muted-foreground">No value</span>}</span>
    </div>
  )
}

export function Field({ field, rawValue, kind = 'update', disabled, autoFocus, forceValidation, onChange }: FieldProps) {
  const [isDirty, setDirty] = React.useState(false);
  const currentValue = rawValue ?? "";
  const isInvalid = !validate(
    kind === 'update' 
      ? { kind: 'update', value: currentValue, initial: currentValue }
      : { kind: 'create', value: currentValue },
    field.fieldMeta?.isRequired || false
  );
  const errorMessage = isInvalid && (isDirty || forceValidation) ? `${field.label} is required.` : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDirty(true);
  };

  const fieldElement = field.fieldMeta?.displayMode === "textarea" ? (
    <Textarea
      id={field.path}
      name={field.path}
      defaultValue={currentValue}
      onChange={onChange}
      autoFocus={autoFocus}
      disabled={disabled}
      placeholder="Enter text..."
      required={field.fieldMeta?.isRequired}
    />
  ) : (
    <Input
      id={field.path}
      name={field.path}
      type="text"
      defaultValue={currentValue}
      onChange={onChange}
      autoFocus={autoFocus}
      disabled={disabled}
      placeholder="Enter text..."
      required={field.fieldMeta?.isRequired}
    />
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={field.path} className={errorMessage ? "text-destructive" : ""}>
        {field.label}
        {field.fieldMeta?.isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      {fieldElement}
      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : field.description ? (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      ) : null}
    </div>
  );
}

// Filter controller for text fields
export const filter = {
  Filter,
  types: getFilterTypes(),
  Label: ({ label, value }: FilterLabelProps) => {
    return `${label.toLowerCase()}: "${value}"`;
  },
  graphql: ({ path, type, value }: GraphQLProps) => {
    const mode = "insensitive";
    switch (type) {
      case "contains_i": return { [path]: { contains: value, mode } };
      case "not_contains_i": return { [path]: { not: { contains: value }, mode } };
      case "equals_i": return { [path]: { equals: value, mode } };
      case "not_equals_i": return { [path]: { not: { equals: value }, mode } };
      case "starts_with_i": return { [path]: { startsWith: value, mode } };
      case "not_starts_with_i": return { [path]: { not: { startsWith: value }, mode } };
      case "ends_with_i": return { [path]: { endsWith: value, mode } };
      case "not_ends_with_i": return { [path]: { not: { endsWith: value }, mode } };
      default: return {};
    }
  }
}

/**
 * Validate a text field value
 */
function validate(value: Value | undefined, isRequired: boolean) {
  if (!isRequired) return true;
  if (!value) return false;
  
  // If this is an update and the initial value was null, we want to allow saving
  // since the user probably doesn't have read access control
  if (value.kind === 'update' && value.initial === null) return true;
  
  return value.value !== null && value.value !== '';
}

/**
 * Controller for text fields
 */
export const controller = (config: any) => {
  const validation = {
    isRequired: config.fieldMeta?.validation?.isRequired || false,
    length: config.fieldMeta?.validation?.length || { min: null, max: null },
    match: config.fieldMeta?.validation?.match ? {
      regex: new RegExp(config.fieldMeta.validation.match.regex.source, config.fieldMeta.validation.match.regex.flags),
      explanation: config.fieldMeta.validation.match.explanation,
    } : null,
  };
  
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    defaultValue: {
      kind: "create",
      value: config.fieldMeta?.defaultValue || "",
    },
    displayMode: config.fieldMeta?.displayMode || "input",
    isRequired: validation.isRequired,
    deserialize: (data: Record<string, any>) => {
      const value = data[config.path];
      
      return { 
        kind: "update", 
        initial: value,
        value: value
      };
    },
    serialize: (value: Value) => ({
      [config.path]: value.value
    }),
    validation,
    validate: (val: Value) => validate(val, validation.isRequired),
  };
};

