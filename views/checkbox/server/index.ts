/**
 * Server-side implementation for checkbox fields
 */

// GraphQL selection for checkbox fields
export function getGraphQLSelection(path) {
  return path
}

// Transform filter parameters for the GraphQL query
export function transformFilter(path, operator, value) {
  // Convert string 'true'/'false' to boolean
  const boolValue = value === "true"

  // Handle the 'not' operator
  if (operator === "not") {
    return {
      [path]: {
        not: { equals: boolValue },
      },
    }
  }

  // Default to equality check
  return {
    [path]: {
      equals: boolValue,
    },
  }
}

// Get available filter types for checkbox fields
export function getFilterTypes() {
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

// Format the filter label
export function formatFilterLabel(operator, value) {
  const isChecked = value === "true"

  if (operator === "not") {
    return isChecked ? "is not checked" : "is checked"
  }

  return isChecked ? "is checked" : "is not checked"
}

