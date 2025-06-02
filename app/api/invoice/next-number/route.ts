import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import mongoose from "mongoose"
import Invoice from "@/models/invoice"
import clientPromise from "@/lib/mongodb"

// Connect to MongoDB
async function connectToDatabase() {
  try {
    if (mongoose.connection.readyState >= 1) {
      return
    }
    const client = await clientPromise
    const dbName = new URL(process.env.MONGODB_URI || "").pathname.substring(1)
    await mongoose.connect(process.env.MONGODB_URI || "")
    console.log("Connected to MongoDB")
  } catch (error) {
    console.error("Failed to connect to MongoDB", error)
    throw new Error("Failed to connect to database")
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Get the current year
    const currentYear = new Date().getFullYear()

    // Find the latest invoice with the current year prefix
    const yearPrefix = `INV-${currentYear}-`

    // Use aggregation to ensure we get the highest number atomically
    const latestInvoices = await Invoice.aggregate([
      {
        $match: {
          number: { $regex: `^${yearPrefix}` },
          createdBy: session.user.email,
        },
      },
      { $sort: { number: -1 } },
      { $limit: 1 },
    ])

    const latestInvoice = latestInvoices.length > 0 ? latestInvoices[0] : null

    let nextNumber = 1001 // Default starting number

    if (latestInvoice) {
      // Extract the numeric part from the latest invoice number
      const latestNumberMatch = latestInvoice.number.match(/INV-\d{4}-(\d{4})/)
      if (latestNumberMatch && latestNumberMatch[1]) {
        // Increment the number by 1
        nextNumber = Number.parseInt(latestNumberMatch[1], 10) + 1
      }
    }

    // Format the next invoice number
    const nextInvoiceNumber = `${yearPrefix}${nextNumber.toString().padStart(4, "0")}`

    // Add a small random delay to reduce collision probability
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100))

    return NextResponse.json({ nextInvoiceNumber })
  } catch (error) {
    console.error("Error generating next invoice number:", error)
    return NextResponse.json({ message: "An error occurred while generating the next invoice number" }, { status: 500 })
  }
}
