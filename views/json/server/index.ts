/**
 * Server-side implementation for JSON fields
 */

// GraphQL selection for JSON fields
export function getGraphQLSelection(path) {
  return path
}

// Transform filter parameters for the GraphQL query
export function transformFilter(path, operator, value) {
  // For JSON fields, we only support basic equality checks
  // and checking for null/not null values

  // Handle special case for null checks
  if (value === "null") {
    return {
      [path]: operator === "is" ? null : { not: null },
    }
  }

  try {
    // Try to parse the value as JSON
    const parsedValue = JSON.parse(value)

    // Handle the 'not' operator
    if (operator === "not") {
      return {
        [path]: {
          not: { equals: parsedValue },
        },
      }
    }

    // Default to equality check
    return {
      [path]: {
        equals: parsedValue,
      },
    }
  } catch (e) {
    // If parsing fails, treat it as a string search
    return {
      [path]: {
        contains: value,
      },
    }
  }
}

// Get available filter types for JSON fields
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

// Format the filter label
export function formatFilterLabel(operator, value) {
  const filterTypes = getFilterTypes()
  const filterType = filterTypes[operator]

  if (!filterType) return ""

  // Handle null values
  if (value === "null") {
    return operator === "is" ? "is null" : "is not null"
  }

  try {
    // Try to format as JSON
    const parsedValue = JSON.parse(value)
    const displayValue = JSON.stringify(parsedValue)
    return `${filterType.label.toLowerCase()}: ${displayValue}`
  } catch (e) {
    // If parsing fails, display as is
    return `${filterType.label.toLowerCase()}: "${value}"`
  }
}

