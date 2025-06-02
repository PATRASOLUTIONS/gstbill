"use client"

import { useState } from "react"
import { Search, Filter, FileDown, ArrowUpDown, ArrowDown, ArrowUp, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { PurchaseActions } from "./purchase-actions"
import { useEffect } from "react"
// Update the import at the top to use the detailed export dialog
import { ExportDetailedDialog } from "./export-detailed-dialog"

interface PurchaseOrder {
  _id?: string
  id?: string
  poNumber: string
  supplierName: string
  orderDate: string
  totalAmount: number
  status: string
  paymentStatus: string
  createdAt: string
  attachments?: { fileName: string; fileUrl: string; fileType: string; uploadedAt: string }[]
  [key: string]: any
}

interface PurchaseListProps {
  purchases: PurchaseOrder[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  paymentStatusFilter: string
  setPaymentStatusFilter: (status: string) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  itemsPerPage: number
  totalPages: number
  sortConfig: { key: keyof PurchaseOrder; direction: "ascending" | "descending" } | null
  requestSort: (key: keyof PurchaseOrder) => void
  onViewAttachments: (purchase: PurchaseOrder) => void
  onViewDetails: (purchase: PurchaseOrder) => void
  onEditOrder: (purchase: PurchaseOrder) => void
  onReceiveItems: (purchase: PurchaseOrder) => void
  onRecordPayment: (purchase: PurchaseOrder) => void
  onCancelOrder: (purchase: PurchaseOrder) => void
}

export function PurchaseList({
  purchases,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  paymentStatusFilter,
  setPaymentStatusFilter,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  totalPages,
  sortConfig,
  requestSort,
  onViewAttachments,
  onViewDetails,
  onEditOrder,
  onReceiveItems,
  onRecordPayment,
  onCancelOrder,
}: PurchaseListProps) {
  // State to store filtered and sorted purchases
  const [displayedPurchases, setDisplayedPurchases] = useState<PurchaseOrder[]>([])
  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseOrder[]>([])
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage)
  // Replace the existing state for export dialog
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  // Apply sorting, filtering and search
  useEffect(() => {
    let filtered = [...purchases]

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((purchase) => purchase.status === statusFilter)
    }

    // Apply payment status filter
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter((purchase) => purchase.paymentStatus === paymentStatusFilter)
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (purchase) =>
          purchase.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (purchase.notes && purchase.notes.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply sorting
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    setFilteredPurchases(filtered)

    // Calculate total pages
    const calculatedTotalPages = Math.ceil(filtered.length / itemsPerPage)

    // Adjust current page if it's out of bounds
    if (localCurrentPage > calculatedTotalPages && calculatedTotalPages > 0) {
      setLocalCurrentPage(1)
    }

    // Get current items for pagination
    const startIndex = (localCurrentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setDisplayedPurchases(filtered.slice(startIndex, endIndex))
  }, [purchases, searchTerm, statusFilter, paymentStatusFilter, sortConfig, localCurrentPage, itemsPerPage])

  // Update parent component's current page when local page changes
  useEffect(() => {
    setCurrentPage(localCurrentPage)
  }, [localCurrentPage, setCurrentPage])

  // Format date to show date and time
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A"

    try {
      const date = new Date(dateString)
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return dateString // Return original string if parsing fails
    }
  }

  // Status badge variant helper
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Draft":
        return "secondary"
      case "Ordered":
        return "warning"
      case "Partially Received":
        return "default"
      case "Received":
        return "success"
      case "Cancelled":
        return "destructive"
      default:
        return "default"
    }
  }

  // Payment status badge variant helper
  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Unpaid":
        return "destructive"
      case "Partially Paid":
        return "warning"
      case "Paid":
        return "success"
      default:
        return "default"
    }
  }

  // Helper to render sort indicator
  const renderSortIcon = (key: keyof PurchaseOrder) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setLocalCurrentPage(page)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Calculate total pages
  const calculatedTotalPages = Math.ceil(filteredPurchases.length / itemsPerPage)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-sm items-center space-x-2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search purchase orders..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Statuses</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Draft")}>Draft</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Ordered")}>Ordered</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Partially Received")}>
                  Partially Received
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Received")}>Received</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Cancelled")}>Cancelled</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Payment</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPaymentStatusFilter("all")}>All Payment Statuses</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPaymentStatusFilter("Unpaid")}>Unpaid</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPaymentStatusFilter("Partially Paid")}>
                  Partially Paid
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPaymentStatusFilter("Paid")}>Paid</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => setIsExportDialogOpen(true)}>
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="mt-6 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => requestSort("poNumber")}>
                  <div className="flex items-center">PO Number {renderSortIcon("poNumber")}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("supplierName")}>
                  <div className="flex items-center">Supplier {renderSortIcon("supplierName")}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("orderDate")}>
                  <div className="flex items-center">Order Date {renderSortIcon("orderDate")}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("createdAt")}>
                  <div className="flex items-center">Created At {renderSortIcon("createdAt")}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("totalAmount")}>
                  <div className="flex items-center">Amount {renderSortIcon("totalAmount")}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("status")}>
                  <div className="flex items-center">Status {renderSortIcon("status")}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("paymentStatus")}>
                  <div className="flex items-center">Payment {renderSortIcon("paymentStatus")}</div>
                </TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No purchase orders found.
                  </TableCell>
                </TableRow>
              ) : (
                displayedPurchases.map((purchase) => (
                  <TableRow key={purchase._id || purchase.id}>
                    <TableCell className="font-medium">{purchase.poNumber}</TableCell>
                    <TableCell>{purchase.supplierName}</TableCell>
                    <TableCell>{formatDateTime(purchase.orderDate)}</TableCell>
                    <TableCell>{formatDateTime(purchase.createdAt)}</TableCell>
                    <TableCell>₹{purchase.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(purchase.status) as any}>{purchase.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPaymentStatusBadgeVariant(purchase.paymentStatus) as any}>
                        {purchase.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {purchase.attachments && purchase.attachments.length > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewAttachments(purchase)}
                          className="flex items-center gap-1"
                        >
                          <Paperclip className="h-4 w-4" />
                          <span>{purchase.attachments.length}</span>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <PurchaseActions
                        purchase={purchase}
                        onViewDetails={onViewDetails}
                        onEditOrder={onEditOrder}
                        onReceiveItems={onReceiveItems}
                        onRecordPayment={onRecordPayment}
                        onCancelOrder={onCancelOrder}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(localCurrentPage - 1, 1))}
                  className={localCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {/* First page */}
              {localCurrentPage > 3 && (
                <PaginationItem>
                  <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                </PaginationItem>
              )}

              {/* Ellipsis if needed */}
              {localCurrentPage > 4 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Pages around current page */}
              {Array.from({ length: Math.min(3, calculatedTotalPages) }, (_, i) => {
                const pageNumber = Math.min(Math.max(localCurrentPage - 1 + i, 1), calculatedTotalPages)

                // Skip if this would create a duplicate with first/last page buttons
                if (
                  (localCurrentPage <= 3 && pageNumber === 1) ||
                  (localCurrentPage >= calculatedTotalPages - 2 && pageNumber === calculatedTotalPages)
                ) {
                  return null
                }

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNumber)}
                      isActive={localCurrentPage === pageNumber}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              {/* Ellipsis if needed */}
              {localCurrentPage < calculatedTotalPages - 3 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Last page */}
              {calculatedTotalPages > 3 && localCurrentPage < calculatedTotalPages - 2 && (
                <PaginationItem>
                  <PaginationLink onClick={() => handlePageChange(calculatedTotalPages)}>
                    {calculatedTotalPages}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(localCurrentPage + 1, calculatedTotalPages))}
                  className={
                    localCurrentPage === calculatedTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        {/* Export Dialog */}
        <ExportDetailedDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen} purchases={purchases} />
      </CardContent>
    </Card>
  )
}
