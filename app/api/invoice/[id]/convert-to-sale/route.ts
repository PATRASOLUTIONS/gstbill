import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get the invoice
    const invoice = await db.collection("invoices").findOne({
      _id: new ObjectId(id),
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.status === "converted") {
      return NextResponse.json({ error: "Invoice already converted to sale" }, { status: 400 })
    }

    // Get the next sale ID for this user
    const nextSaleIdResponse = await fetch(new URL("/api/sales/next-id", request.url).toString(), {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    })

    if (!nextSaleIdResponse.ok) {
      throw new Error("Failed to generate next sale ID")
    }

    const { nextSaleId } = await nextSaleIdResponse.json()

    // Create a new sale from the invoice
    const saleData = {
      saleId: nextSaleId,
      invoiceId: invoice._id.toString(),
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      items: invoice.items,
      subtotal: invoice.subtotal,
      taxTotal: invoice.taxTotal,
      total: invoice.total,
      paymentMethod: invoice.paymentMethod,
      date: new Date(),
      status: "completed",
      notes: invoice.notes,
      userId: new ObjectId(session.user.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const saleResult = await db.collection("sales").insertOne(saleData)

    if (!saleResult.acknowledged) {
      throw new Error("Failed to create sale")
    }

    // Update the invoice status to converted
    const updateResult = await db.collection("invoices").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "converted",
          convertedToSaleId: saleResult.insertedId.toString(),
          updatedAt: new Date(),
        },
      },
    )

    if (!updateResult.acknowledged) {
      throw new Error("Failed to update invoice status")
    }

    // Update inventory quantities
    for (const item of invoice.items) {
      await db
        .collection("products")
        .updateOne({ _id: new ObjectId(item.productId) }, { $inc: { quantity: -item.quantity } })
    }

    return NextResponse.json({
      success: true,
      message: "Invoice converted to sale successfully",
      saleId: saleResult.insertedId.toString(),
      saleNumber: nextSaleId,
    })
  } catch (error) {
    console.error("Error converting invoice to sale:", error)
    return NextResponse.json({ error: "Failed to convert invoice to sale" }, { status: 500 })
  }
}

