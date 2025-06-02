"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { Search, FileDown, MoreHorizontal, ArrowDown, ArrowUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { formatDate, formatCurrency } from "@/utils/format-currency"

interface Refund {
  _id: string
  orderNumber: string
  customer: { name: string }
  refundDate: string
  total: number
  reason: string
  status: string
}

export function RefundsTable() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const [totalPages, setTotalPages] = useState(1)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Refund; direction: string } | null>(null)

  useEffect(() => {
    if (session) {
      fetchRefunds()
    }
  }, [session, currentPage])

  const fetchRefunds = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/refunds?page=${currentPage}&limit=${itemsPerPage}`)

      if (!response.ok) {
        throw new Error("Failed to fetch refunds")
      }

      const data = await response.json()
      setRefunds(data.refunds || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      console.error("Error fetching refunds:", error)
      toast({
        title: "Error",
        description: "Failed to load refunds. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const requestSort = (key: keyof Refund) => {
    let direction = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  const sortedRefunds = () => {
    const sortedRefunds = [...refunds]

    if (sortConfig !== null) {
      sortedRefunds.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    return sortedRefunds
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-sm items-center space-x-2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search refunds..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="mt-6 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => requestSort("orderNumber")}>
                  Order #{" "}
                  {sortConfig?.key === "orderNumber" &&
                    (sortConfig.direction === "ascending" ? <ArrowUp /> : <ArrowDown />)}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("customer.name")}>
                  Customer{" "}
                  {sortConfig?.key === "customer.name" &&
                    (sortConfig.direction === "ascending" ? <ArrowUp /> : <ArrowDown />)}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("refundDate")}>
                  Date{" "}
                  {sortConfig?.key === "refundDate" &&
                    (sortConfig.direction === "ascending" ? <ArrowUp /> : <ArrowDown />)}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("total")}>
                  Amount{" "}
                  {sortConfig?.key === "total" && (sortConfig.direction === "ascending" ? <ArrowUp /> : <ArrowDown />)}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("reason")}>
                  Reason{" "}
                  {sortConfig?.key === "reason" && (sortConfig.direction === "ascending" ? <ArrowUp /> : <ArrowDown />)}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort("status")}>
                  Status{" "}
                  {sortConfig?.key === "status" && (sortConfig.direction === "ascending" ? <ArrowUp /> : <ArrowDown />)}
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRefunds().map((refund) => (
                <TableRow key={refund._id}>
                  <TableCell className="font-medium">{refund.orderNumber}</TableCell>
                  <TableCell>{refund.customer.name}</TableCell>
                  <TableCell>{formatDate(refund.refundDate)}</TableCell>
                  <TableCell>{formatCurrency(refund.total)}</TableCell>
                  <TableCell>{refund.reason}</TableCell>
                  <TableCell>
                    <Badge variant={refund.status === "Completed" ? "success" : "secondary"}>{refund.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Edit refund</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Delete refund</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink onClick={() => handlePageChange(i + 1)} isActive={currentPage === i + 1}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardContent>
    </Card>
  )
}
