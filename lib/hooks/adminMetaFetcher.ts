import { fetchGraphQL } from '@/lib/graphql';
import { getGqlNames } from '@/lib/get-names-from-list';
import { Field, List, AdminMeta } from './types';

interface KeystoneResponse {
  keystone: {
    adminMeta: {
      lists: Array<{
        key: string;
        path: string;
        label: string;
        singular: string;
        plural: string;
        description?: string;
        initialColumns: string[];
        pageSize: number;
        labelField: string;
        fields: Field[];
      }>;
    };
  };
}

// The complete admin metadata query
export const ADMIN_META_QUERY = `
  query {
    keystone {
      adminMeta {
        lists {
          key
          path
          label
          singular
          plural
          description
          initialColumns
          pageSize
          labelField
          fields {
            path
            label
            isOrderable
            isFilterable
            fieldMeta
            viewsIndex
            customViewsIndex
            itemView {
              fieldMode
              fieldPosition
            }
            listView {
              fieldMode
            }
          }
        }
      }
    }
  }
`;

// Transform the raw GraphQL response into a more usable format
export function transformAdminMeta(data: KeystoneResponse | null, includeGqlNames = true): AdminMeta {
  if (!data) return { lists: {}, listsByPath: {} };
  
  const { keystone } = data;
  const adminMeta: AdminMeta = {
    lists: {},
    listsByPath: {},
  };

  // Process the lists into a map keyed by list key
  keystone.adminMeta.lists.forEach((list) => {
    // Process fields into a map keyed by field path
    const fields: Record<string, Field> = {};
    list.fields.forEach((field) => {
      fields[field.path] = field;
    });

    // Get searchable fields (fields that are filterable)
    const searchFields = list.fields
      .filter(field => field.isFilterable)
      .map(field => field.path);

    // Generate GraphQL names if needed
    const gqlNames = includeGqlNames 
      ? getGqlNames({
          listKey: list.key,
          pluralGraphQLName: list.plural,
        })
      : {};

    // Store the processed list with the correct structure
    const processedList: List = {
      ...list,
      fields,
      searchFields,
      gqlNames,
    };
    
    // Store by key and by path for easy lookup
    adminMeta.lists[list.key] = processedList;
    adminMeta.listsByPath[list.path] = processedList;
  });

  return adminMeta;
}

// Shared fetcher function
export async function fetchAdminMeta(includeGqlNames = true): Promise<AdminMeta> {
  try {
    const data = await fetchGraphQL(ADMIN_META_QUERY);
    return transformAdminMeta(data, includeGqlNames);
  } catch (error) {
    console.error('Error fetching admin metadata:', error);
    return { lists: {}, listsByPath: {} };
  }
} 