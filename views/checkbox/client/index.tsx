"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { type CheckedState } from "@radix-ui/react-checkbox"

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
  value?: { value: boolean | null; initial?: boolean | null; kind: 'update' | 'create' }
  onChange?: (value: { value: boolean | null; initial?: boolean | null; kind: 'update' | 'create' }) => void
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
}

/**
 * Filter component for checkbox fields
 */
export function Filter({ value, onChange }: FilterProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="checkbox-filter"
        checked={value === "true"}
        onCheckedChange={(checked) => onChange(String(checked))}
      />
      <Label htmlFor="checkbox-filter" className="text-sm">
        Checked
      </Label>
    </div>
  )
}

/**
 * Get available filter types for checkbox fields
 */
export function getFilterTypes(): FilterTypes {
  return {
    is: {
      label: "Is checked",
      initialValue: "true",
    },
    not: {
      label: "Is not checked",
      initialValue: "true",
    },
  }
}

/**
 * Cell component for rendering checkbox values in a list view
 */
export function Cell({ item, field }: CellProps) {
  const value = !!item[field.path]

  return (
    <div className="flex items-center gap-2">
      <Checkbox checked={value} disabled />
      <span className="text-sm text-muted-foreground">{value ? "Yes" : "No"}</span>
    </div>
  )
}

export function Field({ field, value, onChange }: FieldProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={field.path}
        checked={value?.value ?? false}
        onCheckedChange={(checked: CheckedState) =>
          onChange?.({
            kind: "update",
            value: checked === true ? true : checked === false ? false : null,
            initial: value?.initial,
          })
        }
      />
      <div className="grid gap-1.5 leading-none">
        <Label htmlFor={field.path}>{field.label}</Label>
        {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
      </div>
    </div>
  )
}

// Filter controller for checkbox fields
export const filter = {
  Filter,
  types: getFilterTypes(),
  Label: ({ label, type, value }: FilterLabelProps) => {
    const filterType = getFilterTypes()[type]
    return filterType ? `${label} ${filterType.label.toLowerCase()}` : ""
  },
  graphql: ({ path, type, value }: GraphQLProps) => {
    const isChecked = value === "true"

    switch (type) {
      case 'is':
        return { [path]: { equals: isChecked } }
      case 'not':
        return { [path]: { not: { equals: isChecked } } }
      default:
        return {}
    }
  }
}

