import type { Metadata } from "next"
import SalesClientPage from "./SalesClientPage"

export const metadata: Metadata = {
  title: "Sales",
  description: "Manage your sales records",
}

export default function SalesPage() {
  return <SalesClientPage />
}
