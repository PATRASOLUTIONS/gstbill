"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type SupplierStatus = "all" | "active" | "inactive" | "on-hold"

export function SupplierFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStatus = (searchParams.get("status") as SupplierStatus) || "all"

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (status === "all") {
      params.delete("status")
    } else {
      params.set("status", status)
    }

    router.push(`/suppliers?${params.toString()}`)
  }

  return (
    <div className="flex items-center">
      <Tabs defaultValue={currentStatus} onValueChange={handleStatusChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="all">All Suppliers</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="on-hold">On Hold</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
