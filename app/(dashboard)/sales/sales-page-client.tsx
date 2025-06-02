"use client"

import { Suspense } from "react"
import { SalesDataTable } from "@/components/sales/sales-data-table"
import { SalesTableSkeleton } from "@/components/sales/sales-table-skeleton"
import { CreateSaleButton } from "@/components/sales/create-sale-button"
import { DashboardShell } from "@/components/shell"
import { ErrorBoundary } from "@/components/error-boundary"

export default function SalesPageClient() {
  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground">Create and manage sales records</p>
        </div>
        <CreateSaleButton />
      </div>
      <ErrorBoundary
        fallback={
          <div className="py-8 text-center text-red-500">
            Something went wrong loading the sales data. Please refresh the page.
          </div>
        }
      >
        <Suspense fallback={<SalesTableSkeleton />}>
          <SalesDataTable />
        </Suspense>
      </ErrorBoundary>
    </DashboardShell>
  )
}

