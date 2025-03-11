/**
 * Server-side implementation for relationship fields
 */

// GraphQL selection for relationship fields
export function getGraphQLSelection(path, fieldMeta) {
  // For to-many relationships, we need to select both the items and the count
  if (fieldMeta?.many) {
    return `
      ${path} {
        id
        ${fieldMeta.refLabelField || "id"}
      }
      ${path}Count
    `
  }

  // For to-one relationships
  return `${path} {
    id
    ${fieldMeta.refLabelField || "id"}
  }`
}

// Transform filter parameters for the GraphQL query
export function transformFilter(path, operator, value, fieldMeta) {
  // Handle special case for null checks
  if (value === "null") {
    return {
      [path]: operator === "is" ? null : { not: null },
    }
  }

  // For to-many relationships
  if (fieldMeta?.many) {
    switch (operator) {
      case "some":
        return {
          [path]: { some: { id: { in: value.split(",") } } },
        }
      case "none":
        return {
          [path]: { none: { id: { in: value.split(",") } } },
        }
      case "every":
        return {
          [path]: { every: { id: { in: value.split(",") } } },
        }
      default:
        return {}
    }
  }

  // For to-one relationships
  switch (operator) {
    case "is":
      return {
        [path]: { id: { equals: value } },
      }
    case "not":
      return {
        [path]: { id: { not: { equals: value } } },
      }
    case "in":
      return {
        [path]: { id: { in: value.split(",") } },
      }
    case "not_in":
      return {
        [path]: { id: { notIn: value.split(",") } },
      }
    default:
      return {}
  }
}

// Get available filter types for relationship fields
export function getFilterTypes(fieldMeta) {
  // For to-many relationships
  if (fieldMeta?.many) {
    return {
      some: {
        label: "Some match",
        initialValue: "",
      },
      none: {
        label: "None match",
        initialValue: "",
      },
      every: {
        label: "All match",
        initialValue: "",
      },
    }
  }

  // For to-one relationships
  return {
    is: {
      label: "Is",
      initialValue: "",
    },
    not: {
      label: "Is not",
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
export function formatFilterLabel(operator, value, fieldMeta) {
  const filterTypes = getFilterTypes(fieldMeta)
  const filterType = filterTypes[operator]

  if (!filterType) return ""

  // Handle null values
  if (value === "null") {
    return operator === "is" ? "is null" : "is not null"
  }

  // For list operators, format the IDs nicely
  if (["in", "not_in", "some", "none", "every"].includes(operator)) {
    const ids = value.split(",").map((id) => id.trim())
    return `${filterType.label.toLowerCase()}: [${ids.join(", ")}]`
  }

  return `${filterType.label.toLowerCase()}: ${value}`
}

