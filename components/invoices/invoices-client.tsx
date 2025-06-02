"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { InvoicesTable } from "@/components/invoices/invoices-table"
import { CreateInvoiceDialog } from "@/components/invoices/create-invoice-dialog"

export function InvoicesClient() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setOpen(true)}>Create Invoice</Button>
        </div>
      </div>
      <InvoicesTable />
      <CreateInvoiceDialog open={open} setOpen={setOpen} />
    </div>
  )
}

