import {
  getItem,
  updateItem,
  deleteItem,
} from "@/lib/graphql";
import { getListByPath } from "@/lib/hooks/getAdminMeta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, CircleAlert, X } from "lucide-react";
import { ItemFormFields } from "./ItemFormFields";
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
  const { id, listKey: listKeyParam } = await params;
  const searchParamsObj = Object.fromEntries(
    Object.entries(await searchParams).map(([key, value]) => [
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

    // Fetch the item data
    const data = await getItem(list, id, searchParamsObj);
    
    if (!data.item) {
      return <ErrorDisplay 
        title="Item Not Found" 
        message="The requested item could not be found." 
        list={list} 
      />;
    }

    const itemLabel = data.item[list.labelField] || data.item.id;
    
    // Filter fields based on their itemView.fieldMode
    const fields = Object.values(list.fields).filter(field => field.itemView?.fieldMode !== "hidden");
    const formFields = fields.filter(f => (f.itemView?.fieldPosition || "form") === "form");
    const sidebarFields = fields.filter(f => (f.itemView?.fieldPosition || "form") === "sidebar");

    return (
      <section className="flex flex-col">
        <div className="flex flex-col p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-col">
              <h1 className="text-lg font-semibold md:text-2xl">Manage {itemLabel}</h1>
              <p className="text-muted-foreground">
                {list.description || `Update or delete this ${list.singular.toLowerCase()}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Delete Button with Dialog */}
              <form action={async () => { "use server"; await deleteItem(list, id); redirect(`/${list.path}`); }}>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="relative pe-12" size="sm" variant="destructive">
                      Delete
                      <span className="pointer-events-none absolute inset-y-0 end-0 flex w-9 items-center justify-center bg-primary-foreground/15">
                        <X className="opacity-60" size={16} strokeWidth={2} />
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border">
                        <CircleAlert className="opacity-80" size={16} strokeWidth={2} />
                      </div>
                      <DialogHeader>
                        <DialogTitle className="text-sm line-clamp-3">Are you sure you want to delete {itemLabel}?</DialogTitle>
                        <DialogDescription className="mt-1">This action cannot be undone.</DialogDescription>
                      </DialogHeader>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button className="rounded-lg" variant="outline">Cancel</Button></DialogClose>
                      <Button className="rounded-lg" variant="destructive" type="submit">Delete</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </form>
              <Button className="relative pe-12" size="sm" type="submit" form="item-form">
                Save changes
                <span className="pointer-events-none absolute inset-y-0 end-0 flex w-9 items-center justify-center bg-primary-foreground/15">
                  <Check className="opacity-60" size={16} strokeWidth={2} />
                </span>
              </Button>
            </div>
          </div>

          {/* Form and Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <form
                id="item-form"
                action={async (formData) => {
                  "use server";
                  const data: Record<string, any> = {};
                  for (const [key, value] of formData.entries()) if (key !== "id") data[key] = value;
                  await updateItem(list, id, data);
                }}
                className="space-y-8"
              >
                <input type="hidden" name="id" value={id} />
                <ItemFormFields fields={formFields} itemData={data.item} kind="update" />
              </form>
            </div>
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Item ID</label>
                  <code className="py-[9px] border flex px-4 items-center rounded-md shadow-sm bg-muted/40 font-mono text-sm font-medium">
                    {data.item.id}
                  </code>
                </div>
                <ItemFormFields fields={sidebarFields} itemData={data.item} kind="update" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return <ErrorDisplay title="Error Loading Item" message={`There was an error loading the item: ${errorMessage}`} />;
  }
}
