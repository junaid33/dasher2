/**
 * Server-side implementation for password fields
 */

// GraphQL selection for password fields
export function getGraphQLSelection(path) {
  return `${path} { isSet }`
}

// Transform filter parameters for the GraphQL query
export function transformFilter(path, operator, value) {
  // For password fields, we can only filter based on whether a password is set or not
  const isSet = value === "true"

  // Handle the 'not' operator
  if (operator === "not") {
    return {
      [path]: {
        isSet: { not: isSet },
      },
    }
  }

  // Default to equality check
  return {
    [path]: {
      isSet: isSet,
    },
  }
}

// Get available filter types for password fields
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

// Format the filter label
export function formatFilterLabel(operator, value) {
  const isSet = value === "true"

  if (operator === "not") {
    return isSet ? "is not set" : "is set"
  }

  return isSet ? "is set" : "is not set"
}

