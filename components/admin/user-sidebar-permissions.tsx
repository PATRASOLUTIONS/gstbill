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
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  sidebarPermissions: z
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

interface UserSidebarPermissionsProps {
  user: {
    _id: string
    name: string
    email: string
    role: "admin" | "user" | "manager"
    sidebarPermissions?: {
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
  onPermissionsUpdated: () => void
}

export function UserSidebarPermissions({
  user,
  open,
  onOpenChange,
  onPermissionsUpdated,
}: UserSidebarPermissionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Default permissions based on role
  const getDefaultPermissions = () => {
    const isAdmin = user?.role === "admin"
    return {
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
      admin: isAdmin,
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sidebarPermissions: user?.sidebarPermissions || getDefaultPermissions(),
    },
  })

  async function onSubmit(values: FormValues) {
    if (!user?._id) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/users/${user._id}/sidebar-permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update sidebar permissions")
      }

      toast.success("Sidebar permissions updated successfully")
      onPermissionsUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating sidebar permissions:", error)
      toast.error("Failed to update sidebar permissions")
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
          <DialogTitle>User Sidebar Permissions</DialogTitle>
          <DialogDescription>Manage sidebar access for {user?.name}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <h3 className="mb-2 font-medium">Sidebar Permissions</h3>
              <div className="space-y-2">
                {permissionItems.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name={`sidebarPermissions.${item.id}` as any}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={user?.email === "admin@example.com" && item.id === "admin"}
                          />
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
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save permissions"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
