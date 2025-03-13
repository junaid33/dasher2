import { getList, createItem, getKeystoneAdminMetaWithItemView } from "@/lib/graphql";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemFormFields } from "../[id]/ItemFormFields";

interface PageProps {
  params: { listKey: string };
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

function ErrorDisplay({ title, message }: { title: string; message: string }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-red-600">{title}</h1>
      <p className="mt-2 text-gray-600">{message}</p>
    </div>
  );
}

export default async function CreatePage({ params, searchParams }: PageProps) {
  const listKeyParam = await params.listKey;
  const searchParamsObj = Object.fromEntries(
    Object.entries(await searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value : value?.toString(),
    ])
  );

  let adminMetaData;
  try {
    adminMetaData = await getKeystoneAdminMetaWithItemView();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return <ErrorDisplay title="Error Loading Lists" message={`There was an error loading the available lists: ${errorMessage}`} />;
  }

  const listsObject = Object.fromEntries(adminMetaData.keystone.adminMeta.lists.map((list: any) => [list.path, list.key]));
  const listKey = listsObject[listKeyParam];
  if (!listKey) return <ErrorDisplay title="Invalid List" message="The requested list could not be found." />;

  let list;
  try {
    list = await getList(listKey);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return <ErrorDisplay title="Error Creating Item" message={`There was an error creating the item: ${errorMessage}`} />;
  }

  const fields = adminMetaData.keystone.adminMeta.lists
    .find((l: any) => l.key === listKey)
    .fields.filter((field: Field) => field.itemView?.fieldMode !== "hidden");
  const formFields = fields.filter((f: Field) => (f.itemView?.fieldPosition || "form") === "form");
  const sidebarFields = fields.filter((f: Field) => (f.itemView?.fieldPosition || "form") === "sidebar");
  const itemData = Object.fromEntries(formFields.concat(sidebarFields).map((f: Field) => [f.path, f.fieldMeta?.defaultValue || null]));

  return (
    <section className="flex flex-col">
      <div className="flex flex-col p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-col">
            <h1 className="text-lg font-semibold md:text-2xl">Create {list.singular}</h1>
            <p className="text-muted-foreground">
              {list.description || `Create a new ${list.singular.toLowerCase()}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${list.path}`}>
              <Button className="relative pe-12" size="sm" variant="outline">
                Cancel
                <span className="pointer-events-none absolute inset-y-0 end-0 flex w-9 items-center justify-center bg-primary-foreground/15">
                  <X className="opacity-60" size={16} strokeWidth={2} />
                </span>
              </Button>
            </Link>
            <Button className="relative pe-12" size="sm" type="submit" form="create-form">
              Create {list.singular}
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
              id="create-form"
              action={async (formData) => {
                "use server";
                const data: Record<string, any> = {};
                for (const [key, value] of formData.entries()) data[key] = value;
                const result = await createItem(list, data);
                redirect(`/${list.path}/${result.item.id}`);
              }}
              className="space-y-8"
            >
              <ItemFormFields fields={formFields} itemData={itemData} kind="create" />
            </form>
          </div>
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <ItemFormFields fields={sidebarFields} itemData={itemData} kind="create" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 