"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SupplierForm } from "./supplier-form"
import { PlusCircle } from "lucide-react"

interface SupplierDialogProps {
  initialData?: any
  trigger?: React.ReactNode
  title?: string
  description?: string
}

export function SupplierDialog({
  initialData,
  trigger,
  title = "Add New Supplier",
  description = "Fill in the details to add a new supplier.",
}: SupplierDialogProps) {
  const [open, setOpen] = useState(false)

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Add New Supplier</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <SupplierForm initialData={initialData} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  )
}

