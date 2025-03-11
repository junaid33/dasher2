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
    precision?: number
  }
}

interface FilterProps {
  type: keyof FilterTypes
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}

interface CellProps {
  value: number | null
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
  is: FilterType
  not: FilterType
  gt: FilterType
  lt: FilterType
  gte: FilterType
  lte: FilterType
  in: FilterType
  not_in: FilterType
}

/**
 * Filter component for float fields
 */
export function Filter({ type, value, onChange, autoFocus }: FilterProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value

    // For list operators (in, not_in), allow commas and decimals
    if (type === "in" || type === "not_in") {
      onChange(newValue.replace(/[^\d.,\s-]/g, ""))
      return
    }

    // For single value operators, only allow decimals
    onChange(newValue.replace(/[^\d.\s-]/g, ""))
  }

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      autoFocus={autoFocus}
      placeholder={type === "in" || type === "not_in" ? "e.g. 1.5, 2.7, 3.0" : "e.g. 1.5"}
      className="w-full"
    />
  )
}

/**
 * Returns available filter types for float fields
 */
export function getFilterTypes(): FilterTypes {
  return {
    is: {
      label: "Is exactly",
      initialValue: "",
    },
    not: {
      label: "Is not exactly",
      initialValue: "",
    },
    gt: {
      label: "Is greater than",
      initialValue: "",
    },
    lt: {
      label: "Is less than",
      initialValue: "",
    },
    gte: {
      label: "Is greater than or equal to",
      initialValue: "",
    },
    lte: {
      label: "Is less than or equal to",
      initialValue: "",
    },
    in: {
      label: "Is one of",
      initialValue: "",
    },
    not_in: {
      label: "Is not one of",
      initialValue: "",
    },
  }
}

/**
 * Cell component for rendering float values in a list view
 */
export function Cell({ value }: CellProps) {
  // Format the float value to a reasonable number of decimal places
  const formattedValue =
    typeof value === "number"
      ? value.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : value

  return <div className="font-mono">{formattedValue}</div>
}

export function Field({ field, value, onChange }: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={field.path}>{field.label}</Label>
      <Input
        id={field.path}
        type="number"
        step="any"
        value={value?.value ?? ""}
        onChange={(e) => {
          const val = e.target.value === "" ? null : Number.parseFloat(e.target.value)
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

// Filter controller for float fields
export const filter = {
  Filter,
  types: getFilterTypes(),
  Label: ({ label, type, value }: FilterLabelProps) => {
    const filterType = getFilterTypes()[type]
    if (!filterType) return ""

    // For list operators, format the list of values
    if (type === "in" || type === "not_in") {
      const values = value.split(",").map((v) => v.trim()).filter(Boolean)
      return `${label} ${filterType.label.toLowerCase()}: ${values.join(", ")}`
    }

    return `${label} ${filterType.label.toLowerCase()}: ${value}`
  },
  graphql: ({ path, type, value }: GraphQLProps) => {
    // For list operators, parse comma-separated values
    if (type === "in" || type === "not_in") {
      const values = value
        .split(",")
        .map((v) => parseFloat(v.trim()))
        .filter((v) => !isNaN(v))

      if (values.length === 0) return {}

      return type === "in"
        ? { [path]: { in: values } }
        : { [path]: { not: { in: values } } }
    }

    // For single value operators, parse single float
    const floatValue = parseFloat(value)
    if (isNaN(floatValue)) return {}

    switch (type) {
      case 'is':
        return { [path]: { equals: floatValue } }
      case 'not':
        return { [path]: { not: { equals: floatValue } } }
      case 'gt':
        return { [path]: { gt: floatValue } }
      case 'lt':
        return { [path]: { lt: floatValue } }
      case 'gte':
        return { [path]: { gte: floatValue } }
      case 'lte':
        return { [path]: { lte: floatValue } }
      default:
        return {}
    }
  }
}

