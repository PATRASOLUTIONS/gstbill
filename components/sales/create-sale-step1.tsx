"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { Customer } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface CreateSaleStep1Props {
  onSubmit: (data: { customerId: string; selectedCustomer: Customer | null }) => void
  initialCustomerId?: string
  initialCustomer?: Customer | null
}

export function CreateSaleStep1({ onSubmit, initialCustomerId = "", initialCustomer = null }: CreateSaleStep1Props) {
  const [customerId, setCustomerId] = useState(initialCustomerId)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer)

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await fetch("/api/customers")
        if (!response.ok) {
          throw new Error("Failed to fetch customers")
        }
        const data = await response.json()
        setCustomers(data)

        // If we have an initialCustomerId but no initialCustomer, find the customer
        if (initialCustomerId && !initialCustomer) {
          const customer = data.find((c: Customer) => c._id === initialCustomerId)
          if (customer) {
            setSelectedCustomer(customer)
          }
        }
      } catch (error) {
        console.error("Error fetching customers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [initialCustomerId, initialCustomer])

  const handleCustomerChange = (value: string) => {
    setCustomerId(value)
    const customer = customers.find((c) => c._id === value) || null
    setSelectedCustomer(customer)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ customerId, selectedCustomer })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="customer">Select Customer</Label>
        {loading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading customers...</span>
          </div>
        ) : (
          <Select value={customerId} onValueChange={handleCustomerChange}>
            <SelectTrigger id="customer">
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer._id} value={customer._id}>
                  {customer.name} - {customer.email || customer.contact || "No contact info"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedCustomer && (
        <div className="rounded-md border p-4">
          <h3 className="font-medium">Customer Details</h3>
          <div className="mt-2 text-sm">
            <p>
              <strong>Name:</strong> {selectedCustomer.name}
            </p>
            {selectedCustomer.email && (
              <p>
                <strong>Email:</strong> {selectedCustomer.email}
              </p>
            )}
            {selectedCustomer.contact && (
              <p>
                <strong>Phone:</strong> {selectedCustomer.contact}
              </p>
            )}
            {selectedCustomer.address && (
              <p>
                <strong>Address:</strong> {selectedCustomer.address}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" asChild>
          <Link href="/sales">Cancel</Link>
        </Button>
        <Button type="submit" disabled={!customerId || loading}>
          Next: Add Products
        </Button>
      </div>
    </form>
  )
}
