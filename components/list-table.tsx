"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";
import { getFieldTypeFromViewsIndex, getClientField, getServerField } from '../views/registry';
import { makeDataGetter } from "@/lib/utils/makeDataGetter";

// Define types for the list and field structures
interface Field {
  path: string;
  label: string;
  viewsIndex: number;
  [key: string]: any;
}

interface ListMeta {
  path: string;
  fields: Record<string, Field>;
  singular: string;
  plural: string;
  [key: string]: any;
}

interface ListItem {
  id: string;
  [key: string]: any;
}

interface ListData {
  items: ListItem[];
  meta?: {
    count: number;
    [key: string]: any;
  };
}

// Helper function to get GraphQL selections for a field
export function getFieldSelections(field: Field, fieldKey: string): string {
  const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex);
  const serverImpl = getServerField(fieldType);
  
  if (serverImpl?.getGraphQLSelection) {
    return serverImpl.getGraphQLSelection(fieldKey, field);
  }
  
  return fieldKey;
}

interface ListTableProps {
  data: ListData;
  list: ListMeta;
  selectedFields: string[];
}

export function ListTable({ data, list, selectedFields }: ListTableProps) {
  if (!data || !data.items) {
    return <div>No data available</div>
  }

  // Create a data getter to handle null values and nested fields
  const dataGetter = makeDataGetter(data);

  // Function to render cell content based on field type
  const renderCellContent = (item: ListItem, fieldKey: string) => {
    const field = list.fields[fieldKey];
    const fieldType = getFieldTypeFromViewsIndex(field?.viewsIndex);
    const fieldImpl = getClientField(fieldType);

    // If the field has no value, render null state
    if (item[fieldKey] === null || item[fieldKey] === undefined) {
      return <div className="font-mono text-xs rounded-sm px-2 py-1 border-dashed border italic">null</div>
    }

    // If the field type has a Cell component, use it
    if (fieldImpl?.Cell) {
      return <fieldImpl.Cell item={item} field={field} />
    }

    // Fallback to basic string representation
    return String(item[fieldKey])
  }

  return (
    <div className="rounded-md">
      <ScrollArea className="w-full whitespace-nowrap">
        <Table>
          <TableHeader>
            <TableRow className="border-y border-gray-200 dark:border-gray-800">
              {selectedFields.map((fieldKey: string) => (
                <TableHead
                  key={fieldKey}
                  className="whitespace-nowrap py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {list.fields[fieldKey]?.label || fieldKey}
                </TableHead>
              ))}
              <TableHead className="whitespace-nowrap py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item: ListItem) => (
              <TableRow key={item.id} className="group select-none hover:bg-muted">
                {selectedFields.map((fieldKey: string) => (
                  <TableCell
                    key={`${item.id}-${fieldKey}`}
                    className="whitespace-nowrap py-3 px-4 text-sm text-gray-600 dark:text-gray-400"
                  >
                    {renderCellContent(item, fieldKey)}
                  </TableCell>
                ))}
                <TableCell className="whitespace-nowrap py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                  <Link
                    href={`/dashboard/${list.path}/${item.id}`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

