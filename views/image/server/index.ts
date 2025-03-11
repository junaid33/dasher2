/**
 * Server-side implementation for image fields
 */

// GraphQL selection for image fields
export function getGraphQLSelection(path) {
  return `${path} {
    url
    id
    extension
    width
    height
    filesize
  }`
}

// Transform filter parameters for the GraphQL query
export function transformFilter(path, operator, value) {
  // Handle special case for null checks
  if (value === "null") {
    return {
      [path]: operator === "is" ? null : { not: null },
    }
  }

  // For image fields, we can only filter based on whether an image exists or not
  // and basic file properties like extension and filesize
  switch (operator) {
    case "is_set":
      return {
        [path]: value === "true" ? { not: null } : null,
      }
    case "extension":
      return {
        [path]: {
          extension: { equals: value },
        },
      }
    case "not_extension":
      return {
        [path]: {
          extension: { not: { equals: value } },
        },
      }
    case "filesize_lt":
      return {
        [path]: {
          filesize: { lt: Number.parseInt(value) },
        },
      }
    case "filesize_gt":
      return {
        [path]: {
          filesize: { gt: Number.parseInt(value) },
        },
      }
    default:
      return {}
  }
}

// Get available filter types for image fields
export function getFilterTypes() {
  return {
    is_set: {
      label: "Has image",
      initialValue: "true",
    },
    extension: {
      label: "Has extension",
      initialValue: "",
    },
    not_extension: {
      label: "Does not have extension",
      initialValue: "",
    },
    filesize_lt: {
      label: "File size is less than",
      initialValue: "",
    },
    filesize_gt: {
      label: "File size is greater than",
      initialValue: "",
    },
  }
}

// Format the filter label
export function formatFilterLabel(operator, value) {
  const filterTypes = getFilterTypes()
  const filterType = filterTypes[operator]

  if (!filterType) return ""

  // Handle special cases
  switch (operator) {
    case "is_set":
      return value === "true" ? "has image" : "has no image"
    case "extension":
      return `has extension: ${value}`
    case "not_extension":
      return `does not have extension: ${value}`
    case "filesize_lt":
      return `file size < ${formatFileSize(Number.parseInt(value))}`
    case "filesize_gt":
      return `file size > ${formatFileSize(Number.parseInt(value))}`
    default:
      return `${filterType.label.toLowerCase()}: ${value}`
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

