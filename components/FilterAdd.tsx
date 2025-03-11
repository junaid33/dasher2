'use client';

import { Fragment, useMemo, useState, ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { getFieldTypeFromViewsIndex, getClientField, getServerField } from '@/views/registry';
import { ListMeta } from './filter-bar';

interface FilterState {
  kind: "selecting-field" | "filter-value";
  fieldPath: string | null;
  filterType: string | null;
  filterValue: any;
}

interface FilterAddProps {
  listMeta: ListMeta;
  children: ReactNode;
}

export function FilterAdd({ listMeta, children }: FilterAddProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      {isOpen && (
        <PopoverContent align="start" className="w-[240px] p-0">
          <FilterAddContent onClose={() => setIsOpen(false)} listMeta={listMeta} />
        </PopoverContent>
      )}
    </Popover>
  );
}

function FilterAddContent({ 
  onClose, 
  listMeta 
}: { 
  onClose: () => void; 
  listMeta: ListMeta;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get filterable fields with their filter implementations
  const filterableFields = useMemo(() => {
    const fields: Record<string, any> = {};
    Object.entries(listMeta.fields).forEach(([fieldPath, field]) => {
      if (field.isFilterable) {
        const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex);
        const fieldImpl = getClientField(fieldType);
        
        if (fieldImpl?.filter) {
          fields[fieldPath] = {
            ...field,
            controller: fieldImpl.filter
          };
        }
      }
    });
    return fields;
  }, [listMeta.fields]);

  // Get available filter types for each field (excluding already used ones)
  const availableFilters = useMemo(() => {
    const filters: Record<string, Record<string, any>> = {};
    Object.entries(filterableFields).forEach(([fieldPath, field]) => {
      let hasUnusedFilters = false;
      const fieldFilters: Record<string, any> = {};
      
      Object.entries(field.controller.types).forEach(([filterType, filterConfig]) => {
        // Check if this filter is already in use
        const filterKey = `!${fieldPath}_${filterType}`;
        if (!searchParams.has(filterKey)) {
          hasUnusedFilters = true;
          fieldFilters[filterType] = filterConfig;
        }
      });
      
      if (hasUnusedFilters) {
        filters[fieldPath] = fieldFilters;
      }
    });
    return filters;
  }, [filterableFields, searchParams]);

  const [state, setState] = useState<FilterState>({
    kind: "selecting-field",
    fieldPath: Object.keys(availableFilters)[0] || null,
    filterType: null,
    filterValue: null
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (state.kind === "filter-value" && state.fieldPath && state.filterType && state.filterValue !== null) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      const filterKey = `!${state.fieldPath}_${state.filterType}`;
      
      // Use the field's controller to serialize the filter value
      const field = filterableFields[state.fieldPath];
      const graphqlValue = field.controller.graphql({
        type: state.filterType,
        value: state.filterValue
      });
      
      newSearchParams.set(filterKey, JSON.stringify(state.filterValue));
      newSearchParams.set('page', '1'); // Reset to first page when adding a filter
      
      // Log the filter being added
      console.log('Adding filter:', {
        key: filterKey,
        value: state.filterValue,
        graphqlValue
      });
      
      router.push(`${pathname}?${newSearchParams.toString()}`);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex justify-between items-center px-2 py-2">
        {state.kind !== "selecting-field" && (
          <Button
            onClick={() => setState({ kind: "selecting-field", fieldPath: state.fieldPath, filterType: null, filterValue: null })}
            variant="ghost"
            size="icon"
            className="[&_svg]:size-3 w-6 h-6"
          >
            <div className="sr-only">Back</div>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="text-sm font-medium">
          {state.kind === "selecting-field"
            ? "Filter"
            : state.fieldPath ? listMeta.fields[state.fieldPath].label : ""}
        </div>
      </div>
      <Separator />

      <div className="p-2">
        {state.kind === "selecting-field" && (
          <Select
            value={state.fieldPath || ''}
            onValueChange={(fieldPath) => {
              const filterTypes = availableFilters[fieldPath];
              const firstFilterType = Object.keys(filterTypes)[0];
              setState({
                kind: "filter-value",
                fieldPath,
                filterType: firstFilterType,
                filterValue: filterTypes[firstFilterType].initialValue
              });
            }}
          >
            <SelectTrigger>
              <SelectValue className="text-sm" placeholder="Select a field" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(availableFilters).map(([fieldPath]) => (
                <SelectItem key={fieldPath} value={fieldPath}>
                  {listMeta.fields[fieldPath].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {state.kind === "filter-value" && state.fieldPath && (
          <>
            <Select
              value={state.filterType || ''}
              onValueChange={(filterType) => {
                const field = filterableFields[state.fieldPath!];
                setState({
                  ...state,
                  filterType,
                  filterValue: field.controller.types[filterType].initialValue
                });
              }}
            >
              <SelectTrigger className="mb-2">
                <SelectValue>
                  {state.filterType ? availableFilters[state.fieldPath][state.filterType].label : 'Select filter type'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(availableFilters[state.fieldPath]).map(([filterType, { label }]) => (
                  <SelectItem key={filterType} value={filterType}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {state.filterType && (
              <div className="pb-3">
                {(() => {
                  const field = filterableFields[state.fieldPath!];
                  if (field.controller.Filter) {
                    return (
                      <field.controller.Filter
                        type={state.filterType}
                        value={state.filterValue}
                        onChange={(value: any) => {
                          setState({
                            ...state,
                            filterValue: value
                          });
                        }}
                      />
                    );
                  }
                })()}
              </div>
            )}
          </>
        )}
      </div>

      {state.kind === "filter-value" && (
        <>
          <Separator />
          <div className="flex justify-between p-2">
            <Button onClick={onClose} variant="outline" size="sm">
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Apply
            </Button>
          </div>
        </>
      )}
    </form>
  );
} 