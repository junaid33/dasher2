"use client"

/**
 * RelationshipSelect Component
 * 
 * This component handles the selection of related items in a relationship field.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { MultipleSelector } from "@/components/ui/multi-select"
import { Loader2 } from "lucide-react"
import { getGqlNames } from '@/lib/get-names-from-list'

// Debounce helper
function useDebounce(value: any, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

async function fetchGraphQL(query: string, variables = {}) {
  const response = await fetch('http://localhost:3000/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'cm7pag5lk002s6lq83d747l2j',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`)
  }

  const json = await response.json()

  if (json.errors?.length) {
    throw new Error(json.errors[0].message)
  }

  return json.data
}

// ID validators from original component
const idValidators = {
  uuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  },
  cuid(value: string) {
    return value.startsWith("c")
  },
  autoincrement(value: string) {
    return /^\d+$/.test(value)
  },
}

interface Option {
  value: string
  label: string
  data?: any
  disable?: boolean
  fixed?: boolean
  group?: string
}

interface RelationshipSelectProps {
  list: {
    key: string
    plural: string
    labelField: string
    searchFields?: string[]
    many: boolean
  }
  state: {
    kind: "one" | "many"
    value: any
    onChange: (value: any) => void
  }
  isDisabled?: boolean
  isLoading?: boolean
  extraSelection?: string
}

export function RelationshipSelect({
  list,
  state,
  isDisabled,
  isLoading: controlIsLoading,
  extraSelection = "",
}: RelationshipSelectProps) {
  const [search, setSearch] = useState("")
  const [currentInputValue, setCurrentInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [options, setOptions] = useState<Option[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 50
  
  // Use a ref to track the current search input value to avoid state updates during render
  const currentSearchRef = useRef("")

  // Get proper GraphQL query names
  const gqlNames = getGqlNames({
    listKey: list.key,
    pluralGraphQLName: list.plural // Use the proper plural form from the list prop
  })

  const debouncedSearch = useDebounce(search, 200)

  // Build where clause for search
  const buildWhere = useCallback((searchTerm: string) => {
    if (!searchTerm) return {}

    // Determine which fields to search
    // If searchFields is provided, use those
    // Otherwise fall back to labelField
    const fieldsToSearch = list.searchFields && list.searchFields.length > 0
      ? list.searchFields
      : [list.labelField]
    
    // Log search fields for debugging
    
    try {
      // Create conditions for each search field
      const conditions = fieldsToSearch.map(fieldPath => ({
        [fieldPath]: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      }))
  
      return conditions.length ? { OR: conditions } : {}
    } catch (error) {
      console.error('Error building where clause:', error);
      // Fallback to just using the label field
      return {
        [list.labelField]: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      };
    }
  }, [list.searchFields, list.labelField])

  // Load options
  const loadOptions = useCallback(async (searchTerm: string, loadPage = 1, append = false) => {
    setIsLoading(true)
    try {
      const where = buildWhere(searchTerm)
      
      // Log complete query information for debugging
      console.log('Search term:', searchTerm);
      console.log('Where clause:', where);
      console.log('List info:', {
        key: list.key,
        plural: list.plural,
        labelField: list.labelField,
        searchFields: list.searchFields
      });
      console.log('GQL Names:', gqlNames);
      
      // Make sure we're selecting the label field
      const query = `
        query GetOptions($where: ${gqlNames.whereInputName}, $take: Int, $skip: Int) {
          items: ${gqlNames.listQueryName}(where: $where, take: $take, skip: $skip) {
            id
            ${list.labelField}
            ${extraSelection}
          }
          count: ${gqlNames.listQueryCountName}(where: $where)
        }
      `
      
      const variables = {
        where,
        take: pageSize,
        skip: (loadPage - 1) * pageSize
      }
      
      // Log the complete query and variables
      console.log('GraphQL Query:', query);
      console.log('Variables:', variables);

      const data = await fetchGraphQL(query, variables)
      
      // Log successful response
      console.log('GraphQL Response:', data);
      console.log('Items with labels:', data.items.map((item: any) => ({ 
        id: item.id, 
        label: item[list.labelField] 
      })));

      const newOptions = data.items.map((item: any) => {
        // Get a proper label - ensure it's a non-empty string
        let label = '';
        
        if (item[list.labelField] !== undefined && item[list.labelField] !== null) {
          // Convert to string and trim
          label = String(item[list.labelField]).trim();
        }
        
        // If label is empty, use ID as fallback
        // if (label === '') {
        //   label = `ID: ${item.id}`;
        // }
        
        return {
          value: item.id,
          label: label,
          data: item
        };
      })

      setOptions(prev => append ? [...prev, ...newOptions] : newOptions)
      setHasMore(data.count > loadPage * pageSize)
      return data
    } catch (error: any) {
      // Enhanced error logging
      console.error('Error loading options:', error);
      console.error('Error details:', error.message);
      
      // Check for specific field-related errors
      if (error.message && (
        error.message.includes('Unknown argument') || 
        error.message.includes('Field does not exist')
      )) {
        console.error('Field error detected. Attempting query without search filters.');
        
        // Try a query without any search filters
        try {
          return await loadOptions('', loadPage, append);
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
        }
      } else if (searchTerm) {
        // For other errors, try a simpler query without search
        console.log('Attempting fallback query with no search filters...');
        try {
          return await loadOptions('', loadPage, append);
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
        }
      }
      
      // Show a more user-friendly message if possible
      setOptions([]);
      setHasMore(false);
    } finally {
      setIsLoading(false)
    }
  }, [buildWhere, gqlNames, list.labelField, list.key, list.plural, list.searchFields, extraSelection, pageSize])

  // Initial load
  useEffect(() => {
    loadOptions("", 1, false)
    // We intentionally exclude loadOptions from the dependency array to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle search changes
  useEffect(() => {
    setPage(1)
    loadOptions(debouncedSearch, 1, false)
    // We intentionally exclude loadOptions from the dependency array to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // Move search update to useEffect
  useEffect(() => {
    if (currentInputValue !== debouncedSearch) {
      setSearch(currentInputValue);
    }
  }, [currentInputValue, debouncedSearch]);
  
  // Effect to update search from ref
  useEffect(() => {
    if (currentSearchRef.current !== debouncedSearch && currentSearchRef.current !== "") {
      setCurrentInputValue(currentSearchRef.current);
    }
  }, [debouncedSearch]);

  // Convert state value to MultipleSelector format
  const value = state.kind === "many"
    ? state.value.map((v: any) => {
        // For relationship items, the label might be in the labelField property
        const labelValue = v.label || (v[list.labelField] ? v[list.labelField] : v.id);
        return {
          value: v.id,
          label: labelValue,
          data: v.data
        };
      })
    : state.value
      ? (() => {
          // For relationship items, the label might be in the labelField property
          const labelValue = state.value.label || 
            (state.value[list.labelField] ? state.value[list.labelField] : state.value.id);
          
          return [{
            value: state.value.id,
            label: labelValue,
            data: state.value.data
          }];
        })()
      : []

  // Log the value to debug
  console.log('Selected value:', state.value);
  if (state.value) {
    if (Array.isArray(state.value)) {
      console.log('Selected value properties:', state.value.map(v => Object.keys(v)));
      console.log('Selected value label field:', state.value.map(v => ({ 
        id: v.id, 
        label: v.label, 
        labelField: v[list.labelField] 
      })));
    } else if (state.value && typeof state.value === 'object') {
      console.log('Selected value properties:', Object.keys(state.value));
      console.log('Selected value label field:', { 
        id: state.value.id, 
        label: state.value.label, 
        labelField: state.value[list.labelField] 
      });
    }
  }
  console.log('Formatted value for MultipleSelector:', value);

  return (
    <div className="space-y-4">
      {/* Debug component to show data */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs bg-gray-100 p-2 rounded mb-2 overflow-auto max-h-32">
          <div><strong>List:</strong> {list.key} ({list.labelField})</div>
          <div><strong>Search Fields:</strong> {list.searchFields?.join(', ') || list.labelField}</div>
          <div><strong>Selected:</strong> {value.map((v: Option) => `${v.label} (${v.value})`).join(', ') || 'None'}</div>
          <div><strong>Options:</strong> {options.slice(0, 5).map(o => `${o.label} (${o.value})`).join(', ')}{options.length > 5 ? ` ...and ${options.length - 5} more` : ''}</div>
        </div>
      )}
      
      <MultipleSelector
        value={value}
        onChange={newValues => {
          if (state.kind === "many") {
            state.onChange(
              newValues.map(x => ({
                id: x.value,
                label: x.label,
                data: x.data
              }))
            )
          } else {
            state.onChange(
              newValues[0]
                ? {
                    id: newValues[0].value,
                    label: newValues[0].label,
                    data: newValues[0].data
                  }
                : null
            )
          }
        }}
        options={options}
        disabled={isDisabled}
        placeholder={`Select ${list.many ? list.key : 'a ' + list.key}`}
        maxSelected={state.kind === "many" ? undefined : 1}
        filterOption={(option, search) => {
          // Custom filter function that also triggers loading more options
          const matches = option.label.toLowerCase().includes(search.toLowerCase());
          
          // Instead of updating state directly, store in ref
          if (search !== debouncedSearch) {
            currentSearchRef.current = search;
          }
          
          return matches;
        }}
        renderSelectedOption={(option) => (
          <span className="truncate max-w-[200px]">{option.label}</span>
        )}
      />
    </div>
  )
}

