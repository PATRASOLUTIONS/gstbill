import { NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/auth-utils"
import dbService from "@/lib/database-service"
import { connectToDatabase } from "@/lib/database-service"

// Helper function to ensure the collection exists
async function ensureCollectionExists(collectionName: string) {
  try {
    const { db } = await connectToDatabase()
    const collections = await db.listCollections().toArray()
    const collectionExists = collections.some((col) => col.name === collectionName)

    if (!collectionExists) {
      await db.createCollection(collectionName)
      console.log(`Created collection: ${collectionName}`)
    }
  } catch (error) {
    console.error(`Error ensuring collection ${collectionName} exists:`, error)
  }
}

export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Ensure the invoices collection exists
    await ensureCollectionExists("invoices")

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 10
    const page = searchParams.get("page") ? Number.parseInt(searchParams.get("page")!) : 1
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (id) {
      // Get a specific invoice
      const invoice = await dbService.findOne("invoices", { _id: dbService.toObjectId(id) })

      if (!invoice) {
        return NextResponse.json({ message: "Invoice not found" }, { status: 404 })
      }

      return NextResponse.json(invoice)
    } else {
      // Build query for all invoices
      const query: any = {}

      if (search) {
        query.$or = [
          { number: { $regex: search, $options: "i" } },
          { customerName: { $regex: search, $options: "i" } },
          { notes: { $regex: search, $options: "i" } },
        ]
      }

      if (status && status !== "all") {
        query.status = status
      }

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        }
      } else if (startDate) {
        query.date = { $gte: new Date(startDate) }
      } else if (endDate) {
        query.date = { $lte: new Date(endDate) }
      }

      // Get total count for pagination
      const total = await dbService.count("invoices", query)

      // Get invoices with pagination
      const skip = (page - 1) * limit
      const invoices = await dbService.find("invoices", query, { sort: { createdAt: -1 }, skip, limit })

      return NextResponse.json({
        invoices,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      })
    }
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ message: "An error occurred while fetching invoices" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Ensure the invoices collection exists
    await ensureCollectionExists("invoices")

    const body = await req.json()
    console.log("Received invoice data:", JSON.stringify(body, null, 2))

    // Validate required fields
    if (!body.customerId) {
      return NextResponse.json({ message: "Customer is required" }, { status: 400 })
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ message: "At least one item is required" }, { status: 400 })
    }

    if (!body.date) {
      return NextResponse.json({ message: "Invoice date is required" }, { status: 400 })
    }

    if (!body.dueDate) {
      return NextResponse.json({ message: "Due date is required" }, { status: 400 })
    }

    if (body.subtotal === undefined || body.subtotal === null) {
      return NextResponse.json({ message: "Subtotal is required" }, { status: 400 })
    }

    if (body.taxTotal === undefined || body.taxTotal === null) {
      return NextResponse.json({ message: "Tax total is required" }, { status: 400 })
    }

    if (body.total === undefined || body.total === null) {
      return NextResponse.json({ message: "Total is required" }, { status: 400 })
    }

    if (!body.paymentMethod) {
      return NextResponse.json({ message: "Payment method is required" }, { status: 400 })
    }

    // Generate a user-specific invoice number if not provided
    let invoiceNumber = body.number
    if (!invoiceNumber) {
      // Get the next sequential number for this user
      invoiceNumber = await dbService.generateSequentialNumber("invoices", "INV-")
    }

    // Format items to ensure they match the schema
    const formattedItems = body.items.map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      tax: item.tax || 0,
      total: item.total,
    }))

    // Create new invoice
    const newInvoice = {
      number: invoiceNumber,
      date: body.date,
      dueDate: body.dueDate,
      customerId: body.customerId,
      customerName: body.customerName,
      items: formattedItems,
      subtotal: body.subtotal,
      taxTotal: body.taxTotal,
      total: body.total,
      status: body.status || "pending",
      paymentMethod: body.paymentMethod,
      notes: body.notes || "",
      isGst: body.isGst !== undefined ? body.isGst : true,
      convertedToSale: false,
      discountType: body.discountType || "fixed",
      discountAmount: body.discountAmount || 0,
      discountValue: body.discountValue || 0,
    }

    console.log("Formatted invoice data:", JSON.stringify(newInvoice, null, 2))

    try {
      // Check if an invoice with this number already exists for this user
      const existingInvoice = await dbService.findOne("invoices", {
        number: invoiceNumber,
      })

      if (existingInvoice) {
        return NextResponse.json(
          {
            message: "Duplicate invoice number",
            details: "An invoice with this number already exists",
            code: "DUPLICATE_INVOICE_NUMBER",
          },
          { status: 409 },
        )
      }

      // Create the invoice with user association
      const createdInvoice = await dbService.create("invoices", newInvoice)

      return NextResponse.json({
        message: "Invoice created successfully",
        invoice: createdInvoice,
      })
    } catch (saveError: any) {
      console.error("Error saving invoice to database:", saveError)

      // Check for validation errors
      if (saveError.name === "ValidationError") {
        const validationErrors = Object.keys(saveError.errors).map((field) => ({
          field,
          message: saveError.errors[field].message,
        }))

        return NextResponse.json(
          {
            message: "Validation error while saving invoice",
            errors: validationErrors,
            details: saveError.message,
          },
          { status: 400 },
        )
      }

      // Check for duplicate key errors
      if (saveError.code === 11000) {
        return NextResponse.json(
          {
            message: "Duplicate invoice number",
            details: "An invoice with this number already exists",
            code: "DUPLICATE_INVOICE_NUMBER",
          },
          { status: 409 },
        )
      }

      return NextResponse.json(
        {
          message: "Database error while saving invoice",
          error: saveError.message,
          stack: process.env.NODE_ENV === "development" ? saveError.stack : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error creating invoice:", error)
    return NextResponse.json(
      {
        message: "An error occurred while creating the invoice",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Ensure the invoices collection exists
    await ensureCollectionExists("invoices")

    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ message: "Invoice ID is required" }, { status: 400 })
    }

    // Find the fields to update
    const updateFields: any = {}
    if (body.status) updateFields.status = body.status
    if (body.convertedToSale !== undefined) updateFields.convertedToSale = body.convertedToSale

    // Update invoice
    const result = await dbService.updateOne("invoices", { _id: dbService.toObjectId(id) }, { $set: updateFields })

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 })
    }

    // Get the updated invoice
    const updatedInvoice = await dbService.findOne("invoices", {
      _id: dbService.toObjectId(id),
    })

    return NextResponse.json({
      message: "Invoice updated successfully",
      invoice: updatedInvoice,
    })
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ message: "An error occurred while updating the invoice" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Ensure the invoices collection exists
    await ensureCollectionExists("invoices")

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Invoice ID is required" }, { status: 400 })
    }

    // Delete invoice
    const result = await dbService.deleteOne("invoices", {
      _id: dbService.toObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Invoice deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json({ message: "An error occurred while deleting the invoice" }, { status: 500 })
  }
}

