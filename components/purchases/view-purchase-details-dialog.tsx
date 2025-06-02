"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

type PurchaseDetailsProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseId: string
}

export function ViewPurchaseDetailsDialog({ open, onOpenChange, purchaseId }: PurchaseDetailsProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [purchase, setPurchase] = useState<any>(null)

  useEffect(() => {
    if (open && purchaseId) {
      const fetchPurchaseDetails = async () => {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/purchases/${purchaseId}`)
          if (!response.ok) {
            throw new Error("Failed to fetch purchase details")
          }
          const data = await response.json()
          setPurchase(data.purchase)
        } catch (error) {
          console.error("Error fetching purchase details:", error)
          toast({
            title: "Error",
            description: "Failed to load purchase details",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }

      fetchPurchaseDetails()
    }
  }, [open, purchaseId, toast])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Purchase Order Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-8 w-1/4" />
          </div>
        ) : purchase ? (
          <div className="space-y-6">
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-bold">{purchase.purchaseId}</h3>
                <p className="text-sm text-gray-500">Created on {new Date(purchase.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <div
                  className="inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium capitalize"
                  style={{
                    backgroundColor:
                      purchase.status === "draft"
                        ? "#f3f4f6"
                        : purchase.status === "ordered"
                          ? "#dbeafe"
                          : purchase.status === "received"
                            ? "#d1fae5"
                            : "#fee2e2",
                    color:
                      purchase.status === "draft"
                        ? "#1f2937"
                        : purchase.status === "ordered"
                          ? "#1e40af"
                          : purchase.status === "received"
                            ? "#065f46"
                            : "#b91c1c",
                  }}
                >
                  {purchase.status}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-500">Supplier</h4>
                <p>{purchase.supplier}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-500">Date</h4>
                <p>{new Date(purchase.date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {purchase.items?.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {item.quantity} {item.unit || "pcs"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">{formatCurrency(item.price)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        {formatCurrency(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right font-medium">
                      Subtotal
                    </td>
                    <td className="px-6 py-3 text-right">{formatCurrency(purchase.subtotal || 0)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right font-medium">
                      Tax ({purchase.taxRate || 0}%)
                    </td>
                    <td className="px-6 py-3 text-right">{formatCurrency(purchase.taxAmount || 0)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right font-medium">
                      Total
                    </td>
                    <td className="px-6 py-3 text-right font-bold">{formatCurrency(purchase.total || 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {purchase.notes && (
              <div>
                <h4 className="font-medium text-gray-500">Notes</h4>
                <p className="mt-1 whitespace-pre-wrap">{purchase.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p>Purchase order not found</p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
