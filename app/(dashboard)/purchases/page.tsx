import type { Metadata } from "next"
import { PurchasesClient } from "./purchases-client"

export const metadata: Metadata = {
  title: "Purchases | Inventory Management",
  description: "Manage your purchase orders",
}

export default function PurchasesPage() {
  return <PurchasesClient />
}

