import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, FileEdit, Trash2 } from "lucide-react"
import { format } from "date-fns"

interface PurchaseOrdersTableProps {
  status?: string
}

export function PurchaseOrdersTable({ status }: PurchaseOrdersTableProps) {
  // Mock data - in a real app, this would come from your database
  const purchaseOrders = [
    {
      id: "PO-001",
      supplier: "Supplier 1",
      orderDate: new Date("2023-01-15"),
      deliveryDate: new Date("2023-01-30"),
      total: 1250.99,
      status: "pending",
    },
    {
      id: "PO-002",
      supplier: "Supplier 2",
      orderDate: new Date("2023-02-10"),
      deliveryDate: new Date("2023-02-25"),
      total: 3450.5,
      status: "approved",
    },
    {
      id: "PO-003",
      supplier: "Supplier 3",
      orderDate: new Date("2023-03-05"),
      deliveryDate: new Date("2023-03-20"),
      total: 875.25,
      status: "received",
    },
    {
      id: "PO-004",
      supplier: "Supplier 1",
      orderDate: new Date("2023-03-15"),
      deliveryDate: new Date("2023-03-30"),
      total: 2100.75,
      status: "pending",
    },
    {
      id: "PO-005",
      supplier: "Supplier 4",
      orderDate: new Date("2023-04-01"),
      deliveryDate: new Date("2023-04-15"),
      total: 1650.0,
      status: "approved",
    },
  ].filter((po) => !status || po.status === status)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "received":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO Number</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Expected Delivery</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseOrders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                No purchase orders found
              </TableCell>
            </TableRow>
          ) : (
            purchaseOrders.map((po) => (
              <TableRow key={po.id}>
                <TableCell className="font-medium">{po.id}</TableCell>
                <TableCell>{po.supplier}</TableCell>
                <TableCell>{format(po.orderDate, "MMM dd, yyyy")}</TableCell>
                <TableCell>{format(po.deliveryDate, "MMM dd, yyyy")}</TableCell>
                <TableCell>${po.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(po.status)}>
                    {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileEdit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
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
