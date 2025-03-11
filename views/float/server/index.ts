/**
 * Server-side implementation for float field type
 */

/**
 * Returns the path for GraphQL selection
 */
export function getGraphQLSelection(path) {
  return path
}

/**
 * Transforms filter parameters for GraphQL queries
 */
export function transformFilter(path, operator, value) {
  // Remove whitespace and handle list operators
  const valueWithoutWhitespace = value.replace(/\s/g, "")
  const parsed =
    operator === "in" || operator === "not_in"
      ? valueWithoutWhitespace.split(",").map((x) => Number.parseFloat(x))
      : Number.parseFloat(valueWithoutWhitespace)

  // Map operators to their Prisma equivalents
  const operatorMap = {
    is: "equals",
    not: "not",
    gt: "gt",
    lt: "lt",
    gte: "gte",
    lte: "lte",
    in: "in",
    not_in: "notIn",
  }

  // Handle special case for 'not' operator
  if (operator === "not") {
    return {
      [path]: {
        not: { equals: parsed },
      },
    }
  }

  // Return the transformed filter
  return {
    [path]: {
      [operatorMap[operator]]: parsed,
    },
  }
}

/**
 * Returns available filter types for float fields
 */
export function getFilterTypes() {
  return [
    {
      type: "is",
      label: "Is exactly",
      initialValue: "",
    },
    {
      type: "not",
      label: "Is not exactly",
      initialValue: "",
    },
    {
      type: "gt",
      label: "Is greater than",
      initialValue: "",
    },
    {
      type: "lt",
      label: "Is less than",
      initialValue: "",
    },
    {
      type: "gte",
      label: "Is greater than or equal to",
      initialValue: "",
    },
    {
      type: "lte",
      label: "Is less than or equal to",
      initialValue: "",
    },
    {
      type: "in",
      label: "Is one of",
      initialValue: "",
    },
    {
      type: "not_in",
      label: "Is not one of",
      initialValue: "",
    },
  ]
}

/**
 * Formats the filter label based on operator and value
 */
export function formatFilterLabel(operator, value) {
  // Handle list operators (in, not_in)
  if (["in", "not_in"].includes(operator)) {
    const formattedValue = value
      .split(",")
      .map((v) => v.trim())
      .join(", ")
    return `${operator.replace("_", " ")}: ${formattedValue}`
  }

  // Handle single value operators
  const operatorLabels = {
    is: "is exactly",
    not: "is not exactly",
    gt: "is greater than",
    lt: "is less than",
    gte: "is greater than or equal to",
    lte: "is less than or equal to",
  }

  return `${operatorLabels[operator]}: ${value}`
}

