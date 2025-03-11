"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/**
 * Filter component for password fields
 */
export function Filter({ value, onChange }) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={onChange} className="justify-start">
      <ToggleGroupItem value="true" className="text-xs">
        Set
      </ToggleGroupItem>
      <ToggleGroupItem value="false" className="text-xs">
        Not Set
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

/**
 * Get available filter types for password fields
 */
export function getFilterTypes() {
  return {
    is: {
      label: "Is set",
      initialValue: "true",
    },
    not: {
      label: "Is not set",
      initialValue: "true",
    },
  }
}

/**
 * Cell component for rendering password status in a list view
 */
export function Cell({ item, field }) {
  const value = item[field.path]

  if (!value) return "Not set"

  return value.isSet === null ? "Access denied" : value.isSet ? "Is set" : "Is not set"
}

