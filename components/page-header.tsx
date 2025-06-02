import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  heading: string
  description?: string
  children?: ReactNode
  className?: string
}

export function PageHeader({ heading, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between pb-4", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
