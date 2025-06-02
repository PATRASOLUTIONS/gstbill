"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface Customer {
  _id: string
  name: string
  email: string
  contact: string
  customerType: string
  gstin?: string
  address?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface ViewDetailsDialogProps {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewDetailsDialog({ customer, open, onOpenChange }: ViewDetailsDialogProps) {
  if (!customer) return null

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>View detailed information about this customer.</DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <h3 className="text-xl font-semibold">{customer.name}</h3>
                <Badge variant="outline">{customer.customerType}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{customer.contact}</p>
                </div>

                {customer.gstin && (
                  <div>
                    <p className="text-sm text-muted-foreground">GSTIN</p>
                    <p className="font-medium">{customer.gstin}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Created On</p>
                  <p className="font-medium">{formatDate(customer.createdAt)}</p>
                </div>
              </div>

              {customer.address && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{customer.address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
