"use client"

import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/**
 * Filter component for image fields
 */
export function Filter({ value, onChange, operator }) {
  const filterTypes = getFilterTypes()
  const filterType = filterTypes[operator]

  // For boolean operators (is_set)
  if (operator === "is_set") {
    return (
      <ToggleGroup type="single" value={value} onValueChange={onChange} className="justify-start">
        <ToggleGroupItem value="true" className="text-xs">
          Has Image
        </ToggleGroupItem>
        <ToggleGroupItem value="false" className="text-xs">
          No Image
        </ToggleGroupItem>
      </ToggleGroup>
    )
  }

  // For extension filters
  if (operator === "extension" || operator === "not_extension") {
    return (
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase())}
        placeholder="e.g. jpg, png, gif"
        className="w-full"
      />
    )
  }

  // For filesize filters
  if (operator === "filesize_lt" || operator === "filesize_gt") {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Size in bytes"
        className="w-full"
      />
    )
  }

  return null
}

/**
 * Get available filter types for image fields
 */
export function getFilterTypes() {
  return {
    is_set: {
      label: "Has image",
      initialValue: "true",
    },
    extension: {
      label: "Has extension",
      initialValue: "",
    },
    not_extension: {
      label: "Does not have extension",
      initialValue: "",
    },
    filesize_lt: {
      label: "File size is less than",
      initialValue: "",
    },
    filesize_gt: {
      label: "File size is greater than",
      initialValue: "",
    },
  }
}

/**
 * Cell component for rendering image thumbnails in a list view
 */
export function Cell({ item, field }) {
  const data = item[field.path]

  if (!data) {
    return <span className="text-muted-foreground">No image</span>
  }

  return (
    <div className="relative h-8 w-8 overflow-hidden rounded-sm border bg-muted">
      <img src={data.url || "/placeholder.svg"} alt={data.id} className="h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 ring-1 ring-inset ring-black/10" />
    </div>
  )
}

