/**
 * Server-side implementation for select fields
 */

// GraphQL selection for select fields
export function getGraphQLSelection(path) {
  return path
}

// Transform filter parameters for the GraphQL query
export function transformFilter(path, operator, value) {
  const isNot = operator.startsWith("not_")

  // Parse the value if it's a JSON string
  let values
  try {
    values = JSON.parse(value)
  } catch (e) {
    values = [value]
  }

  // Map the operator to its prisma equivalent
  const operatorMap = {
    in: "in",
    not_in: "notIn",
    equals: "equals",
    not_equals: "not.equals",
  }

  const key = operatorMap[operator] || "in"

  // For single value operators
  if (key === "equals" || key === "not.equals") {
    return {
      [path]: {
        [key]: values[0],
      },
    }
  }

  // For multi-value operators
  return {
    [path]: {
      [key]: values,
    },
  }
}

// Get available filter types for select fields
export function getFilterTypes() {
  return {
    in: {
      label: "Is any of",
      initialValue: [],
    },
    not_in: {
      label: "Is none of",
      initialValue: [],
    },
    equals: {
      label: "Is exactly",
      initialValue: "",
    },
    not_equals: {
      label: "Is not",
      initialValue: "",
    },
  }
}

// Format the filter label
export function formatFilterLabel(operator, value) {
  const filterTypes = getFilterTypes()
  const filterType = filterTypes[operator]

  if (!filterType) return ""

  let values
  try {
    values = JSON.parse(value)
  } catch (e) {
    values = [value]
  }

  if (values.length === 0) {
    return operator === "not_in" ? "is set" : "has no value"
  }

  if (values.length > 1) {
    const valueList = values.join(", ")
    return operator === "not_in" ? `is not in [${valueList}]` : `is in [${valueList}]`
  }

  return operator === "not_equals" ? `is not ${values[0]}` : `is ${values[0]}`
}

