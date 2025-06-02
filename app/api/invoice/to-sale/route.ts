import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import mongoose from "mongoose"
import Invoice from "@/models/invoice"
import Customer from "@/models/customer"
import Product from "@/models/product"
import Sale from "@/models/sale"
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const invoiceId = searchParams.get("invoiceId")

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find the invoice
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      createdBy: session.user.email,
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Check if a sale already exists for this invoice
    const existingSale = await Sale.findOne({
      invoiceId: invoiceId,
    })

    if (existingSale) {
      return NextResponse.json(
        {
          error: "A sale record already exists for this invoice",
          saleId: existingSale._id,
        },
        { status: 400 },
      )
    }

    // Find the customer
    let customer = null
    if (invoice.customerId && invoice.customerId !== "walkin") {
      customer = await Customer.findById(invoice.customerId)
    }

    // Start a session for transaction
    const mongoSession = await mongoose.startSession()
    mongoSession.startTransaction()

    try {
      // Create sale items from invoice items
      const saleItems = []

      for (const item of invoice.items) {
        // Find the product to get its current details
        const product = await Product.findById(item.productId).session(mongoSession)

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`)
        }

        saleItems.push({
          product: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          taxRate: item.tax,
          taxAmount: (item.price * item.quantity * item.tax) / 100,
          total: item.total,
        })

        // Check if there's enough stock
        if (product.quantity < item.quantity) {
          throw new Error(
            `Not enough stock for product: ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`,
          )
        }

        // Always update product quantity when converting to sale
        console.log(`Reducing quantity for product ${product.name} by ${item.quantity}`)
        await Product.updateOne(
          { _id: item.productId },
          {
            $inc: { quantity: -item.quantity },
            lastModifiedFrom: "sales",
            lastModified: new Date(),
          },
          { session: mongoSession },
        )
      }

      // Create the sale record with proper handling for walkin customers
      const saleData: any = {
        saleDate: new Date(invoice.date),
        items: saleItems,
        subtotal: invoice.subtotal,
        taxTotal: invoice.taxTotal,
        total: invoice.total,
        paymentStatus: invoice.status === "paid" ? "Paid" : "Unpaid",
        paymentMethod: invoice.paymentMethod,
        status: "Completed", // Always set status to Completed
        notes: `Created from invoice ${invoice.number}`,
        createdBy: session.user.email,
        invoiceId: invoiceId, // Store reference to the original invoice
      }

      // Handle customer field properly for walkin customers
      if (invoice.customerId === "walkin") {
        // For walkin customers, we'll store the customer name but not set the customer ObjectId
        saleData.customerName = invoice.customerName || "Walk-in Customer"
      } else {
        // For regular customers, set the customer ObjectId reference
        saleData.customer = new mongoose.Types.ObjectId(invoice.customerId)
        saleData.customerName = invoice.customerName
      }

      const sale = new Sale(saleData)
      await sale.save({ session: mongoSession })

      // Commit the transaction
      await mongoSession.commitTransaction()
      mongoSession.endSession()

      // Mark the invoice as converted to sale
      await Invoice.updateOne({ _id: invoiceId }, { $set: { convertedToSale: true } })

      return NextResponse.json({
        success: true,
        message: "Sale created successfully from invoice",
        saleId: sale._id,
      })
    } catch (error) {
      // Abort the transaction on error
      await mongoSession.abortTransaction()
      mongoSession.endSession()

      console.error("Error converting invoice to sale:", error)
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "An error occurred while converting invoice to sale",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in invoice to sale conversion:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An error occurred while processing your request",
      },
      { status: 500 },
    )
  }
}
