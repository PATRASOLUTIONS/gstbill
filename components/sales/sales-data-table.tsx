"use client"

import { useState, useEffect } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/utils/format-currency"
import type { Sale } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { ViewSaleDetailsDialog } from "./view-sale-details-dialog"
import Link from "next/link"

// Define columns for the sales table
const columns: ColumnDef<Sale>[] = [
  {
    accessorKey: "orderId",
    header: "Order ID",
    cell: ({ row }) => <div className="font-medium">{row.getValue("orderId") || "-"}</div>,
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original.customer
      return <div>{customer?.name || row.original.customerName || "Walk-in Customer"}</div>
    },
  },
  {
    accessorKey: "saleDate",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("saleDate"))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("total"))
      return <div className="font-medium">{formatCurrency(amount)}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = (row.getValue("status") as string).toLowerCase()
      return (
        <Badge
          className={
            status === "completed"
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : status === "pending"
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                : "bg-red-100 text-red-800 hover:bg-red-100"
          }
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const paymentStatus = (row.getValue("paymentStatus") as string).toLowerCase()
      return (
        <Badge
          className={
            paymentStatus === "paid"
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : paymentStatus === "partial"
                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                : "bg-red-100 text-red-800 hover:bg-red-100"
          }
        >
          {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const sale = row.original
      const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsViewDialogOpen(true)}>View details</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/sales/${sale._id}`}>Edit</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ViewSaleDetailsDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} saleId={sale._id} />
        </>
      )
    },
  },
]

interface SalesDataTableProps {
  activeTab?: string
}

export function SalesDataTable({ activeTab = "all" }: SalesDataTableProps) {
  const [data, setData] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true)
        // Add status filter based on activeTab
        const statusParam = activeTab !== "all" ? `?status=${activeTab}` : ""
        const response = await fetch(`/api/sales${statusParam}`)

        if (!response.ok) {
          throw new Error("Failed to fetch sales data")
        }

        const salesData = await response.json()
        setData(salesData.sales || []) // Ensure data is always an array
      } catch (err) {
        console.error("Error fetching sales:", err)
        setError("Failed to load sales data. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load sales data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSales()
  }, [toast, activeTab])

  const table = useReactTable({
    data: data || [], // Ensure data is always an array
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  if (loading) {
    return <div className="py-8 text-center">Loading sales data...</div>
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        <p>{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No sales found. Create your first sale to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

