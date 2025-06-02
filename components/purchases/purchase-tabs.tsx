"use client"

import { useState, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight, FileText, Eye, Edit, Check, CreditCard, X, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface PurchaseTabsProps {
  purchases: any[]
  searchTerm: string
  setSearchTerm: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  paymentStatusFilter: string
  setPaymentStatusFilter: (value: string) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  itemsPerPage: number
  totalPages: number
  sortConfig: any
  requestSort: (key: string) => void
  onViewAttachments: (purchase: any) => void
  onViewDetails: (purchase: any) => void
  onEditOrder: (purchase: any) => void
  onReceiveItems: (purchase: any) => void
  onRecordPayment: (purchase: any) => void
  onCancelOrder: (purchase: any) => void
  onDeletePurchase: (purchase: any) => void
}

export function PurchaseTabs({
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
  onDeletePurchase,
}: PurchaseTabsProps) {
  const [filteredPurchases, setFilteredPurchases] = useState<any[]>([])
  const [displayedPurchases, setDisplayedPurchases] = useState<any[]>([])

  // Apply filters and sorting
  useEffect(() => {
    let result = [...purchases]

    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      result = result.filter(
        (purchase) =>
          purchase.poNumber.toLowerCase().includes(lowerCaseSearchTerm) ||
          purchase.supplierName.toLowerCase().includes(lowerCaseSearchTerm),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((purchase) => purchase.status === statusFilter)
    }

    // Apply payment status filter
    if (paymentStatusFilter !== "all") {
      result = result.filter((purchase) => purchase.paymentStatus === paymentStatusFilter)
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    setFilteredPurchases(result)
  }, [purchases, searchTerm, statusFilter, paymentStatusFilter, sortConfig])

  // Paginate results
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setDisplayedPurchases(filteredPurchases.slice(startIndex, endIndex))

    // If current page is greater than total pages, reset to page 1
    if (currentPage > Math.ceil(filteredPurchases.length / itemsPerPage) && currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [filteredPurchases, currentPage, itemsPerPage, setCurrentPage])

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Draft":
        return <Badge variant="outline">Draft</Badge>
      case "Ordered":
        return <Badge variant="secondary">Ordered</Badge>
      case "Partially Received":
        return <Badge variant="warning">Partially Received</Badge>
      case "Received":
        return <Badge variant="success">Received</Badge>
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get payment status badge color
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "Unpaid":
        return <Badge variant="destructive">Unpaid</Badge>
      case "Partially Paid":
        return <Badge variant="warning">Partially Paid</Badge>
      case "Paid":
        return <Badge variant="success">Paid</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Tabs defaultValue="all" className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>
            All Orders
          </TabsTrigger>
          <TabsTrigger value="draft" onClick={() => setStatusFilter("Draft")}>
            Draft
          </TabsTrigger>
          <TabsTrigger value="ordered" onClick={() => setStatusFilter("Ordered")}>
            Ordered
          </TabsTrigger>
          <TabsTrigger value="received" onClick={() => setStatusFilter("Received")}>
            Received
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="h-4 w-4 opacity-50" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full sm:w-[200px] md:w-[300px]"
          />
        </div>
      </div>
      <TabsContent value="all" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Ordered">Ordered</SelectItem>
                <SelectItem value="Partially Received">Partially Received</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Statuses</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => requestSort("poNumber")}>
                  PO Number
                  {sortConfig?.key === "poNumber" && (
                    <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("supplierName")}>
                  Supplier
                  {sortConfig?.key === "supplierName" && (
                    <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("orderDate")}>
                  Order Date
                  {sortConfig?.key === "orderDate" && (
                    <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("status")}>
                  Status
                  {sortConfig?.key === "status" && (
                    <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("paymentStatus")}>
                  Payment
                  {sortConfig?.key === "paymentStatus" && (
                    <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => requestSort("totalAmount")}>
                  Total
                  {sortConfig?.key === "totalAmount" && (
                    <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No purchase orders found
                  </TableCell>
                </TableRow>
              ) : (
                displayedPurchases.map((purchase) => (
                  <TableRow key={purchase._id}>
                    <TableCell>{purchase.poNumber}</TableCell>
                    <TableCell>{purchase.supplierName}</TableCell>
                    <TableCell>{formatDate(purchase.orderDate)}</TableCell>
                    <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(purchase.paymentStatus)}</TableCell>
                    <TableCell className="text-right">₹{purchase.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Options</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onViewDetails(purchase)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {purchase.attachments && purchase.attachments.length > 0 && (
                            <DropdownMenuItem onClick={() => onViewAttachments(purchase)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Attachments
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {purchase.status !== "Cancelled" && (
                            <>
                              {purchase.status !== "Received" && (
                                <DropdownMenuItem onClick={() => onEditOrder(purchase)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Order
                                </DropdownMenuItem>
                              )}
                              {(purchase.status === "Draft" || purchase.status === "Ordered") && (
                                <DropdownMenuItem onClick={() => onReceiveItems(purchase)}>
                                  <Check className="mr-2 h-4 w-4" />
                                  Mark as Received
                                </DropdownMenuItem>
                              )}
                              {purchase.paymentStatus !== "Paid" && (
                                <DropdownMenuItem onClick={() => onRecordPayment(purchase)}>
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  Record Payment
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => onCancelOrder(purchase)}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel Order
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          {purchase.status !== "Received" && purchase.status !== "Cancelled" && (
                            <DropdownMenuItem
                              onClick={() => onDeletePurchase(purchase)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {displayedPurchases.length} of {filteredPurchases.length} orders
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm">
              Page {currentPage} of {Math.max(1, Math.ceil(filteredPurchases.length / itemsPerPage))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= Math.ceil(filteredPurchases.length / itemsPerPage)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="draft" className="space-y-4">
        {/* Content for draft tab - uses the same filtered content */}
      </TabsContent>
      <TabsContent value="ordered" className="space-y-4">
        {/* Content for ordered tab - uses the same filtered content */}
      </TabsContent>
      <TabsContent value="received" className="space-y-4">
        {/* Content for received tab - uses the same filtered content */}
      </TabsContent>
    </Tabs>
  )
}
