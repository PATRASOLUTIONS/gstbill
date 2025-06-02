"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { getInitials } from "@/lib/utils"

// Define the sidebar components that can be assigned
const SIDEBAR_COMPONENTS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "inventory", label: "Inventory" },
  { id: "products", label: "Products" },
  { id: "suppliers", label: "Suppliers" },
  { id: "purchases", label: "Purchases" },
  { id: "sales", label: "Sales" },
  { id: "customers", label: "Customers" },
  { id: "invoices", label: "Invoices" },
  { id: "refunds", label: "Refunds" },
  { id: "stock-alerts", label: "Stock Alerts" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
]

interface Customer {
  _id: string
  name: string
  email: string
  permissions?: string[]
}

interface CustomerPermissionsTableProps {
  customers: Customer[]
  onPermissionsUpdated: () => void
}

export function CustomerPermissionsTable({ customers, onPermissionsUpdated }: CustomerPermissionsTableProps) {
  const { toast } = useToast()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSelectedPermissions(customer.permissions || [])
    setIsDialogOpen(true)
  }

  const handlePermissionChange = (componentId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPermissions((prev) => [...prev, componentId])
    } else {
      setSelectedPermissions((prev) => prev.filter((id) => id !== componentId))
    }
  }

  const handleSelectAll = () => {
    setSelectedPermissions(SIDEBAR_COMPONENTS.map((component) => component.id))
  }

  const handleDeselectAll = () => {
    setSelectedPermissions([])
  }

  const handleSubmit = async () => {
    if (!selectedCustomer) return

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/admin/customers/${selectedCustomer._id}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permissions: selectedPermissions }),
      })

      if (!response.ok) {
        throw new Error("Failed to update permissions")
      }

      toast({
        title: "Success",
        description: `Permissions updated for ${selectedCustomer.name}`,
      })

      setIsDialogOpen(false)
      onPermissionsUpdated()
    } catch (error) {
      console.error("Error updating permissions:", error)
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Assigned Components</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No customers found.
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <TableRow key={customer._id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {getInitials(customer.name)}
                    </div>
                    <span className="ml-2">{customer.name}</span>
                  </div>
                </TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>
                  {customer.permissions?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {customer.permissions.length > 3 ? (
                        <span>{customer.permissions.length} components</span>
                      ) : (
                        customer.permissions.map((permission) => {
                          const component = SIDEBAR_COMPONENTS.find((c) => c.id === permission)
                          return component ? (
                            <span key={permission} className="rounded bg-primary/10 px-1.5 py-0.5 text-xs">
                              {component.label}
                            </span>
                          ) : null
                        })
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No components assigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(customer)}>
                    Manage Permissions
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Sidebar Permissions</DialogTitle>
            <DialogDescription>
              {selectedCustomer ? (
                <>
                  Select which sidebar components <strong>{selectedCustomer.name}</strong> can access.
                </>
              ) : (
                <>Select which sidebar components this customer can access.</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between py-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {SIDEBAR_COMPONENTS.map((component) => (
                <div key={component.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`permission-${component.id}`}
                    checked={selectedPermissions.includes(component.id)}
                    onCheckedChange={(checked) => handlePermissionChange(component.id, checked as boolean)}
                  />
                  <Label htmlFor={`permission-${component.id}`}>{component.label}</Label>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Permissions"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
