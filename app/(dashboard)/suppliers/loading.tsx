import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SuppliersLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <Skeleton className="h-10 w-[300px]" />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36 mb-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-10 w-1/6" />
                  <Skeleton className="h-10 w-1/6" />
                  <Skeleton className="h-10 w-1/6" />
                  <Skeleton className="h-10 w-1/6" />
                  <Skeleton className="h-10 w-1/6" />
                  <Skeleton className="h-10 w-1/6" />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

