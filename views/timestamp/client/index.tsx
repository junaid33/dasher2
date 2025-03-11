/**
 * Client-side implementation for timestamp fields
 */
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, parse, isValid } from "date-fns"

const DATE_FORMAT = "yyyy-MM-dd"
const TIME_FORMAT = "HH:mm:ss"
const DATETIME_FORMAT = `${DATE_FORMAT} ${TIME_FORMAT}`

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
  value?: { value: string | null; initial?: string | null; kind: 'update' | 'create' }
  onChange?: (value: { value: string | null; initial?: string | null; kind: 'update' | 'create' }) => void
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

function formatDate(date: string | null): string {
  if (!date) return ""
  return format(new Date(date), DATETIME_FORMAT)
}

function parseDateTime(dateStr: string, timeStr: string): string | null {
  if (!dateStr) return null

  const fullStr = timeStr ? `${dateStr} ${timeStr}` : dateStr

  const parsed = parse(fullStr, DATETIME_FORMAT, new Date())
  return isValid(parsed) ? parsed.toISOString() : null
}

export function Field({ field, value, onChange }: FieldProps) {
  const datetime = value?.value ? new Date(value.value) : null
  const dateValue = datetime ? format(datetime, DATE_FORMAT) : ""
  const timeValue = datetime ? format(datetime, TIME_FORMAT) : ""

  return (
    <div className="grid gap-2">
      <Label>{field.label}</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="date"
            value={dateValue}
            onChange={(e) => {
              const newValue = parseDateTime(e.target.value, timeValue)
              onChange?.({
                kind: "update",
                value: newValue,
                initial: value?.initial,
              })
            }}
          />
        </div>
        <div className="flex-1">
          <Input
            type="time"
            step="1"
            value={timeValue}
            onChange={(e) => {
              const newValue = parseDateTime(dateValue, e.target.value)
              onChange?.({
                kind: "update",
                value: newValue,
                initial: value?.initial,
              })
            }}
          />
        </div>
      </div>
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  )
}

export function Cell({ item, field }: CellProps) {
  const value = item[field.path]
  if (!value) {
    return <span className="text-muted-foreground">No value</span>
  }

  return (
    <time dateTime={value} className="text-sm tabular-nums">
      {formatDate(value)}
    </time>
  )
}

export function Filter({ value, onChange }: FilterProps) {
  return <Input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} className="h-8" />
}

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
      label: "After",
      initialValue: "",
    },
    lt: {
      label: "Before",
      initialValue: "",
    },
    gte: {
      label: "After or equal to",
      initialValue: "",
    },
    lte: {
      label: "Before or equal to",
      initialValue: "",
    },
  }
}

// Filter controller for timestamp fields
export const filter = {
  Filter,
  types: getFilterTypes(),
  Label: ({ label, type, value }: FilterLabelProps) => {
    const filterType = getFilterTypes()[type]
    return filterType ? `${label} ${filterType.label.toLowerCase()}: ${value}` : ""
  },
  graphql: ({ path, type, value }: GraphQLProps) => {
    // Parse the value to a valid ISO date string, return empty if invalid
    const date = new Date(value)
    if (isNaN(date.getTime())) return {}

    const isoString = date.toISOString()

    switch (type) {
      case 'equals':
        return { [path]: { equals: isoString } }
      case 'not_equals':
        return { [path]: { not: { equals: isoString } } }
      case 'gt':
        return { [path]: { gt: isoString } }
      case 'lt':
        return { [path]: { lt: isoString } }
      case 'gte':
        return { [path]: { gte: isoString } }
      case 'lte':
        return { [path]: { lte: isoString } }
      default:
        return {}
    }
  }
}

