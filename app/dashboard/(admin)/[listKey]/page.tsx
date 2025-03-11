import { getList, getListData } from "@/lib/graphql";
import Link from "next/link";
import { fetchGraphQL } from "@/lib/graphql";
import { getSort } from "@/lib/utils/sort";
import { Plus } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FloatingUIWrapper } from "@/components/ui/floating-ui-wrapper";
import { ListTable } from "@/components/list-table";
import { FilterBar } from "@/components/filter-bar";

interface PageProps {
  params: { listKey: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ListPage({ params, searchParams }: PageProps) {
  const listKeyParam = await params.listKey;
  const searchParamsObj = Object.fromEntries(
    Object.entries(await searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map((v) => v.toString()) : value?.toString(),
    ])
  );

  try {
    // Get the list key from URL parameters
    const adminMetaData = await fetchGraphQL(`
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
              fields {
                path
                label
                isFilterable
                isOrderable
                viewsIndex
              }
            }
          }
        }
      }
    `);

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
      const data = await getListData(list, searchParamsObj);

      const { count, currentPage, pageSize, selectedFields, sort } = data.meta;

      // Get filterable and orderable fields
      const filterableFields = new Set<string>();
      const orderableFields = new Set<string>();
      const searchFields: string[] = [];

      const fullList = adminMetaData.keystone.adminMeta.lists.find(
        (l: any) => l.key === listKey
      );

      if (fullList) {
        fullList.fields.forEach((field: any) => {
          if (field.isFilterable) filterableFields.add(field.path);
          if (field.isOrderable) orderableFields.add(field.path);
          if (field.isFilterable) searchFields.push(field.label);
        });
      }

      return (
        <section
          aria-label={`${list.label} overview`}
          className="h-screen overflow-hidden flex flex-col"
        >
          <header className="sticky top-0 z-30 bg-background flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <div className="flex items-center gap-2 w-full justify-between">
              <div className="flex items-center gap-2">
                <div className="hidden md:flex">
                  <nav className="flex" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-4">
                      <li>
                        <div>
                          <Link
                            href="/"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground"
                          >
                            Dashboard
                          </Link>
                        </div>
                      </li>
                      <li>
                        <div className="flex items-center">
                          <svg
                            className="h-5 w-5 flex-shrink-0 text-muted-foreground"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                          </svg>
                          <Link
                            href={`/${list.path}`}
                            className="ml-4 text-sm font-medium text-primary"
                            aria-current="page"
                          >
                            {list.label}
                          </Link>
                        </div>
                      </li>
                    </ol>
                  </nav>
                </div>
              </div>
            </div>
          </header>

          <div className="flex flex-col flex-1 min-h-0">
            <div className="pb-4 pt-4 md:pt-6 px-4 md:px-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                {list.label}
              </h1>
              <p className="text-muted-foreground">
                {list.description ? (
                  list.description
                ) : (
                  <span>
                    Create and manage{" "}
                    <span className="lowercase">{list.label}</span>
                  </span>
                )}
              </p>
            </div>
            <FilterBar
              listMeta={list}
              selectedFields={selectedFields}
              currentSort={sort}
            />
            <main className="flex-1 min-h-0 overflow-auto">
              {data.items.length > 0 ? (
                <ListTable
                  data={data}
                  list={list}
                  selectedFields={selectedFields.filter(
                    (field: string) => field !== "id"
                  )}
                />
              ) : (
                <div className="text-center flex flex-col items-center justify-center bg-muted/40 p-10 h-full">
                  <div className="relative h-11 w-11 mx-auto mb-2">
                    <svg
                      className="absolute left-1 top-1 w-4 h-4 fill-indigo-200 stroke-indigo-400 dark:stroke-indigo-600 dark:fill-indigo-950 rotate-[90deg]"
                      viewBox="0 0 24 24"
                    >
                      <polygon points="12 2 19 21 12 17 5 21 12 2" />
                    </svg>
                    <svg
                      className="absolute right-[.2rem] top-1 w-4 h-4 fill-orange-300 stroke-orange-500 dark:stroke-amber-600 dark:fill-amber-950 rotate-[30deg]"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    </svg>
                    <svg
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 fill-emerald-200 stroke-emerald-400 dark:stroke-emerald-600 dark:fill-emerald-900"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </div>
                  <p className="mt-2 text-sm font-medium">
                    No <span className="lowercase">{list.label}</span>
                  </p>
                  {searchParamsObj.search ||
                  Object.keys(searchParamsObj).some((key) =>
                    key.startsWith("!")
                  ) ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Found matching your{" "}
                        {searchParamsObj.search ? "search" : "filters"}
                      </p>
                      <Link href={`/${list.path}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 mt-2"
                        >
                          Clear filters & search
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Get started by creating a new one.
                      </p>
                    </>
                  )}
                </div>
              )}
            </main>

            {/* Floating UI for Pagination */}
            {data.items.length > 0 && (
              <FloatingUIWrapper
                currentPage={currentPage}
                total={count}
                pageSize={pageSize}
                list={{ singular: list.singular, plural: list.plural }}
              />
            )}
          </div>
        </section>
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold tracking-tight text-red-600">
            Error Loading List
          </h1>
          <p className="mt-2 text-gray-600">
            There was an error loading the list. Please try again later.
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
