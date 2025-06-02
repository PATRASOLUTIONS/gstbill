"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, FileEdit, Trash2, FileText, MoreHorizontal, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import type { Sale } from "@/types"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ViewSaleDetailsDialog } from "@/components/sales/view-sale-details-dialog"

export function SalesTableShell() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [viewSaleId, setViewSaleId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch sales data
  const fetchSales = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/sales")

      if (!response.ok) {
        throw new Error("Failed to fetch sales")
      }

      const data = await response.json()
      setSales(data)
    } catch (error) {
      console.error("Error fetching sales:", error)
      setError("Failed to load sales data. Please try again.")
      toast.error("Failed to load sales data")
    } finally {
      setLoading(false)
    }
  }

  // Load sales on component mount
  useState(() => {
    fetchSales()
  }, [])

  // Handle view sale details
  const handleViewSale = (saleId: string) => {
    setViewSaleId(saleId)
  }

  // Handle edit sale
  const handleEditSale = (saleId: string) => {
    router.push(`/sales/edit/${saleId}`)
  }

  // Handle delete sale
  const handleDeleteClick = (saleId: string) => {
    setSaleToDelete(saleId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return

    try {
      const response = await fetch(`/api/sales/${saleToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete sale")
      }

      toast.success("Sale deleted successfully")
      fetchSales() // Refresh the sales list
    } catch (error) {
      console.error("Error deleting sale:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete sale")
    } finally {
      setDeleteDialogOpen(false)
      setSaleToDelete(null)
    }
  }

  // Handle view invoice
  const handleViewInvoice = (saleId: string) => {
    // Find the sale to get the invoice ID
    const sale = sales.find((s) => s.id === saleId)
    if (sale?.invoiceId) {
      router.push(`/invoices/${sale.invoiceId}`)
    } else {
      toast.error("No invoice found for this sale")
    }
  }

  // Define columns for the data table
  const columns = [
    {
      accessorKey: "id",
      header: "Sale ID",
    },
    {
      accessorKey: "customerName",
      header: "Customer",
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "totalAmount",
      header: "Total Amount",
      cell: ({ row }) => `$${row.original.totalAmount.toFixed(2)}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant={status === "completed" ? "success" : status === "pending" ? "warning" : "default"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const sale = row.original

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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewSale(sale.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditSale(sale.id)}>
                <FileEdit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewInvoice(sale.id)}>
                <FileText className="mr-2 h-4 w-4" />
                View Invoice
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(sale.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (loading) {
    return <div className="flex justify-center p-8">Loading sales data...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-lg font-medium">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => fetchSales()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <>
      <DataTable columns={columns} data={sales} searchKey="customerName" placeholder="Search by customer name..." />

      {/* View Sale Details Dialog */}
      {viewSaleId && (
        <ViewSaleDetailsDialog saleId={viewSaleId} open={!!viewSaleId} onClose={() => setViewSaleId(null)} />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sale and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
