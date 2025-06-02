import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function PurchasesLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
      </div>

      <Skeleton className="h-10 w-[300px]" />

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-10 w-1/7" />
                  <Skeleton className="h-10 w-1/7" />
                  <Skeleton className="h-10 w-1/7" />
                  <Skeleton className="h-10 w-1/7" />
                  <Skeleton className="h-10 w-1/7" />
                  <Skeleton className="h-10 w-1/7" />
                  <Skeleton className="h-10 w-1/7" />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

