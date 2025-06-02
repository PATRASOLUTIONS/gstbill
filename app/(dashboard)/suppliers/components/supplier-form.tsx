"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

// Define the form schema with validation
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  contactPerson: z.string().min(2, "Contact person must be at least 2 characters"),
  phone: z.string().min(5, "Phone must be at least 5 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
})

// Define the form input type based on the schema
type SupplierFormValues = z.infer<typeof formSchema>

// Props for the component
interface SupplierFormProps {
  initialData?: SupplierFormValues & { _id?: string }
  onClose?: () => void
}

export function SupplierForm({ initialData, onClose }: SupplierFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const isEditMode = !!initialData?._id

  // Initialize the form with default values or initial data
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      email: "",
      contactPerson: "",
      phone: "",
      address: "",
    },
  })

  // Handle form submission
  const onSubmit = async (data: SupplierFormValues) => {
    try {
      setLoading(true)

      // Determine if we're creating or updating a supplier
      const url = isEditMode ? `/api/suppliers?id=${initialData._id}` : "/api/suppliers"

      const method = isEditMode ? "PATCH" : "POST"

      // Send the request to the API
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      // Check if the request was successful
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save supplier")
      }

      // Show success message and refresh the page
      toast.success(isEditMode ? "Supplier updated" : "Supplier created")
      router.refresh()

      // Close the form if a callback was provided
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error("Error saving supplier:", error)
      toast.error(error.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter supplier name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="supplier@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Person</FormLabel>
              <FormControl>
                <Input placeholder="Contact person name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="Phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Supplier address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Update Supplier" : "Create Supplier"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

