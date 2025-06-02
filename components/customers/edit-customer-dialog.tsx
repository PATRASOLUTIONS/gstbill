"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditCustomerDialogProps {
  customerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCustomerUpdated: () => void
}

export function EditCustomerDialog({ customerId, open, onOpenChange, onCustomerUpdated }: EditCustomerDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    customerType: "",
    gstin: "",
    address: "",
  })

  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    contact: "",
    customerType: "",
  })

  // Fetch customer data when dialog opens and customerId changes
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerId || !open) return

      try {
        setLoading(true)
        console.log(`Fetching customer data for ID: ${customerId}`)
        const response = await fetch(`/api/customers?id=${customerId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch customer data")
        }

        const data = await response.json()
        console.log("Fetched customer data:", data)

        if (data.customer) {
          setFormData({
            name: data.customer.name || "",
            email: data.customer.email || "",
            contact: data.customer.contact || "",
            customerType: data.customer.customerType || "Individual",
            gstin: data.customer.gstin || "",
            address: data.customer.address || "",
          })
        }
      } catch (error) {
        console.error("Error fetching customer data:", error)
        toast({
          title: "Error",
          description: "Failed to load customer data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerData()
  }, [customerId, open, toast])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  // Handle select changes
  const handleSelectChange = (value: string, name: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user selects
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  // Validate form
  const validateForm = () => {
    const errors = {
      name: "",
      email: "",
      contact: "",
      customerType: "",
    }

    let isValid = true

    if (!formData.name.trim()) {
      errors.name = "Name is required"
      isValid = false
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid"
      isValid = false
    }

    if (!formData.contact.trim()) {
      errors.contact = "Contact number is required"
      isValid = false
    }

    if (!formData.customerType) {
      errors.customerType = "Customer type is required"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm() || !customerId) return

    try {
      setSubmitting(true)
      console.log("Updating customer with data:", formData)

      const response = await fetch(`/api/customers?id=${customerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to update customer")
      }

      toast({
        title: "Success",
        description: "Customer updated successfully",
      })

      onOpenChange(false)
      onCustomerUpdated()
    } catch (error) {
      console.error("Error updating customer:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update customer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>Update customer information.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Customer Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter customer name"
              />
              {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-customerType">
                Customer Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.customerType}
                onValueChange={(value) => handleSelectChange(value, "customerType")}
              >
                <SelectTrigger id="edit-customerType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Corporate">Corporate</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Educational">Educational</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.customerType && <p className="text-sm text-red-500">{formErrors.customerType}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                type="email"
                placeholder="Enter email address"
              />
              {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-contact">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-contact"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
              {formErrors.contact && <p className="text-sm text-red-500">{formErrors.contact}</p>}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-gstin">GSTIN (for Business)</Label>
              <Input
                id="edit-gstin"
                name="gstin"
                value={formData.gstin}
                onChange={handleInputChange}
                placeholder="Enter GSTIN if applicable"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting || loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Updating...
              </>
            ) : (
              "Update Customer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

