"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ProductChangeDetails {
  id: string
  name: string
  sku: string
  current: {
    quantity: number
    cost: number
    sellingPrice: number
    taxRate: number
  }
  after: {
    quantity: number
    cost: number
    sellingPrice: number
    taxRate: number
  }
  willBeNegative?: boolean
}

interface CancelOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productChanges: ProductChangeDetails[]
  onConfirmCancellation: () => void
  isSubmitting: boolean
}

export function CancelOrderDialog({
  open,
  onOpenChange,
  productChanges,
  onConfirmCancellation,
  isSubmitting,
}: CancelOrderDialogProps) {
  // Check if any product would go negative
  const hasNegativeProducts = productChanges.some((product) => product.willBeNegative)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Confirm Purchase Order Cancellation</DialogTitle>
          <DialogDescription>
            This action will cancel the purchase order and revert any inventory changes. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <h3 className="mb-2 font-medium">The following product data will be reverted:</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Current Quantity</TableHead>
                  <TableHead>After Cancellation</TableHead>
                  <TableHead>Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productChanges.map((product) => {
                  const difference = product.current.quantity - product.after.quantity
                  return (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.current.quantity}</TableCell>
                      <TableCell>
                        {product.willBeNegative ? (
                          <span className="text-red-500 font-medium">Would be negative!</span>
                        ) : (
                          product.after.quantity
                        )}
                      </TableCell>
                      <TableCell>
                        {difference === 0 ? "No change" : <span className="text-red-500">-{difference}</span>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {hasNegativeProducts && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
              <p className="font-medium">Warning: Cannot cancel this order</p>
              <p className="text-sm mt-1">
                Cancelling this order would result in negative inventory for some products. This means you've already
                sold or used these items. Please adjust your inventory first.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirmCancellation} disabled={isSubmitting || hasNegativeProducts}>
            {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
