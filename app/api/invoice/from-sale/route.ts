import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  try {
    const { saleId } = await request.json()

    if (!saleId) {
      return NextResponse.json({ error: "Sale ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get the sale details
    const sale = await db.collection("sales").findOne({ _id: new ObjectId(saleId) })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    // Check if invoice already exists for this sale
    const existingInvoice = await db.collection("invoices").findOne({ saleId: saleId })

    if (existingInvoice) {
      return NextResponse.json({
        message: "Invoice already exists for this sale",
        invoiceId: existingInvoice._id,
      })
    }

    // Create invoice from sale data
    const invoiceData = {
      saleId: saleId,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      customer: sale.customer,
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      items: sale.items,
      subtotal: sale.subtotal,
      taxTotal: sale.taxTotal,
      total: sale.total,
      status: "Unpaid",
      notes: `Automatically generated from sale ${saleId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("invoices").insertOne(invoiceData)

    if (!result.acknowledged) {
      throw new Error("Failed to create invoice")
    }

    // Update the sale with the invoice reference
    await db
      .collection("sales")
      .updateOne(
        { _id: new ObjectId(saleId) },
        { $set: { invoiceId: result.insertedId.toString(), updatedAt: new Date().toISOString() } },
      )

    return NextResponse.json({
      success: true,
      message: "Invoice created successfully",
      invoiceId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Error creating invoice from sale:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create invoice" },
      { status: 500 },
    )
  }
}

