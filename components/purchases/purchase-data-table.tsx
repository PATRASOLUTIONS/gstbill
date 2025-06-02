"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  type SortingState,
  getSortedRowModel,
} from "@tanstack/react-table"
import { formatCurrency } from "@/lib/utils"
import { ArrowUpDown, Filter, MoreHorizontal, FileDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ViewPurchaseDetailsDialog } from "./view-purchase-details-dialog"
import { DeletePurchaseDialog } from "./delete-purchase-dialog"
import { ExportPurchasesDialog } from "./export-purchases-dialog"
import Link from "next/link"

type Purchase = {
  _id: string
  purchaseId: string
  supplier: string
  date: string
  total: number
  status: "draft" | "ordered" | "received" | "cancelled"
  paymentStatus: "paid" | "unpaid" | "partial"
}

export function PurchaseDataTable({ status = "all" }: { status?: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)

  // Fetch purchases data with filtering by status
  useEffect(() => {
    const fetchPurchases = async () => {
      setIsLoading(true)
      try {
        // Add the status filter to the query if it's not "all"
        const statusParam = status !== "all" ? `&status=${status}` : ""
        const searchParam = searchQuery ? `&search=${searchQuery}` : ""
        const response = await fetch(`/api/purchases?page=1&limit=10${statusParam}${searchParam}`)

        if (!response.ok) {
          throw new Error("Failed to fetch purchases")
        }

        const data = await response.json()
        setPurchases(data.purchases || [])
      } catch (error) {
        console.error("Error fetching purchases:", error)
        toast({
          title: "Error",
          description: "Failed to load purchases data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPurchases()
  }, [status, searchQuery, toast])

  const columns: ColumnDef<Purchase>[] = [
    {
      accessorKey: "purchaseId",
      header: "Purchase #",
      cell: ({ row }) => <div className="font-medium">{row.original.purchaseId}</div>,
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{new Date(row.original.date).toLocaleDateString()}</div>,
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => <div>{row.original.supplier}</div>,
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.original.total)}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        let badgeClass = ""

        switch (status) {
          case "draft":
            badgeClass = "bg-gray-200 text-gray-800 hover:bg-gray-200"
            break
          case "ordered":
            badgeClass = "bg-blue-100 text-blue-800 hover:bg-blue-100"
            break
          case "received":
            badgeClass = "bg-green-100 text-green-800 hover:bg-green-100"
            break
          case "cancelled":
            badgeClass = "bg-red-100 text-red-800 hover:bg-red-100"
            break
          default:
            badgeClass = "bg-gray-200 text-gray-800 hover:bg-gray-200"
        }

        return <Badge className={`${badgeClass} capitalize`}>{status}</Badge>
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => {
        const paymentStatus = row.original.paymentStatus
        let badgeClass = ""

        switch (paymentStatus) {
          case "paid":
            badgeClass = "bg-green-100 text-green-800 hover:bg-green-100"
            break
          case "unpaid":
            badgeClass = "bg-red-100 text-red-800 hover:bg-red-100"
            break
          case "partial":
            badgeClass = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
            break
          default:
            badgeClass = "bg-gray-200 text-gray-800 hover:bg-gray-200"
        }

        return <Badge className={`${badgeClass} capitalize`}>{paymentStatus}</Badge>
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const purchase = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPurchase(purchase)
                  setViewDialogOpen(true)
                }}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/purchases/edit/${purchase._id}`)}>Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  setSelectedPurchase(purchase)
                  setDeleteDialogOpen(true)
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: purchases,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-full max-w-xs" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="rounded-md border">
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <h3 className="mt-2 text-lg font-semibold">No purchase orders found</h3>
        <p className="mb-6 mt-1 text-sm text-gray-500">
          {status === "all"
            ? "You haven't created any purchase orders yet."
            : `You don't have any ${status} purchase orders.`}
        </p>
        <Button asChild>
          <Link href="/purchases/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Purchase Order
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search purchases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </div>
        <Button variant="outline" className="gap-1" onClick={() => setExportDialogOpen(true)}>
          <FileDown className="h-4 w-4" />
          Export
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>

      {/* Dialogs */}
      {selectedPurchase && (
        <>
          <ViewPurchaseDetailsDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            purchaseId={selectedPurchase._id}
          />
          <DeletePurchaseDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            purchaseId={selectedPurchase._id}
            onDeleted={() => {
              setPurchases(purchases.filter((p) => p._id !== selectedPurchase._id))
            }}
          />
        </>
      )}

      <ExportPurchasesDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
    </div>
  )
}

