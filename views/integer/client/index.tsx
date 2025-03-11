/**
 * Client-side implementation for integer fields
 */

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Field {
  path: string
  label: string
  description?: string
  validation?: {
    min?: number
    max?: number
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
  value?: { value: number | null; initial?: number | null; kind: 'update' | 'create' }
  onChange?: (value: { value: number | null; initial?: number | null; kind: 'update' | 'create' }) => void
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
  equals: FilterType
  not_equals: FilterType
  gt: FilterType
  lt: FilterType
  gte: FilterType
  lte: FilterType
}

// Filter component for integer fields
export function Filter({ value, onChange }: FilterProps) {
  return (
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter number..."
      className="h-8"
    />
  )
}

// Get available filter types for integer fields
export function getFilterTypes(): FilterTypes {
  return {
    equals: {
      label: "Equals",
      initialValue: "",
    },
    not_equals: {
      label: "Does not equal",
      initialValue: "",
    },
    gt: {
      label: "Greater than",
      initialValue: "",
    },
    lt: {
      label: "Less than",
      initialValue: "",
    },
    gte: {
      label: "Greater than or equal to",
      initialValue: "",
    },
    lte: {
      label: "Less than or equal to",
      initialValue: "",
    },
  }
}

// Cell renderer for list view
export function Cell({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <div className="font-mono">
      {value === null ? <span className="text-muted-foreground">No value</span> : value.toLocaleString()}
    </div>
  )
}

export function Field({ field, value, onChange }: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={field.path}>{field.label}</Label>
      <Input
        id={field.path}
        type="number"
        value={value?.value ?? ""}
        onChange={(e) => {
          const val = e.target.value === "" ? null : Number.parseInt(e.target.value, 10)
          onChange?.({
            kind: "update",
            value: val,
            initial: value?.initial,
          })
        }}
        min={field.validation?.min}
        max={field.validation?.max}
      />
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  )
}

// Filter controller for integer fields
export const filter = {
  Filter,
  types: getFilterTypes(),
  Label: ({ label, type, value }: FilterLabelProps) => {
    const filterType = getFilterTypes()[type]
    return filterType ? `${label} ${filterType.label.toLowerCase()}: ${value}` : ""
  },
  graphql: ({ path, type, value }: GraphQLProps) => {
    // Parse the value to integer, return empty if invalid
    const intValue = parseInt(value, 10)
    if (isNaN(intValue)) return {}

    switch (type) {
      case 'equals':
        return { [path]: { equals: intValue } }
      case 'not_equals':
        return { [path]: { not: { equals: intValue } } }
      case 'gt':
        return { [path]: { gt: intValue } }
      case 'lt':
        return { [path]: { lt: intValue } }
      case 'gte':
        return { [path]: { gte: intValue } }
      case 'lte':
        return { [path]: { lte: intValue } }
      default:
        return {}
    }
  }
}

