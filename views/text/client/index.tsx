/**
 * Client-side implementation for text fields
 */

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Field {
  path: string
  label: string
  description?: string
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
  value?: { value: string; initial?: string; kind: 'update' | 'create' }
  onChange?: (value: { value: string; initial?: string; kind: 'update' | 'create' }) => void
}

interface FilterLabelProps {
  label: string
  type: keyof FilterTypes
  value: string
}

interface GraphQLProps {
  path: string
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

export function Field({ field, value, onChange }: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={field.path}>{field.label}</Label>
      <Input
        id={field.path}
        type="text"
        value={value?.value || ""}
        onChange={(e) =>
          onChange?.({
            kind: "update",
            value: e.target.value,
            initial: value?.initial,
          })
        }
      />
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  )
}

// Filter controller for text fields
export const filter = {
  Filter,
  types: getFilterTypes(),
  Label: ({ label, value }: FilterLabelProps) => {
    return `${label.toLowerCase()}: "${value}"`;
  },
  graphql: ({ path, type, value }: GraphQLProps) => {
    switch (type) {
      case 'contains_i':
        return { [path]: { contains: value, mode: 'insensitive' } }
      case 'not_contains_i':
        return { [path]: { not: { contains: value }, mode: 'insensitive' } }
      case 'equals_i':
        return { [path]: { equals: value, mode: 'insensitive' } }
      case 'not_equals_i':
        return { [path]: { not: { equals: value }, mode: 'insensitive' } }
      case 'starts_with_i':
        return { [path]: { startsWith: value, mode: 'insensitive' } }
      case 'not_starts_with_i':
        return { [path]: { not: { startsWith: value }, mode: 'insensitive' } }
      case 'ends_with_i':
        return { [path]: { endsWith: value, mode: 'insensitive' } }
      case 'not_ends_with_i':
        return { [path]: { not: { endsWith: value }, mode: 'insensitive' } }
      default:
        return {}
    }
  }
}

