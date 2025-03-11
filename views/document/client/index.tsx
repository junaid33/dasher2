"use client"

import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/**
 * Filter component for document fields
 */
export function Filter({ value, onChange, operator }) {
  const filterTypes = getFilterTypes()
  const filterType = filterTypes[operator]

  // For boolean operators (is_empty)
  if (operator === "is_empty") {
    return (
      <ToggleGroup type="single" value={value} onValueChange={onChange} className="justify-start">
        <ToggleGroupItem value="true" className="text-xs">
          Empty
        </ToggleGroupItem>
        <ToggleGroupItem value="false" className="text-xs">
          Not Empty
        </ToggleGroupItem>
      </ToggleGroup>
    )
  }

  // For text search operators
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter search text"
      className="w-full"
    />
  )
}

/**
 * Get available filter types for document fields
 */
export function getFilterTypes() {
  return {
    contains: {
      label: "Contains text",
      initialValue: "",
    },
    not_contains: {
      label: "Does not contain text",
      initialValue: "",
    },
    is_empty: {
      label: "Is empty",
      initialValue: "true",
    },
  }
}

/**
 * Helper function to extract text content from document nodes
 */
function extractTextFromDocument(document) {
  if (!document || !Array.isArray(document)) return ""

  return document
    .map((node) => {
      if (typeof node === "string") return node
      if (node.text) return node.text
      if (node.children) return extractTextFromDocument(node.children)
      return ""
    })
    .join(" ")
}

/**
 * Cell component for rendering document content in a list view
 */
export function Cell({ item, field }) {
  const data = item[field.path]

  if (!data || !data.document) {
    return <span className="text-muted-foreground">No content</span>
  }

  let document
  try {
    document = typeof data.document === "string" ? JSON.parse(data.document) : data.document
  } catch (e) {
    return <span className="text-red-600">Invalid document</span>
  }

  const text = extractTextFromDocument(document)
  const preview = text.length > 100 ? text.slice(0, 100) + "..." : text

  return <div className="text-sm">{preview || <span className="text-muted-foreground">Empty document</span>}</div>
}

