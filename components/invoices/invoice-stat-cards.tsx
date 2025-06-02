import { FileText, DollarSign, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface InvoiceStatsProps {
  stats: {
    totalCount: number
    totalAmount: number
    paidCount: number
    paidAmount: number
    unpaidCount: number
    unpaidAmount: number
  }
  isLoading: boolean
}

export function InvoiceStatCards({ stats, isLoading }: InvoiceStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("₹", "₹")
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-1" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Total Invoices</span>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{stats.totalCount}</div>
            <div className="text-sm text-muted-foreground">All time invoice count</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Total Revenue</span>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <div className="text-sm text-muted-foreground">All time invoice value</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Paid Invoices</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold">{stats.paidCount}</div>
            <div className="text-sm text-muted-foreground">{formatCurrency(stats.paidAmount)} received</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Unpaid Invoices</span>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div className="text-3xl font-bold">{stats.unpaidCount}</div>
            <div className="text-sm text-muted-foreground">{formatCurrency(stats.unpaidAmount)} pending</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

