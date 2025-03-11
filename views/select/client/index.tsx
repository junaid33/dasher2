/**
 * Client-side implementation for select fields
 */

"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Option {
  value: string
  label: string
}

interface Field {
  path: string
  label: string
  description?: string
  options?: Option[]
}

interface FilterProps {
  value: string
  onChange: (value: string) => void
  operator: keyof FilterTypes
  field: Field
}

interface CellProps {
  item: Record<string, any>
  field: Field
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
  initialValue: string | string[]
}

interface FilterTypes {
  in: FilterType
  not_in: FilterType
  equals: FilterType
  not_equals: FilterType
}

// Filter component for select fields
export function Filter({ value, onChange, operator, field }: FilterProps) {
  const filterTypes = getFilterTypes()
  const filterType = filterTypes[operator]
  const options = field.options || []

  // Parse current value
  let currentValue: string[]
  try {
    currentValue = JSON.parse(value)
  } catch (e) {
    currentValue = value ? [value] : []
  }

  // For single-select operators
  if (operator === "equals" || operator === "not_equals") {
    return (
      <Select
        value={currentValue[0] || ""}
        onValueChange={(value) => {
          onChange(JSON.stringify([value]))
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={filterType?.label || "Select value"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // For multi-select operators
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={currentValue.includes(option.value)}
            onChange={(e) => {
              const newValue = e.target.checked
                ? [...currentValue, option.value]
                : currentValue.filter((v) => v !== option.value)
              onChange(JSON.stringify(newValue))
            }}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm">{option.label}</span>
        </label>
      ))}
    </div>
  )
}

// Get available filter types for select fields
export function getFilterTypes(): FilterTypes {
  return {
    in: {
      label: "Is any of",
      initialValue: [],
    },
    not_in: {
      label: "Is none of",
      initialValue: [],
    },
    equals: {
      label: "Is exactly",
      initialValue: "",
    },
    not_equals: {
      label: "Is not",
      initialValue: "",
    },
  }
}

// Cell renderer for list view
export function Cell({ item, field }: CellProps) {
  const value = item[field.path]
  if (value === null) return null

  const option = field.options?.find((opt) => opt.value === value)
  return option ? option.label : String(value)
}

// Filter controller for select fields
export const filter = {
  Filter,
  types: getFilterTypes(),
  Label: ({ label, type, value }: FilterLabelProps) => {
    const filterType = getFilterTypes()[type]
    if (!filterType) return ""

    let values: string[]
    try {
      values = JSON.parse(value)
    } catch (e) {
      values = value ? [value] : []
    }

    return `${label} ${filterType.label.toLowerCase()}: ${values.join(", ")}`
  },
  graphql: ({ path, type, value }: GraphQLProps) => {
    let values: string[]
    try {
      values = JSON.parse(value)
    } catch (e) {
      values = value ? [value] : []
    }

    if (values.length === 0) return {}

    switch (type) {
      case 'equals':
        return { [path]: { equals: values[0] } }
      case 'not_equals':
        return { [path]: { not: { equals: values[0] } } }
      case 'in':
        return { [path]: { in: values } }
      case 'not_in':
        return { [path]: { not: { in: values } } }
      default:
        return {}
    }
  }
}

