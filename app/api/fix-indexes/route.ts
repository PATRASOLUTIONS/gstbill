import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db()

    // Get all indexes on the invoices collection
    const indexes = await db.collection("invoices").indexes()
    console.log("Current indexes:", indexes)

    // Drop any index that might be enforcing uniqueness on invoiceNumber
    for (const index of indexes) {
      if (
        index.name !== "_id_" && // Don't drop the _id index
        (index.unique === true || // Drop any unique index
          (index.key && index.key.invoiceNumber))
      ) {
        // Drop any index on invoiceNumber
        console.log(`Dropping index: ${index.name}`)
        await db.collection("invoices").dropIndex(index.name)
      }
    }

    // Create a new non-unique index
    await db
      .collection("invoices")
      .createIndex({ userId: 1, invoiceNumber: 1 }, { unique: false, name: "userId_invoiceNumber_non_unique" })

    return NextResponse.json({
      success: true,
      message: "Indexes fixed successfully",
      newIndexes: await db.collection("invoices").indexes(),
    })
  } catch (error) {
    console.error("Error fixing indexes:", error)
    return NextResponse.json({ error: "Failed to fix indexes", details: error.toString() }, { status: 500 })
  }
}
