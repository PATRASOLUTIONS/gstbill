import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db()

    // Create indexes for invoices
    await db.collection("invoiceCounters").createIndex({ userId: 1, year: 1 }, { unique: true })

    await db.collection("invoices").createIndex({ invoiceId: 1 }, { unique: true })

    await db.collection("invoices").createIndex({ userId: 1, invoiceNumber: 1 }, { unique: true })

    // Create indexes for sales
    await db.collection("salesCounters").createIndex({ userId: 1, year: 1 }, { unique: true })

    await db.collection("sales").createIndex({ salesId: 1 }, { unique: true })

    await db.collection("sales").createIndex({ userId: 1, salesNumber: 1 }, { unique: true })

    return NextResponse.json({
      success: true,
      message: "Database indexes created successfully",
    })
  } catch (error) {
    console.error("Error setting up database:", error)
    return NextResponse.json({ error: "Failed to set up database indexes" }, { status: 500 })
  }
}
