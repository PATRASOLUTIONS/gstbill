import type { Metadata } from "next"
import { DashboardBoard } from "@/components/dashboard/dashboard-board"

export const metadata: Metadata = {
  title: "Dashboard Board | Inventory Management",
  description: "Visual overview of your inventory management system",
}

export default function BoardPage() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Board</h2>
        </div>
        <DashboardBoard />
      </div>
    </div>
  )
}
