/**
 * Server-side implementation for virtual fields
 */

// GraphQL selection for virtual fields
export function getGraphQLSelection(path, fieldMeta) {
  // Virtual fields require a query to be specified in their field metadata
  return `${path}${fieldMeta?.query || ""}`
}

// Virtual fields don't support filtering
export function transformFilter() {
  return {}
}

// Virtual fields don't have filter types
export function getFilterTypes() {
  return {}
}

// Virtual fields don't have filter labels
export function formatFilterLabel() {
  return ""
}

