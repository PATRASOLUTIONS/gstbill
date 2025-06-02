"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Supplier } from "@/types/supplier"
import { formatDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface ViewSupplierDialogProps {
  supplier: Supplier | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewSupplierDialog({ supplier, open, onOpenChange }: ViewSupplierDialogProps) {
  if (!supplier) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Supplier Details</DialogTitle>
          <DialogDescription>View detailed information about this supplier.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Supplier ID</Label>
                  <p className="font-medium">{supplier.sequentialNumber || "N/A"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{supplier.name}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{supplier.email || "N/A"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Contact Person</Label>
                  <p className="font-medium">{supplier.contactPerson || "N/A"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{supplier.phone || "N/A"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">{supplier.address || "N/A"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">{formatDate(supplier.createdAt)}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <p className="font-medium">{formatDate(supplier.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

