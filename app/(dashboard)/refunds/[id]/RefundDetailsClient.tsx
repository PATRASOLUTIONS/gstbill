"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import type { Refund } from "@/types/refund"
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

interface RefundDetailsClientProps {
  id: string
}

export function RefundDetailsClient({ id }: RefundDetailsClientProps) {
  const router = useRouter()
  const [refund, setRefund] = useState<Refund | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchRefund = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/refunds/${id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch refund")
        }
        const data = await response.json()
        setRefund(data)
      } catch (error) {
        console.error("Error fetching refund:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRefund()
  }, [id])

  const handleStatusUpdate = async (status: "Approved" | "Rejected") => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/refunds/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${status.toLowerCase()} refund`)
      }

      // Update the refund status locally
      setRefund((prev) => (prev ? { ...prev, status } : null))
    } catch (error) {
      console.error(`Error ${status.toLowerCase()}ing refund:`, error)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline">Pending</Badge>
      case "Approved":
        return <Badge className="bg-green-500">Approved</Badge>
      case "Rejected":
        return <Badge className="bg-red-500">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!refund) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Refund not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/refunds")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Refunds
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/refunds")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Refunds
        </Button>
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          {getStatusBadge(refund.status)}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Refund {refund.refundNumber}</CardTitle>
          <CardDescription>Created on {format(new Date(refund.date), "MMMM dd, yyyy")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Refund Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sale Number:</span>
                  <span>{refund.saleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span>{refund.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span>${refund.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{format(new Date(refund.date), "MMM dd, yyyy")}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Reason for Refund</h3>
              <p className="text-muted-foreground">{refund.reason}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-4">Items in Refund</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refund.items && refund.items.length > 0 ? (
                  refund.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>${(item.quantity * item.price).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          {refund.status === "Pending" && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={processing}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Refund
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Refund</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject this refund? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleStatusUpdate("Rejected")}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default" disabled={processing}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Refund
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Refund</AlertDialogTitle>
                    <AlertDialogDescription>
                      Approving this refund will return the items to inventory. Are you sure you want to proceed?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleStatusUpdate("Approved")}>Approve</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
