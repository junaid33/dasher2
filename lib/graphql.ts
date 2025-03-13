import { getGqlNames } from "./get-names-from-list"
import { buildFilters } from "./utils/filters"
import { getSort } from "./utils/sort"
import { getSelectedFields } from "./utils/fields"
import { getFieldTypeFromViewsIndex, getServerField } from "../views/registry"
import { getAdminMeta } from "./hooks/getAdminMeta"
import { Field, List } from "./hooks/types"

// Helper function to get GraphQL selections for fields
function generateGraphQLSelections(fields: Record<string, Field>): string {
  // Always include id
  const selections = ["id"]

  // Add selections for each field
  Object.entries(fields).forEach(([path, field]) => {
    const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex)
    const serverImpl = getServerField(fieldType)
    // console.log({ fieldType, getGraphQLSelection: serverImpl?.getGraphQLSelection(path, field) });
    if (serverImpl?.getGraphQLSelection) {
      selections.push(serverImpl.getGraphQLSelection(path, field))
    } else {
      selections.push(path)
    }
  })

  return selections.join("\n")
}

// Utility function to fetch data from GraphQL API directly
export async function fetchGraphQL(query: string, variables: Record<string, any> = {}) {
  try {
    // Use the exact endpoint URL
    const endpoint = "http://localhost:3000/api/graphql"

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "cm7pag5lk002s6lq83d747l2j", // Use API key for authentication
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      cache: "no-store", // Disable caching for fresh data
    })

    if (!response.ok) {
      throw new Error(`GraphQL request failed with status ${response.status}`)
    }

    const result = await response.json()

    if (result.errors) {
      throw new Error(result.errors[0].message)
    }

    return result.data
  } catch (error) {
    throw error
  }
}

/**
 * Fetches the complete admin metadata from Keystone
 * This is equivalent to what useKeystone() provides in the client
 * 
 * @deprecated Use getAdminMeta from lib/hooks/getAdminMeta instead
 */
export async function getKeystoneAdminMeta() {
  return getAdminMeta();
}

/**
 * Fetches the complete admin metadata from Keystone with itemView field
 * This is a specialized version that includes the itemView field needed by the admin UI
 * 
 * @deprecated Use getAdminMeta from lib/hooks/getAdminMeta instead
 */
export async function getKeystoneAdminMetaWithItemView() {
  return getAdminMeta();
}

/**
 * Gets a specific list's metadata from the admin metadata
 * This is equivalent to what useList(listKey) does in the client
 * 
 * @deprecated Use getList from lib/hooks/getAdminMeta instead
 */
export async function getList(listKey: string) {
  const adminMeta = await getAdminMeta()
  return adminMeta.lists[listKey];
}

/**
 * Gets the filters from search params
 * This is equivalent to what useFilters() does in the client
 */
export function getFilters(list: List, searchParams: Record<string, any>) {
  const filters: Record<string, any> = {};

  // Handle search parameter
  if (searchParams?.search) {
    // If the list has a labelField, use that for search
    if (list.labelField) {
      filters[list.labelField] = { contains: searchParams.search };
    } else {
      // Otherwise, create an OR filter for all searchable fields
      const searchableFields = Object.entries(list.fields)
        .filter(([_, field]) => field.isFilterable)
        .map(([path]) => path);

      if (searchableFields.length > 0) {
        filters.OR = searchableFields.map((field) => ({
          [field]: { contains: searchParams.search },
        }));
      }
    }
  }

  // Process filter parameters (those starting with !)
  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (!key.startsWith('!')) return;
    
    // Remove ! prefix and split into field and operator
    const [fieldPath, operator] = key.slice(1).split('_');
    const field = list.fields[fieldPath];
    
    if (field && field.isFilterable) {
      const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex);
      const fieldImpl = getServerField(fieldType);
      
      // Parse the JSON value
      let parsedValue;
      try {
        parsedValue = JSON.parse(value as string);
      } catch (e) {
        parsedValue = value;
      }
      
      // Transform the filter using the field's implementation
      if (fieldImpl?.transformFilter) {
        const transformedFilter = fieldImpl.transformFilter(fieldPath, operator, parsedValue);
        Object.assign(filters, transformedFilter);
      }
    }
  });

  return filters;
}

/**
 * Fetches the list data with filtering, sorting, and pagination
 * This is equivalent to the GraphQL query in the ListPage component
 */
export async function getListData(list: List, searchParams: Record<string, any> | URLSearchParams) {
  try {
    // Convert searchParams to a regular object if it's not already
    const searchParamsObj = searchParams instanceof URLSearchParams
      ? Object.fromEntries(searchParams.entries())
      : searchParams;

    // Use the exact gqlNames from the list
    const { listQueryName, listQueryCountName, whereInputName, listOrderName } = list.gqlNames;

    // Get pagination parameters
    const page = Number.parseInt(searchParamsObj?.page || "1", 10);
    const pageSize = Number.parseInt(searchParamsObj?.pageSize || list.pageSize || "50", 10);

    // Get selected fields
    const selectedFieldPaths = getSelectedFields(list, searchParamsObj);

    // Get sort configuration
    const sort = getSort(list, searchParamsObj);

    // Get filters using the getFilters function
    const filters = getFilters(list, searchParamsObj);

    // Filter the fields object to only include selected fields
    const selectedFieldsObj: Record<string, Field> = {};
    selectedFieldPaths.forEach((fieldPath: string) => {
      if (list.fields[fieldPath]) {
        selectedFieldsObj[fieldPath] = list.fields[fieldPath];
      }
    });

    // Generate GraphQL selections for the selected fields
    const graphqlSelections = generateGraphQLSelections(selectedFieldsObj);

    // Construct the GraphQL query based on the list metadata and gqlNames
    const query = `
      query ($where: ${whereInputName}, $orderBy: [${listOrderName}!], $take: Int, $skip: Int) {
        items: ${listQueryName}(where: $where, orderBy: $orderBy, take: $take, skip: $skip) {
          ${graphqlSelections}
        }
        count: ${listQueryCountName}(where: $where)
      }
    `;

    // Prepare variables for the query
    const variables = {
      where: filters,
      orderBy: sort ? [{ [sort.field]: sort.direction.toLowerCase() }] : undefined,
      take: pageSize,
      skip: (page - 1) * pageSize,
    };

    // Execute the query
    const data = await fetchGraphQL(query, variables);

    return {
      items: data.items || [],
      meta: {
        count: data.count || 0,
        currentPage: page,
        pageSize,
        selectedFields: selectedFieldPaths,
        sort,
      },
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Fetches a single item by ID
 */
export async function getItem(list: List, id: string, searchParams: Record<string, any> = {}) {
  try {
    // Use the exact itemQueryName from the list
    const { itemQueryName } = list.gqlNames

    // Get selected fields for the UI
    const selectedFieldPaths = getSelectedFields(list, searchParams)

    // Generate GraphQL selections for ALL fields, not just selected ones
    const allFieldsObj = list.fields
    const graphqlSelections = generateGraphQLSelections(allFieldsObj)

    // Construct the GraphQL query based on the list metadata
    const query = `
      query ($id: ID!) {
        item: ${itemQueryName}(where: { id: $id }) {
          ${graphqlSelections}
        }
      }
    `

    // Execute the query
    const data = await fetchGraphQL(query, { id })

    return {
      item: data.item,
      meta: {
        selectedFields: selectedFieldPaths,
      },
    }
  } catch (error) {
    throw error
  }
}

/**
 * Creates a new item
 */
export async function createItem(list: List, data: Record<string, any>) {
  try {
    const { createMutationName } = list.gqlNames

    // Get all fields that can be created
    const createableFields = Object.entries(list.fields)
      .filter(([_, field]) => field.createView?.fieldMode !== "hidden")
      .reduce((acc: Record<string, Field>, [path, field]) => {
        acc[path] = field
        return acc
      }, {})

    // Generate GraphQL selections for the fields
    const graphqlSelections = generateGraphQLSelections(createableFields)

    // Construct the GraphQL mutation
    const mutation = `
      mutation ($data: ${list.gqlNames.createInputName}!) {
        item: ${createMutationName}(data: $data) {
          ${graphqlSelections}
        }
      }
    `

    // Execute the mutation
    const result = await fetchGraphQL(mutation, { data })

    return {
      item: result.item,
      meta: {
        fields: Object.keys(createableFields),
      },
    }
  } catch (error) {
    throw error
  }
}

/**
 * Updates an existing item
 */
export async function updateItem(list: List, id: string, data: Record<string, any>) {
  try {
    const { updateMutationName } = list.gqlNames

    // Get all fields that can be updated
    const updateableFields = Object.entries(list.fields)
      .filter(([_, field]) => field.itemView?.fieldMode === "edit")
      .reduce((acc: Record<string, Field>, [path, field]) => {
        acc[path] = field
        return acc
      }, {})

    // Generate GraphQL selections for the fields
    const graphqlSelections = generateGraphQLSelections(updateableFields)

    // Construct the GraphQL mutation
    const mutation = `
      mutation ($id: ID!, $data: ${list.gqlNames.updateInputName}!) {
        item: ${updateMutationName}(where: { id: $id }, data: $data) {
          ${graphqlSelections}
        }
      }
    `

    // Execute the mutation
    const result = await fetchGraphQL(mutation, { id, data })

    return {
      item: result.item,
      meta: {
        fields: Object.keys(updateableFields),
      },
    }
  } catch (error) {
    throw error
  }
}

/**
 * Deletes an item
 */
export async function deleteItem(list: List, id: string) {
  try {
    const { deleteMutationName } = list.gqlNames

    // Construct the GraphQL mutation
    const mutation = `
      mutation ($id: ID!) {
        item: ${deleteMutationName}(where: { id: $id }) {
          id
        }
      }
    `

    // Execute the mutation
    const result = await fetchGraphQL(mutation, { id })

    return {
      success: !!result.item,
    }
  } catch (error) {
    throw error
  }
}

