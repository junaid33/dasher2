"use client"

import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { ReactNode } from "react"

interface Field {
  path: string
  label: string
  description?: string
}

interface PrettyDataProps {
  data: unknown
}

interface CellProps {
  item: Record<string, any>
  field: Field
}

interface FieldProps {
  field: Field
  value?: { value: unknown; initial?: unknown; kind: 'update' | 'create' }
}

interface FilterTypes {}

interface FilterLabelProps {
  label: string
  type: string
  value: string
}

interface GraphQLProps {
  path: string
  type: string
  value: string
}

/**
 * Pretty print data for display
 */
function PrettyData({ data }: PrettyDataProps) {
  if (data === null || data === undefined) {
    return <span className="text-muted-foreground">null</span>
  }

  if (typeof data === "object") {
    return <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
  }

  return <span>{String(data)}</span>
}

/**
 * Virtual fields don't support filtering
 */
export function Filter(): null {
  return null
}

/**
 * Virtual fields don't have filter types
 */
export function getFilterTypes(): FilterTypes {
  return {}
}

/**
 * Cell component for rendering virtual field values in a list view
 */
export function Cell({ item, field }: CellProps) {
  const value = item[field.path]

  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">No value</span>
  }

  if (typeof value === "object") {
    return <pre className="text-xs max-w-[300px] truncate">{JSON.stringify(value)}</pre>
  }

  return <span>{String(value)}</span>
}

export function Field({ field, value }: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label>{field.label}</Label>
      <div className="flex items-center gap-4 justify-between border py-2 px-2.5 rounded-md bg-muted/20">
        <div className="break-all">
          {typeof value?.value === "object" ? (
            <pre className="text-sm">{JSON.stringify(value.value, null, 2)}</pre>
          ) : value?.value ? (
            <span>{String(value.value)}</span>
          ) : (
            <span className="text-muted-foreground">No value</span>
          )}
        </div>
        <Badge variant="secondary" className="border border-border rounded-sm text-xs opacity-75">
          READ ONLY
        </Badge>
      </div>
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  )
}

// Virtual fields don't support filtering
export const filter = {
  Filter,
  types: getFilterTypes(),
  Label: ({ label, type, value }: FilterLabelProps): ReactNode => null,
  graphql: ({ path, type, value }: GraphQLProps): Record<string, any> => ({})
}

