"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function Pagination({ totalItems, pageSize, currentPage, listMeta }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize)

  // Create a new URLSearchParams instance to manipulate
  const createQueryString = (params) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())

    // Update or delete parameters based on the provided object
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, value)
      }
    })

    return newSearchParams.toString()
  }

  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return

    const query = createQueryString({ page })
    router.push(`${pathname}?${query}`)
  }

  // Handle page size change
  const handlePageSizeChange = (size) => {
    const query = createQueryString({ pageSize: size, page: 1 })
    router.push(`${pathname}?${query}`)
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are fewer than maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate start and end of page range
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if at the beginning or end
      if (currentPage <= 2) {
        end = Math.min(totalPages - 1, 4)
      } else if (currentPage >= totalPages - 1) {
        start = Math.max(2, totalPages - 3)
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push("...")
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push("...")
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  // Don't show pagination if there's only one page
  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing page {currentPage} of {totalPages}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center">
          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2">
                ...
              </span>
            ) : (
              <Button
                key={`page-${page}`}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="h-8 w-8 mx-0.5"
              >
                {page}
              </Button>
            ),
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(value)}>
          <SelectTrigger className="w-[100px] h-8 text-xs">
            <SelectValue placeholder="Page size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="25">25 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

