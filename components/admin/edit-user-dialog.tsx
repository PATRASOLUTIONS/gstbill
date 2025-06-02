"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.enum(["admin", "user", "manager"], {
    required_error: "Please select a role.",
  }),
  permissions: z
    .object({
      dashboard: z.boolean().optional(),
      products: z.boolean().optional(),
      categories: z.boolean().optional(),
      customers: z.boolean().optional(),
      sales: z.boolean().optional(),
      purchases: z.boolean().optional(),
      suppliers: z.boolean().optional(),
      invoices: z.boolean().optional(),
      refunds: z.boolean().optional(),
      reports: z.boolean().optional(),
      admin: z.boolean().optional(),
    })
    .optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditUserDialogProps {
  user: {
    _id: string
    name: string
    email: string
    role: "admin" | "user" | "manager"
    permissions?: {
      dashboard?: boolean
      products?: boolean
      categories?: boolean
      customers?: boolean
      sales?: boolean
      purchases?: boolean
      suppliers?: boolean
      invoices?: boolean
      refunds?: boolean
      reports?: boolean
      admin?: boolean
    }
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated: () => void
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || "user",
      permissions: user?.permissions || {
        dashboard: true,
        products: true,
        categories: true,
        customers: true,
        sales: true,
        purchases: true,
        suppliers: true,
        invoices: true,
        refunds: true,
        reports: true,
        admin: false,
      },
    },
  })

  async function onSubmit(values: FormValues) {
    if (!user?._id) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update user")
      }

      toast.success("User updated successfully")
      onUserUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Failed to update user")
    } finally {
      setIsSubmitting(false)
    }
  }

  const permissionItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "products", label: "Products" },
    { id: "categories", label: "Categories" },
    { id: "customers", label: "Customers" },
    { id: "sales", label: "Sales" },
    { id: "purchases", label: "Purchases" },
    { id: "suppliers", label: "Suppliers" },
    { id: "invoices", label: "Invoices" },
    { id: "refunds", label: "Refunds" },
    { id: "reports", label: "Reports" },
    { id: "admin", label: "Admin" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user details and permissions.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <h3 className="mb-2 font-medium">Permissions</h3>
              <div className="space-y-2">
                {permissionItems.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name={`permissions.${item.id}` as any}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">{item.label}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
