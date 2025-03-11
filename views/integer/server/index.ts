/**
 * Server-side implementation for integer fields
 */

// GraphQL selection for integer fields
export function getGraphQLSelection(path) {
  return path
}

// Transform filter parameters for the GraphQL query
export function transformFilter(path, operator, value) {
  // Remove whitespace and handle comma-separated values
  const valueWithoutWhitespace = value.replace(/\s/g, "")

  // Parse the value based on operator type
  const parsed =
    operator === "in" || operator === "not_in"
      ? valueWithoutWhitespace.split(",").map((x) => Number.parseInt(x))
      : Number.parseInt(valueWithoutWhitespace)

  // Map the operator to its prisma equivalent
  const operatorMap = {
    equals: "equals",
    not_equals: "not.equals",
    gt: "gt",
    gte: "gte",
    lt: "lt",
    lte: "lte",
    in: "in",
    not_in: "notIn",
  }

  const key = operatorMap[operator] || "equals"

  return {
    [path]: {
      [key]: parsed,
    },
  }
}

// Get available filter types for integer fields
export function getFilterTypes() {
  return {
    equals: {
      label: "Is exactly",
      initialValue: "",
    },
    not_equals: {
      label: "Is not exactly",
      initialValue: "",
    },
    gt: {
      label: "Is greater than",
      initialValue: "",
    },
    gte: {
      label: "Is greater than or equal to",
      initialValue: "",
    },
    lt: {
      label: "Is less than",
      initialValue: "",
    },
    lte: {
      label: "Is less than or equal to",
      initialValue: "",
    },
    in: {
      label: "Is in",
      initialValue: "",
    },
    not_in: {
      label: "Is not in",
      initialValue: "",
    },
  }
}

// Format the filter label
export function formatFilterLabel(operator, value) {
  const filterTypes = getFilterTypes()
  const filterType = filterTypes[operator]

  if (!filterType) return ""

  // Handle list operators
  if (operator === "in" || operator === "not_in") {
    const values = value
      .split(",")
      .map((v) => v.trim())
      .join(", ")
    return `${filterType.label.toLowerCase()}: ${values}`
  }

  return `${filterType.label.toLowerCase()}: ${value}`
}

