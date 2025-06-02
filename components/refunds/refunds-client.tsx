"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefundsTable } from "@/components/refunds/refunds-table"
import { CreateRefundDialog } from "@/components/refunds/create-refund-dialog"

export function RefundsClient() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Refunds</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setOpen(true)}>Create Refund</Button>
        </div>
      </div>
      <RefundsTable />
      <CreateRefundDialog open={open} setOpen={setOpen} />
    </div>
  )
}

