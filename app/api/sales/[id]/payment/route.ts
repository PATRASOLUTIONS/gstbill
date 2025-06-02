import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const salesCollection = db.collection("sales")
    const paymentsCollection = db.collection("payments")

    const saleId = params.id

    // Validate ObjectId
    if (!ObjectId.isValid(saleId)) {
      return NextResponse.json({ error: "Invalid sale ID" }, { status: 400 })
    }

    // Get payment data from request
    const paymentData = await request.json()

    if (!paymentData.amount || isNaN(Number.parseFloat(paymentData.amount))) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 })
    }

    // Check if the sale exists and belongs to the user
    const sale = await salesCollection.findOne({
      _id: new ObjectId(saleId),
      userId: userId,
    })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found or access denied" }, { status: 404 })
    }

    // Check if the sale is already paid
    if (sale.paymentStatus === "Paid") {
      return NextResponse.json({ error: "Sale is already paid" }, { status: 400 })
    }

    // Create payment record
    const payment = {
      saleId: saleId,
      userId: userId,
      amount: Number.parseFloat(paymentData.amount),
      method: paymentData.method || "Cash",
      reference: paymentData.reference || "",
      notes: paymentData.notes || "",
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const paymentResult = await paymentsCollection.insertOne(payment)

    if (!paymentResult.insertedId) {
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
    }

    // Update the sale payment status
    const updateResult = await salesCollection.updateOne(
      { _id: new ObjectId(saleId), userId: userId },
      {
        $set: {
          paymentStatus: "Paid",
          paidAmount: Number.parseFloat(paymentData.amount),
          paymentMethod: paymentData.method || "Cash",
          paymentReference: paymentData.reference || "",
          paymentDate: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update sale payment status" }, { status: 500 })
    }

    // If there's an invoice associated with this sale, update its payment status too
    if (sale.invoiceId) {
      const invoicesCollection = db.collection("invoices")

      await invoicesCollection.updateOne(
        { _id: new ObjectId(sale.invoiceId), userId: userId },
        {
          $set: {
            paymentStatus: "Paid",
            paidAmount: Number.parseFloat(paymentData.amount),
            paymentMethod: paymentData.method || "Cash",
            paymentReference: paymentData.reference || "",
            paymentDate: new Date(),
            updatedAt: new Date(),
          },
        },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully",
      paymentId: paymentResult.insertedId,
    })
  } catch (error) {
    console.error("Error recording payment:", error)
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
  }
}

