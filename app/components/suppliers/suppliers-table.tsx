"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Eye, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

// Mock data - replace with actual data fetching
const mockSuppliers = [
  {
    id: "1",
    name: "ABC Supplies",
    contactPerson: "John Doe",
    email: "john@abcsupplies.com",
    phone: "+1 (555) 123-4567",
    status: "active",
  },
  {
    id: "2",
    name: "XYZ Corporation",
    contactPerson: "Jane Smith",
    email: "jane@xyzcorp.com",
    phone: "+1 (555) 987-6543",
    status: "active",
  },
  {
    id: "3",
    name: "Global Distributors",
    contactPerson: "Mike Johnson",
    email: "mike@globaldist.com",
    phone: "+1 (555) 456-7890",
    status: "inactive",
  },
  {
    id: "4",
    name: "Metro Vendors",
    contactPerson: "Sarah Williams",
    email: "sarah@metrovendors.com",
    phone: "+1 (555) 789-0123",
    status: "on-hold",
  },
  {
    id: "5",
    name: "City Wholesalers",
    contactPerson: "Robert Brown",
    email: "robert@citywholesalers.com",
    phone: "+1 (555) 234-5678",
    status: "active",
  },
]

export function SuppliersTable() {
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get("status") || "all"
  const [filteredSuppliers, setFilteredSuppliers] = useState(mockSuppliers)

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredSuppliers(mockSuppliers)
    } else {
      setFilteredSuppliers(mockSuppliers.filter((supplier) => supplier.status === statusFilter))
    }
  }, [statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-500">Inactive</Badge>
      case "on-hold":
        return <Badge className="bg-amber-500">On Hold</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Supplier Name</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSuppliers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                No suppliers found
              </TableCell>
            </TableRow>
          ) : (
            filteredSuppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{supplier.contactPerson}</TableCell>
                <TableCell>{supplier.email}</TableCell>
                <TableCell>{supplier.phone}</TableCell>
                <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/suppliers/${supplier.id}`}>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/suppliers/${supplier.id}/edit`}>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

