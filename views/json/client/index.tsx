"use client"

import { Textarea } from "@/components/ui/textarea"

/**
 * Filter component for JSON fields
 */
export function Filter({ value, onChange, operator }) {
  const filterTypes = getFilterTypes()
  const filterType = filterTypes[operator]

  const handleChange = (event) => {
    const newValue = event.target.value
    onChange(newValue)
  }

  return (
    <Textarea
      value={value}
      onChange={handleChange}
      placeholder={operator === "contains" ? "Enter search text" : "Enter valid JSON"}
      className="w-full font-mono text-sm"
      rows={3}
    />
  )
}

/**
 * Get available filter types for JSON fields
 */
export function getFilterTypes() {
  return {
    is: {
      label: "Is exactly",
      initialValue: "",
    },
    not: {
      label: "Is not",
      initialValue: "",
    },
    contains: {
      label: "Contains",
      initialValue: "",
    },
  }
}

/**
 * Cell component for rendering JSON values in a list view
 */
export function Cell({ item, field }) {
  const value = item[field.path]

  if (value === null) return null

  try {
    // If it's already a string, try to parse it first
    const parsedValue = typeof value === "string" ? JSON.parse(value) : value
    const formattedValue = JSON.stringify(parsedValue, null, 2)

    return <div className="font-mono text-sm whitespace-pre-wrap max-h-24 overflow-y-auto">{formattedValue}</div>
  } catch (e) {
    // If parsing fails, display as is
    return <div className="font-mono text-sm text-red-600">Invalid JSON: {String(value)}</div>
  }
}

