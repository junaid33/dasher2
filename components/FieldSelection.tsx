'use client';

import { useState, ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Columns3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListMeta } from './filter-bar';

interface FieldSelectionProps {
  listMeta: ListMeta;
  selectedFields: string[];
  children: ReactNode;
}

function isArrayEqual(arrA: string[], arrB: string[]) {
  if (arrA.length !== arrB.length) return false;
  for (let i = 0; i < arrA.length; i++) {
    if (arrA[i] !== arrB[i]) {
      return false;
    }
  }
  return true;
}

function FieldSelectionContent({ 
  onClose, 
  listMeta, 
  selectedFields: currentSelectedFields 
}: { 
  onClose: () => void; 
  listMeta: ListMeta;
  selectedFields: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Create a query object that behaves like the old query object
  const query: Record<string, string> = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const selectedFields = new Set(currentSelectedFields);

  const setNewSelectedFields = (fields: string[]) => {
    if (isArrayEqual(fields, listMeta.initialColumns || [])) {
      const { fields: _ignore, ...otherQueryFields } = query;
      router.push(
        `${pathname}?${new URLSearchParams(otherQueryFields)}`
      );
    } else {
      router.push(
        `${pathname}?${new URLSearchParams({
          ...query,
          fields: fields.join(","),
        })}`
      );
    }
  };

  const fields = Object.entries(listMeta.fields)
    .filter(([path]) => path !== 'id') // Exclude ID field as it's always included
    .map(([path, field]) => ({
      value: path,
      label: field.label,
      isDisabled: selectedFields.size === 1 && selectedFields.has(path),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <DropdownMenuLabel>Display columns</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <ScrollArea className="max-h-72">
        {fields.map((field) => (
          <DropdownMenuCheckboxItem
            key={field.value}
            checked={selectedFields.has(field.value)}
            onCheckedChange={(checked) => {
              const newSelectedFields = new Set(selectedFields);
              if (checked) {
                newSelectedFields.add(field.value);
              } else {
                newSelectedFields.delete(field.value);
              }
              setNewSelectedFields(Array.from(newSelectedFields));
            }}
            disabled={field.isDisabled}
          >
            {field.label}
          </DropdownMenuCheckboxItem>
        ))}
      </ScrollArea>
    </>
  );
}

export function FieldSelection({ listMeta, selectedFields, children }: FieldSelectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {isOpen && (
          <FieldSelectionContent
            onClose={() => setIsOpen(false)}
            listMeta={listMeta}
            selectedFields={selectedFields}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 