"use client"

import { useState, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"
import { FileText, DollarSign, CheckCircle, FileEdit } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PurchaseStatCards() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: { count: 0, value: 0 },
    draft: { count: 0, value: 0 },
    ordered: { count: 0, value: 0 },
    received: { count: 0, value: 0 },
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/purchases/stats")
        if (!response.ok) {
          throw new Error("Failed to fetch purchase statistics")
        }

        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Error fetching purchase statistics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-28" />
              <Skeleton className="mt-2 h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Purchases</p>
            <h3 className="mt-1 text-3xl font-bold">{stats.total.count}</h3>
            <p className="mt-1 text-sm text-gray-500">All time purchase count</p>
          </div>
          <div className="rounded-full bg-gray-100 p-3">
            <FileText className="h-6 w-6 text-gray-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Spent</p>
            <h3 className="mt-1 text-3xl font-bold">{formatCurrency(stats.total.value)}</h3>
            <p className="mt-1 text-sm text-gray-500">All time purchase value</p>
          </div>
          <div className="rounded-full bg-green-100 p-3">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Ordered</p>
            <h3 className="mt-1 text-3xl font-bold">{stats.ordered.count}</h3>
            <p className="mt-1 text-sm text-gray-500">{formatCurrency(stats.ordered.value)} ordered</p>
          </div>
          <div className="rounded-full bg-blue-100 p-3">
            <FileEdit className="h-6 w-6 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Received</p>
            <h3 className="mt-1 text-3xl font-bold">{stats.received.count}</h3>
            <p className="mt-1 text-sm text-gray-500">{formatCurrency(stats.received.value)} received</p>
          </div>
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
