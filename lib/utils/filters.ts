/**
 * Build a filter object for the GraphQL query based on search parameters
 */
export function buildFilters(list: any, searchParams: any) {
  const filters = {}

  // Process search parameter
  if (searchParams.search) {
    const searchValue = searchParams.search.trim()

    // Check if the search value is a valid ID
    if (isValidId(searchValue, list)) {
      return { id: { equals: searchValue } }
    }

    // Find searchable fields
    const searchFields = Object.entries(list.fields)
      .filter(([_, field]: [string, any]) => field.isFilterable)
      .map(([path]: [string, any]) => path)

    if (searchFields.length > 0) {
      // Create OR filter for all searchable fields
      filters.OR = searchFields.map((fieldPath: string) => ({
        [fieldPath]: { contains: searchValue, mode: "insensitive" },
      }))
    }
  }

  // Process status filter
  if (searchParams.status && searchParams.status !== "all") {
    filters.status = { equals: searchParams.status }
  }

  return filters
}

/**
 * Check if a value is a valid ID for the list
 */
function isValidId(value: string, list: any) {
  // This is a simplified check
  return (
    /^[a-f\d]{24}$/i.test(value) || // MongoDB ObjectId
    /^\d+$/.test(value)
  ) // Integer ID
}

