import type { ObjectId } from "mongodb"
import type { SaleItem } from "./sale"

export interface Refund {
  _id: string
  userId: string
  saleId: string | ObjectId
  saleNumber: string
  customerName: string
  reason: string
  amount: number
  refundNumber: string
  status: "Pending" | "Approved" | "Rejected"
  date: Date
  items: SaleItem[]
}

