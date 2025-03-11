/**
 * Server-side implementation for ID fields
 */

// GraphQL selection for ID fields
export function getGraphQLSelection(path) {
  return path
}

// Transform filter parameters for the GraphQL query
export function transformFilter(path, operator, value) {
  // Remove whitespace
  const valueWithoutWhitespace = value.replace(/\s/g, "")

  // Handle list operators (in, not_in)
  if (operator === "in" || operator === "not_in") {
    const values = valueWithoutWhitespace.split(",")
    return {
      [path]: {
        [operator === "in" ? "in" : "notIn"]: values,
      },
    }
  }

  // Handle special case for 'not' operator
  if (operator === "not") {
    return {
      [path]: {
        not: { equals: valueWithoutWhitespace },
      },
    }
  }

  // Map other operators to their Prisma equivalents
  const operatorMap = {
    is: "equals",
    gt: "gt",
    lt: "lt",
    gte: "gte",
    lte: "lte",
  }

  return {
    [path]: {
      [operatorMap[operator] || "equals"]: valueWithoutWhitespace,
    },
  }
}

// Get available filter types for ID fields
export function getFilterTypes() {
  return {
    is: {
      label: "Is exactly",
      initialValue: "",
    },
    not: {
      label: "Is not exactly",
      initialValue: "",
    },
    gt: {
      label: "Is greater than",
      initialValue: "",
    },
    lt: {
      label: "Is less than",
      initialValue: "",
    },
    gte: {
      label: "Is greater than or equal to",
      initialValue: "",
    },
    lte: {
      label: "Is less than or equal to",
      initialValue: "",
    },
    in: {
      label: "Is one of",
      initialValue: "",
    },
    not_in: {
      label: "Is not one of",
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

  // Remove whitespace for display
  const displayValue = value.replace(/\s/g, "")
  return `${filterType.label.toLowerCase()}: ${displayValue}`
}

