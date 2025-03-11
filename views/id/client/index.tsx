"use client"

import { Input } from "@/components/ui/input"

/**
 * Filter component for ID fields
 */
export function Filter({ value, onChange, operator }) {
  const filterTypes = getFilterTypes()
  const filterType = filterTypes[operator]

  const handleChange = (event) => {
    const newValue = event.target.value

    // For list operators (in, not_in), allow commas
    if (operator === "in" || operator === "not_in") {
      onChange(newValue)
      return
    }

    // For single value operators, remove whitespace
    onChange(newValue.trim())
  }

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={
        operator === "in" || operator === "not_in" ? "Enter comma-separated IDs" : filterType?.label || "Enter ID"
      }
      className="w-full font-mono"
    />
  )
}

/**
 * Get available filter types for ID fields
 */
export function getFilterTypes() {
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
 * Cell component for rendering ID values in a list view
 */
export function Cell({ item, field }) {
  const value = item[field.path]
  return value === null ? null : <div className="font-mono">{String(value)}</div>
}

