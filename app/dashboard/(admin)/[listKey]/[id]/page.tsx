import { getListByPath } from "@/lib/hooks/getAdminMeta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, CircleAlert, X, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ItemPageClient } from "./ItemPageClient";
import { getItem } from "@/lib/graphql";

interface PageProps {
  params: { listKey: string; id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

interface Field {
  path: string;
  label: string;
  viewsIndex: number;
  description?: string;
  fieldMeta?: {
    validation?: {
      isRequired?: boolean;
      length?: { min: number | null; max: number | null };
      match?: { regex: RegExp; explanation?: string };
    };
    defaultValue?: any;
    isNullable?: boolean;
    options?: Array<{ value: any; label: string }>;
  };
  itemView?: {
    fieldMode?: string;
    fieldPosition?: string;
  };
}

function ErrorDisplay({ title, message, list }: { title: string; message: string; list?: { path: string; label: string } }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-red-600">{title}</h1>
      <p className="mt-2 text-gray-600">{message}</p>
      {list && (
        <Link href={`/${list.path}`}>
          <Button variant="outline" className="mt-4">Back to {list.label}</Button>
        </Link>
      )}
    </div>
  );
}

export default async function ItemPage({ params, searchParams }: PageProps) {
  const { id, listKey: listKeyParam } = params;
  const searchParamsObj = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value : value?.toString(),
    ])
  );

  try {
    // Get the list by path using our cached function
    const list = await getListByPath(listKeyParam);
    
    if (!list) {
      return <ErrorDisplay title="Invalid List" message="The requested list could not be found." />;
    }
    
    // Fetch the item data on the server
    const itemData = await getItem(list, id);
    
    if (!itemData.item) {
      return <ErrorDisplay 
        title="Item Not Found" 
        message="The requested item could not be found." 
        list={{ path: list.path, label: list.label }}
      />;
    }

    return (
      <ItemPageClient 
        list={list} 
        item={itemData.item}
        id={id} 
        searchParams={searchParamsObj} 
      />
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return <ErrorDisplay title="Error Loading Item" message={`There was an error loading the item: ${errorMessage}`} />;
  }
}
