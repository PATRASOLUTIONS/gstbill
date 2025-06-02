import type { Db } from "mongodb"

export async function getNextInvoiceNumber(userId: string, db: Db): Promise<string> {
  const currentYear = new Date().getFullYear()

  // Use findOneAndUpdate to atomically increment the counter
  const result = await db.collection("invoiceCounters").findOneAndUpdate(
    { userId, year: currentYear },
    { $inc: { sequence: 1 } },
    {
      upsert: true, // Create if it doesn't exist
      returnDocument: "after", // Return the updated document
    },
  )

  // Format the invoice number with year and padding
  const sequence = result.sequence || 1
  return `INV-${currentYear}-${sequence.toString().padStart(4, "0")}`
}

