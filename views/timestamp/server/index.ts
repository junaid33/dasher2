/**
 * Server-side implementation for timestamp fields
 */

// GraphQL selection for timestamp fields
export function getGraphQLSelection(path) {
  return path
}

// Transform filter parameters for the GraphQL query
export function transformFilter(path, operator, value) {
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

  // For list operators (in, not_in), parse the comma-separated values
  if (operator === "in" || operator === "not_in") {
    const dates = value.split(",").map((date) => date.trim())
    return {
      [path]: {
        [key]: dates,
      },
    }
  }

  // For single value operators
  return {
    [path]: {
      [key]: value,
    },
  }
}

// Get available filter types for timestamp fields
export function getFilterTypes() {
  return {
    equals: {
      label: "Is exactly",
      initialValue: "",
    },
    not_equals: {
      label: "Is not",
      initialValue: "",
    },
    gt: {
      label: "Is after",
      initialValue: "",
    },
    gte: {
      label: "Is after or equal to",
      initialValue: "",
    },
    lt: {
      label: "Is before",
      initialValue: "",
    },
    lte: {
      label: "Is before or equal to",
      initialValue: "",
    },
    in: {
      label: "Is any of",
      initialValue: "",
    },
    not_in: {
      label: "Is none of",
      initialValue: "",
    },
  }
}

// Format the filter label
export function formatFilterLabel(operator, value) {
  const filterTypes = getFilterTypes()
  const filterType = filterTypes[operator]

  if (!filterType) return ""

  // Format the date(s) for display
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch (e) {
      return dateStr
    }
  }

  // Handle list operators
  if (operator === "in" || operator === "not_in") {
    const dates = value
      .split(",")
      .map((date) => formatDate(date.trim()))
      .join(", ")
    return `${filterType.label.toLowerCase()}: ${dates}`
  }

  return `${filterType.label.toLowerCase()}: ${formatDate(value)}`
}

