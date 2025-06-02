"use client"

import { CreateSalePage } from "@/components/sales/create-sale-page"
import { DashboardShell } from "@/components/shell"
import { useRouter } from "next/navigation"

export default function CreateSaleRouteClient() {
  const router = useRouter()

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Sale</h1>
          <p className="text-muted-foreground">Create a new sale record</p>
        </div>
      </div>
      <CreateSalePage />
    </DashboardShell>
  )
}
