import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get recent invoices
    const invoices = await db
      .collection("invoices")
      .find({
        userId: session.user.id,
      })
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .limit(5) // Get only the 5 most recent invoices
      .toArray()

    // Format the data
    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      createdAt: invoice.createdAt,
    }))

    return NextResponse.json(formattedInvoices)
  } catch (error) {
    console.error("Error fetching recent invoices:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

