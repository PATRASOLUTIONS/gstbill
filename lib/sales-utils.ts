import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

export async function getNextSalesNumber(userId: string): Promise<string> {
  const client = await clientPromise
  const db = client.db()

  const currentYear = new Date().getFullYear()

  // Use findOneAndUpdate to atomically increment the counter
  const result = await db.collection("salesCounters").findOneAndUpdate(
    { userId, year: currentYear },
    { $inc: { sequence: 1 } },
    {
      upsert: true,
      returnDocument: "after",
    },
  )

  const sequence = result.sequence || 1

  // Format: SALE-YYYY-XXXX (e.g., SALE-2025-0001)
  return `SALE-${currentYear}-${sequence.toString().padStart(4, "0")}`
}

export function generateSalesId(): string {
  return new ObjectId().toString()
}
