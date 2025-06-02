"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Supplier } from "@/types"
import { formatDate } from "@/lib/utils"

interface ViewSupplierDialogProps {
  children: React.ReactNode
  supplier: Supplier
}

export function ViewSupplierDialog({ children, supplier }: ViewSupplierDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{supplier.name}</DialogTitle>
          <DialogDescription>Supplier details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
              <p className="text-sm">{supplier.email || "—"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
              <p className="text-sm">{supplier.phone || "—"}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Address</h4>
            <p className="text-sm whitespace-pre-line">{supplier.address || "—"}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Contact Person</h4>
            <p className="text-sm">{supplier.contactPerson || "—"}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
            <p className="text-sm whitespace-pre-line">{supplier.notes || "—"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
              <p className="text-sm">{supplier.createdAt ? formatDate(new Date(supplier.createdAt)) : "—"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Last Updated</h4>
              <p className="text-sm">{supplier.updatedAt ? formatDate(new Date(supplier.updatedAt)) : "—"}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
