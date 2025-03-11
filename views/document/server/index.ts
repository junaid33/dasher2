/**
 * Server-side implementation for document fields
 */

// GraphQL selection for document fields
export function getGraphQLSelection(path) {
  return `${path} {
    document
  }`
}

// Transform filter parameters for the GraphQL query
export function transformFilter(path, operator, value) {
  // Handle special case for null checks
  if (value === "null") {
    return {
      [path]: operator === "is" ? null : { not: null },
    }
  }

  // For document fields, we can only filter based on text content
  switch (operator) {
    case "contains":
      return {
        [path]: {
          document: {
            contains: value,
          },
        },
      }
    case "not_contains":
      return {
        [path]: {
          document: {
            not: { contains: value },
          },
        },
      }
    case "is_empty":
      return {
        [path]: value === "true" ? { document: { equals: "[]" } } : { document: { not: { equals: "[]" } } },
      }
    default:
      return {}
  }
}

// Get available filter types for document fields
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

// Format the filter label
export function formatFilterLabel(operator, value) {
  const filterTypes = getFilterTypes()
  const filterType = filterTypes[operator]

  if (!filterType) return ""

  // Handle special cases
  switch (operator) {
    case "is_empty":
      return value === "true" ? "is empty" : "is not empty"
    case "contains":
      return `contains: "${value}"`
    case "not_contains":
      return `does not contain: "${value}"`
    default:
      return `${filterType.label.toLowerCase()}: ${value}`
  }
}

