"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PurchaseDataTable } from "@/components/purchases/purchase-data-table"
import { PurchaseStatCards } from "@/components/purchases/purchase-stat-cards"

export function PurchasesClient() {
  const [activeTab, setActiveTab] = useState("all")

  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Purchases</h1>
        <Button asChild className="gap-1">
          <Link href="/purchases/create">
            <Plus className="h-4 w-4" />
            Create Purchase Order
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="ordered">Ordered</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
        </TabsList>

        <PurchaseStatCards />

        <TabsContent value="all" className="mt-6">
          <PurchaseDataTable status="all" />
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          <PurchaseDataTable status="draft" />
        </TabsContent>

        <TabsContent value="ordered" className="mt-6">
          <PurchaseDataTable status="ordered" />
        </TabsContent>

        <TabsContent value="received" className="mt-6">
          <PurchaseDataTable status="received" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
