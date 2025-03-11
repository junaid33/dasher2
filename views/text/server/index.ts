/**
 * Server-side implementation for text fields
 */

// GraphQL selection for text fields
export function getGraphQLSelection(path) {
  return path
}

// Transform filter parameters for the GraphQL query
export function transformFilter(path, operator, value) {
  const isNot = operator.startsWith("not_")
  const isCaseInsensitive = operator.endsWith("_i")

  // Remove _i suffix and not_ prefix to get the base operator
  const baseOperator = operator.replace(/_i$/, "").replace(/^not_/, "")

  // Map the operator to its prisma equivalent
  const operatorMap = {
    contains: "contains",
    starts_with: "startsWith",
    ends_with: "endsWith",
    is: "equals",
  }

  const key = operatorMap[baseOperator] || "equals"
  const filter = { [key]: value }

  return {
    [path]: {
      ...(isNot ? { not: filter } : filter),
      mode: isCaseInsensitive ? "insensitive" : undefined,
    },
  }
}

// Get available filter types for text fields
export function getFilterTypes() {
  return {
    contains_i: {
      label: "Contains",
      initialValue: "",
    },
    not_contains_i: {
      label: "Does not contain",
      initialValue: "",
    },
    is_i: {
      label: "Is exactly",
      initialValue: "",
    },
    not_i: {
      label: "Is not exactly",
      initialValue: "",
    },
    starts_with_i: {
      label: "Starts with",
      initialValue: "",
    },
    not_starts_with_i: {
      label: "Does not start with",
      initialValue: "",
    },
    ends_with_i: {
      label: "Ends with",
      initialValue: "",
    },
    not_ends_with_i: {
      label: "Does not end with",
      initialValue: "",
    },
  }
}

// Format the filter label
export function formatFilterLabel(operator, value) {
  const filterTypes = getFilterTypes()
  const filterType = filterTypes[operator]
  return filterType ? `${filterType.label.toLowerCase()}: "${value}"` : ""
}

