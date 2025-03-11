'use client';

import { useState, ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListMeta, SortOption } from './filter-bar';

interface SortSelectionProps {
  listMeta: ListMeta;
  currentSort: SortOption | null;
  children: ReactNode;
}

export function SortSelection({ listMeta, currentSort, children }: SortSelectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Create a query object that behaves like the old query object
  const query: Record<string, string> = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const sortIcons = {
    ASC: <Badge className="h-4 border py-0 px-1 text-[.5rem] leading-[.85rem] -mr-1">ASC</Badge>,
    DESC: <Badge className="h-4 border py-0 px-1 text-[.5rem] leading-[.85rem] -mr-1">DESC</Badge>,
  };

  const resetSort = () => {
    const newQueryParams = new URLSearchParams(query);
    newQueryParams.delete('sortBy');
    router.push(`${pathname}?${newQueryParams.toString()}`);
    setIsOpen(false);
  };

  const handleSortChange = (fieldPath: string) => {
    let newSortQuery = '';
    
    if (currentSort?.field === fieldPath) {
      // Toggle direction if same field
      newSortQuery = currentSort.direction === 'ASC' ? `-${fieldPath}` : fieldPath;
    } else {
      // Default to ASC for new field
      newSortQuery = fieldPath;
    }

    const newQueryParams = new URLSearchParams({
      ...query,
      sortBy: newSortQuery,
    });
    
    router.push(`${pathname}?${newQueryParams.toString()}`);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <div className="flex items-center justify-between py-1.5">
          <DropdownMenuLabel className="py-0">Sort by</DropdownMenuLabel>
          {currentSort && (
            <Badge
              variant="destructive"
              onClick={resetSort}
              className="mr-2 text-xs uppercase border tracking-wide font-medium py-0.5 px-1.5 cursor-pointer"
            >
              Clear
            </Badge>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-[300px]">
          {Object.entries(listMeta.fields)
            .filter(([_, field]) => field.isOrderable)
            .map(([fieldPath, field]) => (
              <DropdownMenuItem
                key={fieldPath}
                onSelect={() => handleSortChange(fieldPath)}
              >
                <span className="flex items-center justify-between w-full">
                  {field.label}
                  {currentSort?.field === fieldPath && sortIcons[currentSort.direction]}
                </span>
              </DropdownMenuItem>
            ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 