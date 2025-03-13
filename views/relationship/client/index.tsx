// Relationship/client/index.js (Client Component)
"use client"

import { FieldProps, FieldMeta, RelationshipItem, Option } from "../server";
import type { Field } from "../server";
import { Label } from "@/components/ui/label";
import { ClientField } from "./Field";
import { MultipleSelector } from "@/components/ui/multi-select";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState, useEffect, Suspense } from "react";
import useSWR from "swr";
import { fetchGraphQL } from "@/lib/graphql";
import { getGqlNames } from "@/lib/get-names-from-list";
import { useAdminMeta, useList } from "@/lib/hooks/useAdminMeta";

/**
 * SWR Suspense Mode Notes:
 * 
 * 1. React's team doesn't fully recommend using Suspense with data fetching libraries like SWR yet.
 *    The APIs may change in the future as research continues.
 * 
 * 2. Benefits of Suspense mode:
 *    - Cleaner code (no need to check if data is undefined)
 *    - Automatic loading states through Suspense boundaries
 *    - Better integration with React's concurrent features
 * 
 * 3. Limitations and considerations:
 *    - The suspense option cannot change during the component lifecycle
 *    - You need to use ErrorBoundary to catch errors
 *    - Can cause waterfall problems (where one component waits for another)
 *    - With conditional fetching, data can still be undefined if the request is paused
 *    - Server-side rendering requires providing initial data
 * 
 * 4. Our approach:
 *    - We provide both regular and suspense-enabled versions of the Field component
 *    - The regular version uses fallbackData to avoid loading states
 *    - The suspense version requires wrapping in a Suspense boundary
 *    - For most cases, the regular version should be sufficient and more stable
 */

interface CustomOption {
  value: string;
  label: React.ReactNode;
  data?: any;
}

interface FilterProps {
  value: string;
  onChange: (value: string) => void;
}

interface FilterTypes {
  contains: { label: string; initialValue: string };
  not_contains: { label: string; initialValue: string };
  is: { label: string; initialValue: string };
  is_not: { label: string; initialValue: string };
}

interface CellProps {
  item: Record<string, any>;
  field: { path: string; label: string; fieldMeta: FieldMeta };
}

interface ExtendedFieldProps extends FieldProps {
  rawValue?: any;
  kind?: 'create' | 'update';
}

// Create a client-side version of SelectedOptionLabel
function ClientSelectedOptionLabel({
  id,
  listKey,
  labelField = "id",
}: {
  id: string;
  listKey: string;
  labelField?: string;
}) {
  const { data } = useSWR(
    [`selectedOption-${listKey}-${id}`, id, listKey, labelField],
    () => {
      // First, fetch the list metadata to get the proper singular and plural values
      const metaQuery = `
        query {
          keystone {
            adminMeta {
              list(key: "${listKey}") {
                singular
                plural
              }
            }
          }
        }
      `;
      
      return fetchGraphQL(metaQuery)
        .then(metaData => {
          const { plural } = metaData.keystone.adminMeta.list;
          
          // Now use getGqlNames with the correct plural name
          const gqlNames = getGqlNames({
            listKey,
            pluralGraphQLName: plural
          });
          
          const query = `
            query ($id: ID!) {
              item: ${gqlNames.itemQueryName}(where: { id: $id }) {
                id
                ${labelField}
              }
            }
          `;

          // Execute the query
          return fetchGraphQL(query, { id })
            .then(data => data?.item?.[labelField] || id);
        });
    },
    { revalidateOnFocus: false }
  );

  return <>{data || id}</>;
}

// Regular version without suspense
export function Field({ field, value, rawValue, kind = 'update', onChange }: ExtendedFieldProps) {
  const { refListKey, refLabelField = "id", many = false } = field.fieldMeta;
  
  // Handle internal deserialization if rawValue is provided
  let processedValue = value;
  
  if (rawValue !== undefined) {
    // Create a controller directly
    const fieldController = controller({
      path: field.path,
      label: field.label,
      description: field.description,
      fieldMeta: field.fieldMeta
    });
    
    // Deserialize the raw value
    processedValue = fieldController.deserialize({ [field.path]: rawValue });
  }

  const selectedOptions = processedValue?.value
    ? Array.isArray(processedValue.value)
      ? processedValue.value.map((item: any) => ({
          value: item.id,
          label: <ClientSelectedOptionLabel id={item.id} listKey={refListKey} labelField={refLabelField} />,
          data: item
        }))
      : [{ 
          value: processedValue.value.id,
          label: <ClientSelectedOptionLabel id={processedValue.value.id} listKey={refListKey} labelField={refLabelField} />,
          data: processedValue.value 
        }]
    : [];

  // Use our admin meta hook to get the referenced list
  const { adminMeta } = useAdminMeta();
  const refList = adminMeta?.lists?.[refListKey];
  
  // Fetch relationship options
  const { data } = useSWR(
    [`relationshipOptions-${refListKey}`, refListKey, refLabelField],
    async () => {
      // If we already have the list metadata from our admin meta hook, use it
      if (refList) {
        const gqlNames = refList.gqlNames || getGqlNames({
          listKey: refListKey,
          pluralGraphQLName: refList.plural,
        });

        // Fetch only IDs to avoid resolver issues with refLabelField
        const optionsQuery = `
          query {
            items: ${gqlNames.listQueryName}(take: 100) {
              ${refLabelField === "id" ? "id" : `id\n              ${refLabelField}`}
            }
          }
        `;

        const optionsData = await fetchGraphQL(optionsQuery);
        
        return {
          options: (optionsData?.items || []).map((item: any) => ({
            value: item.id,
            label: item[refLabelField] || item.id || "Unknown",
          })),
          searchFields: refList.searchFields || [],
          plural: refList.plural || refListKey.toLowerCase() + "s",
        };
      }
      
      // Fallback to the old implementation if admin meta is not available
      return fetchRelationshipData(field);
    },
    { 
      revalidateOnFocus: false,
      // Provide fallback empty data to avoid loading states
      fallbackData: {
        options: [],
        searchFields: [],
        plural: refList?.plural || field.fieldMeta.refListKey.toLowerCase() + "s"
      }
    }
  );

  return (
    <div className="grid gap-2">
      <Label>{field.label}</Label>
      <ClientField
        options={data?.options || []}
        selectedOptions={selectedOptions}
        searchFields={data?.searchFields || []}
        plural={data?.plural || field.fieldMeta.refListKey.toLowerCase() + "s"}
        many={many}
        refLabelField={refLabelField}
        onChange={onChange}
        field={field}
        value={processedValue}
      />
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}

// Suspense-enabled version of the Field component
// To use this version, wrap it in a Suspense boundary:
// <Suspense fallback={<div>Loading...</div>}>
//   <FieldWithSuspense field={field} value={value} onChange={onChange} />
// </Suspense>
export function FieldWithSuspense({ field, value, rawValue, kind = 'update', onChange }: ExtendedFieldProps) {
  const { refListKey, refLabelField = "id", many = false } = field.fieldMeta;
  
  // Handle internal deserialization if rawValue is provided
  let processedValue = value;
  
  if (rawValue !== undefined) {
    // Create a controller directly
    const fieldController = controller({
      path: field.path,
      label: field.label,
      description: field.description,
      fieldMeta: field.fieldMeta
    });
    
    // Deserialize the raw value
    processedValue = fieldController.deserialize({ [field.path]: rawValue });
  }

  const selectedOptions = processedValue?.value
    ? Array.isArray(processedValue.value)
      ? processedValue.value.map((item: any) => ({
          value: item.id,
          label: <ClientSelectedOptionLabel id={item.id} listKey={refListKey} labelField={refLabelField} />,
          data: item
        }))
      : [{ 
          value: processedValue.value.id,
          label: <ClientSelectedOptionLabel id={processedValue.value.id} listKey={refListKey} labelField={refLabelField} />,
          data: processedValue.value 
        }]
    : [];

  // Use our admin meta hook to get the referenced list
  const { adminMeta } = useAdminMeta();
  const refList = adminMeta?.lists?.[refListKey];
  
  // Use SWR with suspense mode enabled
  const { data } = useSWR(
    [`relationshipOptions-${refListKey}`, refListKey, refLabelField],
    async () => {
      // If we already have the list metadata from our admin meta hook, use it
      if (refList) {
        const gqlNames = refList.gqlNames || getGqlNames({
          listKey: refListKey,
          pluralGraphQLName: refList.plural,
        });

        // Fetch only IDs to avoid resolver issues with refLabelField
        const optionsQuery = `
          query {
            items: ${gqlNames.listQueryName}(take: 100) {
              ${refLabelField === "id" ? "id" : `id\n              ${refLabelField}`}
            }
          }
        `;

        const optionsData = await fetchGraphQL(optionsQuery);
        
        return {
          options: (optionsData?.items || []).map((item: any) => ({
            value: item.id,
            label: item[refLabelField] || item.id || "Unknown",
          })),
          searchFields: refList.searchFields || [],
          plural: refList.plural || refListKey.toLowerCase() + "s",
        };
      }
      
      // Fallback to the old implementation if admin meta is not available
      return fetchRelationshipData(field);
    },
    { 
      suspense: true, // Enable suspense mode
      revalidateOnFocus: false
    }
  );

  return (
    <div className="grid gap-2">
      <Label>{field.label}</Label>
      <ClientField
        options={data.options}
        selectedOptions={selectedOptions}
        searchFields={data.searchFields}
        plural={data.plural}
        many={many}
        refLabelField={refLabelField}
        onChange={onChange}
        field={field}
        value={processedValue}
      />
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  );
}

// Example of how to use the suspense-enabled version:
export function RelationshipFieldWithSuspense(props: ExtendedFieldProps) {
  return (
    <Suspense fallback={<div className="p-2 animate-pulse">Loading relationship field...</div>}>
      <FieldWithSuspense {...props} />
    </Suspense>
  );
}

export function Filter({ value, onChange }: FilterProps) {
  return (
    <MultipleSelector
      value={value ? [{ value, label: value }] : []}
      onChange={(newValues: any[]) => onChange(newValues[0]?.value || "")}
      maxSelected={1}
      placeholder="Search..."
      className="h-8"
      options={[]}
    />
  );
}

export function getFilterTypes(): FilterTypes {
  return {
    contains: { label: "Contains", initialValue: "" },
    not_contains: { label: "Does not contain", initialValue: "" },
    is: { label: "Is", initialValue: "" },
    is_not: { label: "Is not", initialValue: "" },
  };
}

export function Cell({ item, field }: CellProps) {
  const value = item[field.path];
  if (!value) return <span className="text-muted-foreground">Not set</span>;
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v) => (
          <span key={v.id} className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
            {v.label || v.id}
          </span>
        ))}
      </div>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
      {value.label || value.id}
    </span>
  );
}

export const filter = {
  Filter,
  types: getFilterTypes(),
  Label: ({ label, type, value }: { label: string; type: keyof FilterTypes; value: string }) => {
    const filterType = getFilterTypes()[type];
    return filterType ? `${label} ${filterType.label.toLowerCase()}: ${value}` : "";
  },
  graphql: ({ path, type, value }: { path: string; type: keyof FilterTypes; value: string }) => {
    if (!value) return {};
    const isValidId = /^[0-9a-fA-F]{24}$/.test(value) || /^\d+$/.test(value);
    if (!isValidId) return {};
    switch (type) {
      case "is": return { [path]: { equals: value } };
      case "is_not": return { [path]: { not: { equals: value } } };
      case "contains": return { [path]: { some: { id: { equals: value } } } };
      case "not_contains": return { [path]: { none: { id: { equals: value } } } };
      default: return {};
    }
  },
};

/**
 * Controller for relationship fields
 */
export const controller = (config: any) => {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    fieldMeta: config.fieldMeta,
    deserialize: (data: Record<string, any>) => {
      const value = data[config.path];
      const many = config.fieldMeta?.many;
      
      if (value === null || value === undefined) {
        return {
          kind: 'update' as const,
          initial: null,
          value: null,
        };
      }
      
      // Handle many-to-many relationship
      if (many) {
        // If we have an array, it's already in the right format
        if (Array.isArray(value)) {
          return {
            kind: 'update' as const,
            initial: value,
            value: value,
          };
        }
        
        // If it's a comma-separated string of IDs (common for form submissions)
        if (typeof value === 'string' && value.includes(',')) {
          const ids = value.split(',').filter(id => id.trim());
          const items = ids.map(id => ({ id }));
          return {
            kind: 'update' as const,
            initial: items,
            value: items,
          };
        }
        
        // Single ID that should be in an array
        if (value && typeof value === 'string') {
          return {
            kind: 'update' as const,
            initial: [{ id: value }],
            value: [{ id: value }],
          };
        }
        
        return {
          kind: 'update' as const,
          initial: [],
          value: [],
        };
      }
      
      // Handle one-to-many relationship
      if (typeof value === 'object' && value !== null) {
        return {
          kind: 'update' as const,
          initial: value,
          value: value,
        };
      }
      
      // Handle string ID
      if (typeof value === 'string' && value.trim()) {
        return {
          kind: 'update' as const,
          initial: { id: value },
          value: { id: value },
        };
      }
      
      return {
        kind: 'update' as const,
        initial: null,
        value: null,
      };
    },
    serialize: (value: any) => {
      if (!value?.value) return { [config.path]: null };
      
      const many = config.fieldMeta?.many;
      if (many) {
        if (Array.isArray(value.value)) {
          return {
            [config.path]: value.value.map((item: any) => ({ id: item.id })),
          };
        }
        return { [config.path]: [] };
      }
      
      if (value.value.id) {
        return { [config.path]: { connect: { id: value.value.id } } };
      }
      
      return { [config.path]: null };
    },
  };
};

// Keep the original fetcher function for backward compatibility
const fetchRelationshipData = (field: Field) => {
  const { refListKey, refLabelField = "id" } = field.fieldMeta;

  const listMetaQuery = `
    query {
      keystone {
        adminMeta {
          list(key: "${refListKey}") {
            singular
            plural
            labelField
            fields {
              path
              isFilterable
            }
          }
        }
      }
    }
  `;
  
  return fetchGraphQL(listMetaQuery)
    .then(metaData => {
      const listMeta = metaData.keystone.adminMeta.list || {};
      const gqlNames = getGqlNames({
        listKey: refListKey,
        pluralGraphQLName: listMeta.plural || refListKey.toLowerCase() + "s",
      });

      // Fetch only IDs to avoid resolver issues with refLabelField
      const optionsQuery = `
        query {
          items: ${gqlNames.listQueryName}(take: 100) {
            ${refLabelField === "id" ? "id" : `id\n        ${refLabelField}`}
          }
        }
      `;

      return fetchGraphQL(optionsQuery).then(optionsData => {
        return {
          options: (optionsData?.items || []).map((item: any) => ({
            value: item.id,
            label: item[refLabelField] || item.id || "Unknown",
          })),
          searchFields: (listMeta.fields || [])
            .filter((f: any) => f.isFilterable)
            .map((f: any) => f.path),
          plural: listMeta.plural || refListKey.toLowerCase() + "s",
        };
      });
    });
};