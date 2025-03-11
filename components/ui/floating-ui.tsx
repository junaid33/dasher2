"use client"

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { ScrollArea } from "./scroll-area";
import { Button } from "./button";
import { Input } from "./input";

interface ListInfo {
  singular: string;
  plural: string;
}

interface FloatingUIProps {
  currentPage?: number;
  total?: number;
  pageSize?: number;
  list?: ListInfo;
  selectedItems?: Set<string>;
  onResetSelection?: () => void;
  onDelete?: () => void;
  isDeleteLoading?: boolean;
}

/**
 * FloatingUI component that combines pagination and item deletion functionality
 */
export function FloatingUI({
  currentPage = 1,
  total = 0,
  pageSize = 10,
  list = { singular: "item", plural: "items" },
  selectedItems = new Set<string>(),
  onResetSelection,
  onDelete,
  isDeleteLoading = false,
}: FloatingUIProps) {
  const [currentPageInput, setCurrentPageInput] = useState(
    currentPage.toString()
  );
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  // Total pages calculation
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Update input field when currentPage changes
  useEffect(() => {
    setCurrentPageInput(currentPage.toString());
  }, [currentPage]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const page = Math.max(1, Math.min(totalPages, Number(newPage)));
    if (page !== currentPage) {
      const newQuery = getQueryString({ page });
      router.push(`${pathname}?${newQuery}`);
    }
  };

  // Handle page input change
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setCurrentPageInput(value);
    }
  };

  // Handle page input blur
  const handlePageInputBlur = () => {
    if (currentPageInput === "") {
      setCurrentPageInput(currentPage.toString());
    } else {
      handlePageChange(Number(currentPageInput));
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    const size = Math.max(1, Number(newSize));
    // Reset to page 1 when changing page size
    const newQuery = getQueryString({ pageSize: size, page: 1 });
    router.push(`${pathname}?${newQuery}`);
  };

  // Helper function to get query string
  const getQueryString = (newParams: Record<string, number>) => {
    const allParams = new URLSearchParams(query);
    Object.keys(newParams).forEach((key) => {
      allParams.set(key, newParams[key].toString());
    });
    return allParams.toString();
  };

  // Generate stats message
  const getStatsMessage = () => {
    if (total > pageSize) {
      const start = pageSize * (currentPage - 1) + 1;
      const end = Math.min(start + pageSize - 1, total);
      return (
        <div className="flex items-center gap-x-1 text-xs sm:text-sm">
          <span className="text-white">{start}</span>
          {start !== end ? (
            <>
              <span className="text-zinc-500">-</span>
              <span className="text-white">{end}</span>
            </>
          ) : (
            ""
          )}
          <span className="text-zinc-400 uppercase tracking-wide text-xs sm:text-sm">of</span>
          <span className="text-white">{total}</span>
          <span className="text-zinc-400 uppercase tracking-wide text-xs sm:text-sm hidden sm:inline truncate">
            {list.plural.toLowerCase()}
          </span>
        </div>
      );
    } else {
      if (total > 1 && list.plural) {
        return (
          <div className="flex items-center gap-x-1 text-xs sm:text-sm">
            <span className="text-white">{total}</span>
            <span className="text-zinc-400 uppercase tracking-wide text-xs sm:text-sm hidden sm:inline truncate">
              {list.plural.toLowerCase()}
            </span>
          </div>
        );
      } else if (total === 1 && list.singular) {
        return (
          <div className="flex items-center gap-x-1 text-xs sm:text-sm">
            <span className="text-white">{total}</span>
            <span className="text-zinc-400 uppercase tracking-wide text-xs sm:text-sm hidden sm:inline truncate">
              {list.singular.toLowerCase()}
            </span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-x-1 text-xs sm:text-sm">
            <span className="text-white">0</span>
            <span className="text-zinc-400 uppercase tracking-wide text-xs sm:text-sm hidden sm:inline truncate">
              {list.plural.toLowerCase()}
            </span>
          </div>
        );
      }
    }
  };

  // Check if in selection mode
  const isSelectionMode = selectedItems.size > 0;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-300">
      <div className="flex items-center gap-x-1 rounded-full bg-zinc-950 p-1 text-sm shadow-xl shadow-black/20 ring-1 ring-white/10">
        {isSelectionMode ? (
          // Selection mode UI
          <>
            <AlertDialog open={isOpen}>
              <AlertDialogTrigger asChild>
                <button
                  onClick={() => setIsOpen(true)}
                  className="flex items-center gap-x-2 whitespace-nowrap rounded-l-[20px] rounded-r-md bg-zinc-900 py-1.5 sm:py-2 pl-3 sm:pl-4 pr-1.5 sm:pr-2 font-semibold text-zinc-50 ring-1 ring-inset ring-white/20 hover:bg-zinc-800/90 hover:text-white transition-colors text-xs sm:text-sm h-8 sm:h-9"
                  disabled={isDeleteLoading}
                >
                  <X className="-ml-1 size-4 sm:size-5 shrink-0" />
                  <span className="truncate">Delete {selectedItems.size} selected</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Confirmation</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedItems.size}{" "}
                    {selectedItems.size === 1 ? list.singular : list.plural}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsOpen(false)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (onDelete) onDelete();
                      setIsOpen(false);
                    }}
                    disabled={isDeleteLoading}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <button
              onClick={onResetSelection}
              className="flex items-center gap-x-2 whitespace-nowrap rounded-r-[20px] rounded-l-md bg-zinc-900 py-1.5 sm:py-2 pl-3 sm:pl-4 pr-3 sm:pr-4 font-semibold text-zinc-50 ring-1 ring-inset ring-white/20 hover:bg-zinc-800/90 hover:text-white transition-colors text-xs sm:text-sm h-8 sm:h-9"
            >
              Reset
            </button>
          </>
        ) : (
          // Pagination UI
          <>
            {/* Previous Page Button */}
            <button
              className="bg-gradient-to-b from-white to-zinc-200 text-zinc-900 rounded-l-[20px] rounded-r-md p-1.5 sm:p-2 font-semibold ring-1 ring-inset ring-white/20 hover:shadow-md hover:bg-white disabled:opacity-50 disabled:hover:bg-zinc-200 disabled:hover:shadow-none disabled:cursor-not-allowed text-xs sm:text-sm h-8 sm:h-9 flex items-center justify-center w-9 sm:w-auto"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Page Navigation */}
            <div className="flex items-center gap-x-1 rounded-md bg-zinc-900 py-1.5 sm:py-2 pr-2 pl-1 font-semibold text-zinc-50 ring-1 ring-inset ring-white/20 h-8 sm:h-9">
              <div className="flex items-center gap-x-1.5 px-2">
                <input
                  className="w-5 sm:w-6 bg-transparent border-0 p-0 text-center text-xs sm:text-sm font-medium text-zinc-50 focus:ring-0 h-full"
                  type="text"
                  value={currentPageInput}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputBlur}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter") {
                      handlePageChange(Number(currentPageInput));
                    }
                  }}
                />
                <span className="text-zinc-500 font-medium text-xs sm:text-sm">/</span>
                <span className="text-zinc-500 font-medium text-xs sm:text-sm">{totalPages}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-x-2 whitespace-nowrap rounded-md bg-zinc-900 py-1.5 sm:py-2 px-3 sm:px-4 font-semibold text-zinc-50 ring-1 ring-inset ring-white/20 h-8 sm:h-9">
              {getStatsMessage()}
            </div>

            {/* Items Per Page Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex gap-2 items-center whitespace-nowrap rounded-md bg-zinc-900 text-zinc-50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold ring-1 ring-inset ring-white/20 h-8 sm:h-9">
                  {pageSize}
                  <span className="text-zinc-400 uppercase tracking-wide hidden sm:inline">
                    per page
                  </span>

                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5 sm:ml-1 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel className="text-xs sm:text-sm">Page Size</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="max-h-72">
                  {[5, 10, 25, 50, 100].map((size) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => handlePageSizeChange(size)}
                      className="flex justify-between items-center gap-2 text-xs sm:text-sm"
                    >
                      <span className="font-medium">{size}</span>
                      <span className="text-zinc-400 uppercase tracking-wide text-xs">
                        per page
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />

                  <div className="flex gap-1 items-center justify-between">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        const newSize = Math.max(1, pageSize - 5);
                        handlePageSizeChange(newSize);
                      }}
                    >
                      <Minus />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={pageSize}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = parseInt(e.target.value, 10);
                        if (!isNaN(value) && value > 0) {
                          handlePageSizeChange(value);
                        } else if (e.target.value === "") {
                          // Allow empty input temporarily while typing
                          e.target.value = "";
                        } else {
                          // Reset to 1 if invalid input
                          handlePageSizeChange(1);
                        }
                      }}
                      className="h-9 rounded-lg w-24"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        const newSize = pageSize + 5;
                        handlePageSizeChange(newSize);
                      }}
                    >
                      <Plus />
                    </Button>
                  </div>
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Next Page Button */}
            <button
              className="bg-gradient-to-b from-white to-zinc-200 text-zinc-900 rounded-r-[20px] rounded-l-md p-1.5 sm:p-2 font-semibold ring-1 ring-inset ring-white/20 hover:shadow-md hover:bg-white disabled:opacity-50 disabled:hover:bg-zinc-200 disabled:hover:shadow-none disabled:cursor-not-allowed text-xs sm:text-sm h-8 sm:h-9 flex items-center justify-center w-9 sm:w-auto"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
} 