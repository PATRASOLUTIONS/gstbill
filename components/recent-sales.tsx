import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface RecentSale {
  id: string
  customer: {
    name: string
    email: string
    avatarUrl?: string
    initials: string
  }
  amount: number
  date: string
}

const recentSales: RecentSale[] = [
  {
    id: "1",
    customer: {
      name: "John Smith",
      email: "john.smith@example.com",
      initials: "JS",
    },
    amount: 2500,
    date: "2023-04-15",
  },
  {
    id: "2",
    customer: {
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      initials: "AJ",
    },
    amount: 1800,
    date: "2023-04-14",
  },
  {
    id: "3",
    customer: {
      name: "Robert Brown",
      email: "robert.brown@example.com",
      initials: "RB",
    },
    amount: 3200,
    date: "2023-04-13",
  },
  {
    id: "4",
    customer: {
      name: "Emily Davis",
      email: "emily.davis@example.com",
      initials: "ED",
    },
    amount: 1500,
    date: "2023-04-12",
  },
  {
    id: "5",
    customer: {
      name: "Michael Wilson",
      email: "michael.wilson@example.com",
      initials: "MW",
    },
    amount: 2100,
    date: "2023-04-11",
  },
]

export function RecentSales() {
  return (
    <div className="space-y-8">
      {recentSales.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={sale.customer.avatarUrl} alt={sale.customer.name} />
            <AvatarFallback>{sale.customer.initials}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.customer.name}</p>
            <p className="text-sm text-muted-foreground">{sale.customer.email}</p>
          </div>
          <div className="ml-auto font-medium">+${sale.amount.toLocaleString()}</div>
        </div>
      ))}
    </div>
  )
}

