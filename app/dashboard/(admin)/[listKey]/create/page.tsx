import { getList, createItem } from "@/lib/graphql";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFieldTypeFromViewsIndex, getClientField } from "@/views/registry";
import { Check, ChevronRight, X } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: { listKey: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

interface Field {
  path: string;
  label: string;
  viewsIndex: number;
  itemView?: {
    fieldMode?: string;
    fieldPosition?: string;
  };
}

interface List {
  key: string;
  path: string;
  label: string;
  singular: string;
  plural: string;
  description?: string;
  labelField: string;
  fields: Record<string, any>;
  gqlNames: Record<string, string>;
}

export default async function CreatePage({ params, searchParams }: PageProps) {
  const listKeyParam = params.listKey;
  const searchParamsObj = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map((v) => v.toString()) : value?.toString(),
    ])
  );

  try {
    // Get the list key from URL parameters
    const adminMetaData = await fetch("http://localhost:3000/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "cm7pag5lk002s6lq83d747l2j",
      },
      body: JSON.stringify({
        query: `
          query {
            keystone {
              adminMeta {
                lists {
                  key
                  path
                  label
                  singular
                  plural
                  description
                  labelField
                  fields {
                    path
                    label
                    isFilterable
                    isOrderable
                    viewsIndex
                    fieldMeta
                    itemView {
                      fieldMode
                      fieldPosition
                    }
                  }
                }
              }
            }
          }
        `,
      }),
      cache: "no-store",
    }).then((res) => res.json()).then((data) => data.data);

    const listsObject: { [key: string]: string } = {};
    for (const list of adminMetaData.keystone.adminMeta.lists) {
      listsObject[list.path] = list.key;
    }

    const listKey = listsObject[listKeyParam];

    if (!listKey) {
      return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold tracking-tight text-red-600">
            Invalid List
          </h1>
          <p className="mt-2 text-gray-600">
            The requested list could not be found.
          </p>
        </div>
      );
    }

    try {
      const list = await getList(listKey);

      // Get fields that can be displayed/edited
      const fields = adminMetaData.keystone.adminMeta.lists
        .find((l: any) => l.key === listKey)
        .fields.filter((field: Field) => {
          const itemView = field.itemView || {};
          return itemView.fieldMode !== "hidden";
        });

      // Organize fields by position
      const formFields = fields.filter(
        (field: Field) => (field.itemView?.fieldPosition || "form") === "form"
      );
      
      const sidebarFields = fields.filter(
        (field: Field) => (field.itemView?.fieldPosition || "form") === "sidebar"
      );

      return (
        <section className="flex flex-col">
          <div className="flex flex-col p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-col">
                <h1 className="text-lg font-semibold md:text-2xl">
                  Create {list.singular}
                </h1>
                <p className="text-muted-foreground">
                  {list.description ? (
                    <p>{list.description}</p>
                  ) : (
                    <span>
                      Create a new{" "}
                      <span className="lowercase">{list.singular}</span>
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/${list.path}`}>
                  <Button
                    className="relative pe-12"
                    size="sm"
                    variant="outline"
                  >
                    Cancel
                    <span className="pointer-events-none absolute inset-y-0 end-0 flex w-9 items-center justify-center bg-primary-foreground/15">
                      <X
                        className="opacity-60"
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </span>
                  </Button>
                </Link>
                <Button
                  className="relative pe-12"
                  size="sm"
                  type="submit"
                  form="create-form"
                >
                  Create {list.singular}
                  <span className="pointer-events-none absolute inset-y-0 end-0 flex w-9 items-center justify-center bg-primary-foreground/15">
                    <Check
                      className="opacity-60"
                      size={16}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                <form 
                  id="create-form"
                  action={async (formData) => {
                    "use server";
                    
                    // Convert formData to an object
                    const data: Record<string, any> = {};
                    for (const [key, value] of formData.entries()) {
                      data[key] = value;
                    }
                    
                    const result = await createItem(list, data);
                    redirect(`/${list.path}/${result.item.id}`);
                  }}
                  className="space-y-8"
                >
                  {formFields.map((field: Field) => {
                    const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex);
                    const FieldComponent = getClientField(fieldType)?.Field;
                    
                    if (!FieldComponent) {
                      return (
                        <div key={field.path} className="space-y-2">
                          <label className="text-sm font-medium">{field.label}</label>
                          <div className="text-muted-foreground">
                            Field type {fieldType} not implemented
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={field.path} className="space-y-2">
                        <FieldComponent
                          field={field}
                          value={{
                            value: "",
                            kind: "create"
                          }}
                        />
                      </div>
                    );
                  })}
                </form>
              </div>
              
              <div className="lg:col-span-1">
                <div className="space-y-6">
                  {sidebarFields.map((field: Field) => {
                    const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex);
                    const FieldComponent = getClientField(fieldType)?.Field;
                    
                    if (!FieldComponent) {
                      return (
                        <div key={field.path} className="space-y-2">
                          <label className="text-sm font-medium">{field.label}</label>
                          <div className="text-muted-foreground">
                            Field type {fieldType} not implemented
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={field.path} className="space-y-2">
                        <FieldComponent
                          field={field}
                          value={{
                            value: "",
                            kind: "create"
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold tracking-tight text-red-600">
            Error Creating Item
          </h1>
          <p className="mt-2 text-gray-600">
            There was an error creating the item. Please try again later.
          </p>
          <pre className="mt-4 p-4 bg-gray-100 rounded-md overflow-auto text-sm">
            {errorMessage}
          </pre>
        </div>
      );
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-red-600">
          Error Loading Lists
        </h1>
        <p className="mt-2 text-gray-600">
          There was an error loading the available lists. Please try again
          later.
        </p>
        <pre className="mt-4 p-4 bg-gray-100 rounded-md overflow-auto text-sm">
          {errorMessage}
        </pre>
      </div>
    );
  }
} 