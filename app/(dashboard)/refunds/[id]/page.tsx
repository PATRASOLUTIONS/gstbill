import type { Metadata } from "next"
import { RefundDetailsClient } from "./RefundDetailsClient"

export const metadata: Metadata = {
  title: "Refund Details | Inventory Management",
  description: "View and manage refund details",
}

export default function RefundDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  return <RefundDetailsClient id={params.id} />
}

