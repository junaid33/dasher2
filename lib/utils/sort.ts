/**
 * Get the sort configuration from search parameters
 */
export function getSort(list: any, searchParams: any) {
  const sortBy = searchParams.sortBy

  if (!sortBy) {
    // Use initial sort from list if available
    if (list.initialSort && isOrderable(list, list.initialSort.field)) {
      return list.initialSort
    }
    return null
  }

  // Handle descending sort (prefixed with -)
  let direction = "ASC"
  let field = sortBy

  if (sortBy.startsWith("-")) {
    direction = "DESC"
    field = sortBy.substring(1)
  }

  // Verify the field is orderable
  if (!isOrderable(list, field)) {
    return null
  }

  return {
    field,
    direction,
  }
}

/**
 * Check if a field is orderable
 */
function isOrderable(list: any, fieldPath: string) {
  const field = list.fields[fieldPath]
  return field && field.isOrderable
}

