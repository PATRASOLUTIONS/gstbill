import type { Metadata } from "next"
import { InvoicesClient } from "./invoices-client"

export const metadata: Metadata = {
  title: "Invoices | Inventory Management",
  description: "Manage your invoices",
}

export default async function InvoicesPage() {
  return <InvoicesClient />
}

