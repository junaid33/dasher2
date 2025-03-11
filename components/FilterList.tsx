'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { X as XIcon, ChevronRight, ChevronDown, Filter as FilterIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { getFieldTypeFromViewsIndex, getClientField } from '@/views/registry';
import { ListMeta } from './filter-bar';

interface Field {
  path: string;
  label: string;
  viewsIndex: string;
  isFilterable: boolean;
  [key: string]: any;
}

interface Filter {
  field: string;
  type: string;
  value: any;
}

interface FilterPillProps {
  filter: Filter;
  field: Field;
}

interface EditDialogProps extends FilterPillProps {
  onClose: () => void;
}

export function FilterList({ listMeta }: { listMeta: ListMeta }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // Pre-compute all possible filter combinations
  const possibleFilters = Object.entries(listMeta.fields).reduce((acc, [fieldPath, field]) => {
    if (!field.isFilterable) return acc;
    
    const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex);
    const fieldImpl = getClientField(fieldType);
    
    if (!fieldImpl?.filter) return acc;
    
    // Add all possible filter types for this field
    Object.keys(fieldImpl.filter.types).forEach(type => {
      acc[`!${fieldPath}_${type}`] = {
        type,
        fieldPath,
        field
      };
    });
    
    return acc;
  }, {} as Record<string, any>);
  
  // Get active filters by checking against possible filters
  const activeFilters = Array.from(searchParams.entries())
    .map(([key, value]) => {
      const filterConfig = possibleFilters[key];
      if (!filterConfig) return null;
      
      // Parse the JSON value
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        parsedValue = value;
      }
      
      const fieldType = getFieldTypeFromViewsIndex(filterConfig.field.viewsIndex);
      const fieldImpl = getClientField(fieldType);
      
      return {
        id: key,
        fieldPath: filterConfig.fieldPath,
        filterType: filterConfig.type,
        value: parsedValue,
        field: filterConfig.field,
        controller: fieldImpl.filter
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex gap-1.5 border-t bg-muted/40 py-2 px-6 items-center">
      <div className="flex items-center gap-1.5 border-r border-muted-foreground/30 pr-2 mr-1.5">
        <FilterIcon
          className="stroke-muted-foreground/50 size-4"
          strokeWidth={1.5}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {activeFilters.map((filter) => (
          <FilterPill
            key={filter.id}
            filter={{
              field: filter.fieldPath,
              type: filter.filterType,
              value: filter.value
            }}
            field={filter.field}
          />
        ))}
      </div>
    </div>
  );
}

function FilterPill({ filter, field }: FilterPillProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Create a query object that behaves like the old query object
  const query: Record<string, string> = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  // Get the field implementation
  const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex);
  const fieldImpl = getClientField(fieldType);
  const controller = fieldImpl.filter;

  const onRemove = () => {
    const { [`!${filter.field}_${filter.type}`]: _ignore, ...queryToKeep } = query;
    router.push(`${pathname}?${new URLSearchParams(queryToKeep).toString()}`);
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        {/* <div
          className="inline-flex items-center rounded-md text-muted-foreground shadow-xs h-12"
          role="group"
        >
          <div className="flex border rounded-s-md">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-none rounded-s-[calc(theme(borderRadius.md)-1px)] [&_svg]:size-3 w-6 h-6 px-2 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <XIcon />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="py-0.5 shadow-none justify-start uppercase flex-wrap rounded-l-none border-l-0 [&_svg]:size-3.5 text-xs px-2"
          >
            <span className="opacity-75">{field.label}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold">
              {controller.Label({
                label: controller.types[filter.type].label,
                type: filter.type,
                value: filter.value
              })}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div> */}
            <div
          className="inline-flex items-center rounded-md text-muted-foreground shadow-xs h-6"
          role="group"
        >
          <div className="flex border rounded-s-md h-full">
            <Button
              variant="ghost"
              size="icon"
              className="max-h-full rounded-none rounded-s-[calc(theme(borderRadius.md)-1px)] [&_svg]:size-3 w-6 h-6 px-2 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <XIcon />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="py-0 shadow-none justify-start uppercase flex-wrap rounded-l-none border-l-0 [&_svg]:size-3.5 text-xs px-2 h-full"
          >
            <span className="opacity-75 truncate">{field.label}</span>
            <ChevronRightIcon />
           

            <span className="font-semibold truncate">
            {controller.Label({
                label: controller.types[filter.type].label,
                type: filter.type,
                value: filter.value
              })}
            </span>
            <ChevronDownIcon />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <EditDialog
          filter={filter}
          field={field}
          onClose={() => setPopoverOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

function EditDialog({ filter, field, onClose }: EditDialogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [value, setValue] = useState(filter.value);

  // Get the field implementation
  const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex);
  const fieldImpl = getClientField(fieldType);
  const Filter = fieldImpl.filter.Filter;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Create a new URLSearchParams instance
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    // Update the filter value
    newSearchParams.set(`!${filter.field}_${filter.type}`, JSON.stringify(value));
    // Reset to first page when updating a filter
    newSearchParams.set('page', '1');
    
    router.push(`${pathname}?${newSearchParams.toString()}`);
    onClose();
  };

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <div className="px-2 pt-3 pb-1">
        <Filter
          type={filter.type}
          value={value}
          onChange={setValue}
          field={field}
        />
      </div>
      <Separator />
      <div className="flex justify-between gap-2 px-2 pb-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" type="submit">
          Save
        </Button>
      </div>
    </form>
  );
} 