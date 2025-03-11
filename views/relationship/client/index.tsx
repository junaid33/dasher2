"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { MultipleSelector } from "@/components/ui/multi-select"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { fetchGraphQL } from "@/lib/graphql"
import React, { lazy } from "react"
import { getGqlNames } from "@/lib/get-names-from-list"

interface Option {
  value: string
  label: string
}

interface RelationshipItem {
  id: string
  label?: string
  data?: Record<string, any>
  [key: string]: any
}

interface FieldMeta {
  refListKey: string
  refLabelField?: string
  many?: boolean
  plural?: string
  searchFields?: string[]
}

interface Field {
  path: string
  label: string
  description?: string
  fieldMeta: FieldMeta
}

interface FilterProps {
  value: string
  onChange: (value: string) => void
}

interface CellProps {
  item: Record<string, any>
  field: Field
}

interface FieldProps {
  field: Field
  value?: { value: RelationshipItem | RelationshipItem[] | null; initial?: RelationshipItem | RelationshipItem[] | null; kind: 'update' | 'create' }
  onChange?: (value: { value: RelationshipItem | RelationshipItem[] | null; initial?: RelationshipItem | RelationshipItem[] | null; kind: 'update' | 'create' }) => void
}

interface FilterLabelProps {
  label: string
  type: keyof FilterTypes
  value: string
}

interface GraphQLProps {
  path: string
  type: keyof FilterTypes
  value: string
}

interface FilterType {
  label: string
  initialValue: string
}

interface FilterTypes {
  contains: FilterType
  not_contains: FilterType
  is: FilterType
  is_not: FilterType
}

/**
 * Filter component for relationship fields
 */
export function Filter({ value, onChange }: FilterProps) {
  return (
    <MultipleSelector
      value={value ? [{ value, label: value }] : []}
      onChange={(newValues) => {
        onChange(newValues[0]?.value || "")
      }}
      maxSelected={1}
      placeholder="Search..."
      className="h-8"
      options={[]}
    />
  )
}

/**
 * Get available filter types for relationship fields
 */
export function getFilterTypes(): FilterTypes {
  return {
    contains: {
      label: "Contains",
      initialValue: "",
    },
    not_contains: {
      label: "Does not contain",
      initialValue: "",
    },
    is: {
      label: "Is",
      initialValue: "",
    },
    is_not: {
      label: "Is not",
      initialValue: "",
    },
  }
}

/**
 * Cell component for rendering relationship values in a list view
 */
export function Cell({ item, field }: CellProps) {
  const value = item[field.path]

  if (!value) {
    return <span className="text-muted-foreground">Not set</span>
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v) => (
          <span key={v.id} className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
            {v.label || v.id}
          </span>
        ))}
      </div>
    )
  }

  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">{value.label || value.id}</span>
  )
}

// Utility function to fetch the label for a relationship field
async function fetchRelationshipLabel(listKey: string, id: string, labelField: string): Promise<{ item: RelationshipItem | null, plural: string }> {
  try {
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
    
    const metaData = await fetchGraphQL(metaQuery);
    const { singular, plural } = metaData.keystone.adminMeta.list;
    
    // Now use getGqlNames with the correct plural name
    const gqlNames = getGqlNames({
      listKey,
      pluralGraphQLName: plural
    });

    console.log({ gqlNames })
    
    const query = `
      query ($id: ID!) {
        item: ${gqlNames.itemQueryName}(where: { id: $id }) {
          id
          ${labelField}
        }
      }
    `;

    // Execute the query
    const data = await fetchGraphQL(query, { id });

    // Return the item with the label and the plural
    return { item: data.item, plural };
  } catch (error) {
    console.error("Error fetching relationship label:", error);
    return { item: null, plural: listKey + 's' };
  }
}

export function Field({ field, value, onChange }: FieldProps) {
  const [isLoadingLabels, setIsLoadingLabels] = useState(false)
  const [processedValue, setProcessedValue] = useState<any>(null)
  const [refListSearchFields, setRefListSearchFields] = useState<string[] | undefined>(undefined)

  // Fetch the referenced list's metadata to get searchable fields
  useEffect(() => {
    async function fetchRefListMetadata() {
      try {
        const query = `
          query {
            keystone {
              adminMeta {
                lists {
                  key
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
        
        const data = await fetchGraphQL(query);
        const refList = data.keystone.adminMeta.lists.find(
          (list: any) => list.key === field.fieldMeta.refListKey
        );
        
        if (refList) {
          // Get searchable fields from the referenced list
          const searchFields = refList.fields
            .filter((f: any) => f.isFilterable)
            .map((f: any) => f.path);
            
          setRefListSearchFields(searchFields);
        }
      } catch (error) {
        console.error('Error fetching reference list metadata:', error);
      }
    }
    
    fetchRefListMetadata();
  }, [field.fieldMeta.refListKey]);

  // Function to fetch labels for relationship fields
  useEffect(() => {
    async function fetchLabels() {
      if (!value?.value) {
        setProcessedValue(null)
        return
      }

      setIsLoadingLabels(true)
      try {
        // For to-many relationships
        if (field.fieldMeta.many && Array.isArray(value.value)) {
          const labelPromises = value.value.map(async (item: any) => {
            // If the item already has a label, use it
            if (item[field.fieldMeta.refLabelField || "id"]) return item

            // Otherwise, fetch the label
            const result = await fetchRelationshipLabel(
              field.fieldMeta.refListKey,
              item.id,
              field.fieldMeta.refLabelField || "id"
            )
            // Store the plural in fieldMeta
            if (!field.fieldMeta.plural && result.plural) {
              field.fieldMeta.plural = result.plural
            }
            return result.item
          })

          const itemsWithLabels = await Promise.all(labelPromises)
          const filteredItems = itemsWithLabels.filter(Boolean)
          setProcessedValue(filteredItems)
        }
        // For to-one relationships
        else if (value.value) {
          // If the item already has a label, use it
          const item = value.value as any;
          if (!item[field.fieldMeta.refLabelField || "id"]) {
            // Otherwise, fetch the label
            const result = await fetchRelationshipLabel(
              field.fieldMeta.refListKey,
              item.id,
              field.fieldMeta.refLabelField || "id",
            )
            // Store the plural in fieldMeta
            if (!field.fieldMeta.plural && result.plural) {
              field.fieldMeta.plural = result.plural
            }

            if (result.item) {
              setProcessedValue(result.item)
            }
          }
          else {
            setProcessedValue(item)
          }
        }
      } catch (error) {
        console.error("Error fetching relationship labels:", error)
      } finally {
        setIsLoadingLabels(false)
      }
    }

    fetchLabels()
  }, [value?.value, field.fieldMeta])

  // Import the RelationshipSelect component
  const RelationshipSelect = lazy(() => import("@/components/RelationshipSelect").then(mod => ({ default: mod.RelationshipSelect })));

  return (
    <div className="grid gap-2">
      <Label>{field.label}</Label>
      {isLoadingLabels ? (
        <div className="w-full h-10 bg-gray-100 animate-pulse rounded"></div>
      ) : (
        <React.Suspense fallback={
          <div className="w-full h-10 bg-gray-100 animate-pulse rounded"></div>
        }>
          <RelationshipSelect
            list={{
              key: field.fieldMeta.refListKey,
              plural: field.fieldMeta.plural || field.fieldMeta.refListKey + "s",
              labelField: field.fieldMeta.refLabelField || "id",
              searchFields: refListSearchFields,
              many: !!field.fieldMeta.many
            }}
            state={{
              kind: field.fieldMeta.many ? "many" : "one",
              value: processedValue || value?.value,
              onChange: (newValue: RelationshipItem | RelationshipItem[] | null) => {
                if (onChange) {
                  onChange({
                    value: newValue,
                    initial: value?.initial,
                    kind: value?.kind || "update"
                  });
                }
              }
            }}
            isLoading={isLoadingLabels}
          />
        </React.Suspense>
      )}
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  )
}

// Filter controller for relationship fields
export const filter = {
  Filter,
  types: getFilterTypes(),
  Label: ({ label, type, value }: FilterLabelProps) => {
    const filterType = getFilterTypes()[type]
    return filterType ? `${label} ${filterType.label.toLowerCase()}: ${value}` : ""
  },
  graphql: ({ path, type, value }: GraphQLProps) => {
    if (!value) return {}

    // Try to parse the value as an ID
    const isValidId = /^[0-9a-fA-F]{24}$/.test(value) || /^\d+$/.test(value)
    if (!isValidId) return {}

    switch (type) {
      case 'is':
        return { [path]: { equals: value } }
      case 'is_not':
        return { [path]: { not: { equals: value } } }
      case 'contains':
        return { [path]: { some: { id: { equals: value } } } }
      case 'not_contains':
        return { [path]: { none: { id: { equals: value } } } }
      default:
        return {}
    }
  }
}

