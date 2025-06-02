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
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface User {
  _id: string
  name: string
  email: string
  role: string
  sidebarPermissions?: Record<string, boolean>
  createdAt: string
}

interface UserSidebarPermissionsTableProps {
  users: User[]
  onPermissionsUpdated: () => void
}

export function UserSidebarPermissionsTable({ users, onPermissionsUpdated }: UserSidebarPermissionsTableProps) {
  const { toast } = useToast()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [permissions, setPermissions] = useState({
    dashboard: true,
    products: false,
    categories: false,
    customers: false,
    sales: true,
    purchases: false,
    suppliers: false,
    invoices: true,
    refunds: false,
    reports: false,
    admin: false,
    inventory: false,
    "stock-alerts": false,
    settings: false,
  })

  const handleOpenPermissionsDialog = (user: User) => {
    setSelectedUser(user)
    // Initialize permissions from user data or defaults
    setPermissions({
      dashboard: user.sidebarPermissions?.dashboard ?? true,
      products: user.sidebarPermissions?.products ?? true,
      categories: user.sidebarPermissions?.categories ?? false,
      customers: user.sidebarPermissions?.customers ?? false,
      sales: user.sidebarPermissions?.sales ?? false,
      purchases: user.sidebarPermissions?.purchases ?? false,
      suppliers: user.sidebarPermissions?.suppliers ?? false,
      invoices: user.sidebarPermissions?.invoices ?? true,
      refunds: user.sidebarPermissions?.refunds ?? false,
      reports: user.sidebarPermissions?.reports ?? false,
      admin: user.sidebarPermissions?.admin ?? user.role === "admin",
      inventory: user.sidebarPermissions?.inventory ?? false,
      "stock-alerts": user.sidebarPermissions?.["stock-alerts"] ?? false,
      settings: user.sidebarPermissions?.settings ?? false,
    })
    setIsPermissionsDialogOpen(true)
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [permission]: checked,
    }))
  }

  const handleSavePermissions = async () => {
    if (!selectedUser) return

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/admin/users/${selectedUser._id}/sidebar-permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permissions }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update permissions")
      }

      toast({
        title: "Success",
        description:
          "User sidebar permissions updated successfully. User will need to refresh their page to see changes.",
      })

      setIsPermissionsDialogOpen(false)
      onPermissionsUpdated()
    } catch (error) {
      console.error("Error updating permissions:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update permissions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "manager":
        return "default"
      default:
        return "secondary"
    }
  }

  // Helper function to get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Helper function to format date
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </div>
                    <span className="ml-2">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenPermissionsDialog(user)}
                    className="flex items-center"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Manage Permissions
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Sidebar Permissions</DialogTitle>
            <DialogDescription>Manage sidebar access for {selectedUser?.name}</DialogDescription>
          </DialogHeader>

          <Alert className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              The user will need to refresh their page or log out and back in to see these changes.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dashboard"
                  checked={permissions.dashboard}
                  onCheckedChange={(checked) => handlePermissionChange("dashboard", checked as boolean)}
                />
                <Label htmlFor="dashboard">Dashboard</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="products"
                  checked={permissions.products}
                  onCheckedChange={(checked) => handlePermissionChange("products", checked as boolean)}
                />
                <Label htmlFor="products">Products</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="categories"
                  checked={permissions.categories}
                  onCheckedChange={(checked) => handlePermissionChange("categories", checked as boolean)}
                />
                <Label htmlFor="categories">Categories</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customers"
                  checked={permissions.customers}
                  onCheckedChange={(checked) => handlePermissionChange("customers", checked as boolean)}
                />
                <Label htmlFor="customers">Customers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sales"
                  checked={permissions.sales}
                  onCheckedChange={(checked) => handlePermissionChange("sales", checked as boolean)}
                />
                <Label htmlFor="sales">Sales</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="purchases"
                  checked={permissions.purchases}
                  onCheckedChange={(checked) => handlePermissionChange("purchases", checked as boolean)}
                />
                <Label htmlFor="purchases">Purchases</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="suppliers"
                  checked={permissions.suppliers}
                  onCheckedChange={(checked) => handlePermissionChange("suppliers", checked as boolean)}
                />
                <Label htmlFor="suppliers">Suppliers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="invoices"
                  checked={permissions.invoices}
                  onCheckedChange={(checked) => handlePermissionChange("invoices", checked as boolean)}
                />
                <Label htmlFor="invoices">Invoices</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="refunds"
                  checked={permissions.refunds}
                  onCheckedChange={(checked) => handlePermissionChange("refunds", checked as boolean)}
                />
                <Label htmlFor="refunds">Refunds</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reports"
                  checked={permissions.reports}
                  onCheckedChange={(checked) => handlePermissionChange("reports", checked as boolean)}
                />
                <Label htmlFor="reports">Reports</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inventory"
                  checked={permissions.inventory}
                  onCheckedChange={(checked) => handlePermissionChange("inventory", checked as boolean)}
                />
                <Label htmlFor="inventory">Inventory</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stock-alerts"
                  checked={permissions["stock-alerts"]}
                  onCheckedChange={(checked) => handlePermissionChange("stock-alerts", checked as boolean)}
                />
                <Label htmlFor="stock-alerts">Stock Alerts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="settings"
                  checked={permissions.settings}
                  onCheckedChange={(checked) => handlePermissionChange("settings", checked as boolean)}
                />
                <Label htmlFor="settings">Settings</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="admin"
                  checked={permissions.admin}
                  onCheckedChange={(checked) => handlePermissionChange("admin", checked as boolean)}
                  disabled={selectedUser?.role !== "admin"}
                />
                <Label htmlFor="admin">Admin</Label>
                {selectedUser?.role !== "admin" && (
                  <span className="text-xs text-muted-foreground ml-2">(Admin role required)</span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions} disabled={isSubmitting}>
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

