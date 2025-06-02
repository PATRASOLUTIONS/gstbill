"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/utils/format-currency"
import { ArrowLeft, Printer, FileText, Trash2 } from "lucide-react"
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
} from "@/components/ui/alert-dialog"

export default function SaleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [sale, setSale] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSaleDetails = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/sales/${params.id}`)

        if (!response.ok) {
          if (response.status === 404) {
            toast({
              title: "Not Found",
              description: "Sale not found or you don't have access to it",
              variant: "destructive",
            })
            router.push("/sales")
            return
          }
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setSale(data)
      } catch (error) {
        console.error("Failed to fetch sale details:", error)
        toast({
          title: "Error",
          description: "Failed to load sale details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchSaleDetails()
    }
  }, [params.id, router, toast])

  const handleDeleteSale = async () => {
    try {
      const response = await fetch(`/api/sales/${params.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      toast({
        title: "Success",
        description: "Sale deleted successfully",
      })

      router.push("/sales")
    } catch (error) {
      console.error("Failed to delete sale:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete sale. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">Sale not found</p>
            <Button onClick={() => router.push("/sales")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sales
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="outline" onClick={() => router.push("/sales")} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-3xl font-bold">Sale Details</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push(`/invoices/${sale._id}`)}>
            <FileText className="mr-2 h-4 w-4" /> View Invoice
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the sale and restore the product
                  quantities.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSale} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Sale Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">Invoice Number:</dt>
                <dd>{sale.invoiceNumber || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Date:</dt>
                <dd>{formatDate(sale.date || sale.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Total Amount:</dt>
                <dd className="font-bold">{formatCurrency(sale.totalAmount)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">Name:</dt>
                <dd>{sale.customerName || "Walk-in Customer"}</dd>
              </div>
              {sale.customerEmail && (
                <div className="flex justify-between">
                  <dt className="font-medium">Email:</dt>
                  <dd>{sale.customerEmail}</dd>
                </div>
              )}
              {sale.customerPhone && (
                <div className="flex justify-between">
                  <dt className="font-medium">Phone:</dt>
                  <dd>{sale.customerPhone}</dd>
                </div>
              )}
              {sale.customerAddress && (
                <div className="flex justify-between">
                  <dt className="font-medium">Address:</dt>
                  <dd>{sale.customerAddress}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">Payment Method:</dt>
                <dd>{sale.paymentMethod || "Cash"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Payment Status:</dt>
                <dd className={`font-bold ${sale.paymentStatus === "Paid" ? "text-green-600" : "text-amber-600"}`}>
                  {sale.paymentStatus || "Pending"}
                </dd>
              </div>
              {sale.paymentReference && (
                <div className="flex justify-between">
                  <dt className="font-medium">Reference:</dt>
                  <dd>{sale.paymentReference}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>Products included in this sale</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items &&
                sale.items.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.discount ? `${item.discount}%` : "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-end">
          <div className="w-full max-w-xs">
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">Subtotal:</dt>
                <dd>{formatCurrency(sale.subtotal || 0)}</dd>
              </div>
              {sale.taxRate && (
                <div className="flex justify-between">
                  <dt className="font-medium">Tax ({sale.taxRate}%):</dt>
                  <dd>{formatCurrency(sale.taxAmount || 0)}</dd>
                </div>
              )}
              {sale.discountAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="font-medium">Discount:</dt>
                  <dd>-{formatCurrency(sale.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <dt className="font-bold">Total:</dt>
                <dd className="font-bold">{formatCurrency(sale.totalAmount)}</dd>
              </div>
            </dl>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
