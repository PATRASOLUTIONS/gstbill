import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Sale } from "@/types"

interface GetSalesOptions {
  page?: number
  pageSize?: number
  query?: string
  sort?: Record<string, 1 | -1>
  limit?: number
}

export async function getSales({
  page = 1,
  pageSize = 10,
  query = "",
  sort = { date: -1 }, // Default sort by date descending (newest first)
  limit,
}: GetSalesOptions = {}) {
  try {
    const { db } = await connectToDatabase()

    // Create filter based on search query
    const filter = query
      ? {
          $or: [
            { invoiceNumber: { $regex: query, $options: "i" } },
            { "customer.name": { $regex: query, $options: "i" } },
          ],
        }
      : {}

    // Get total count for pagination
    const totalSales = await db.collection("sales").countDocuments(filter)

    // Create base query
    let salesQuery = db.collection("sales").find(filter).sort(sort)

    // Apply pagination if no limit is specified
    if (!limit) {
      salesQuery = salesQuery.skip((page - 1) * pageSize).limit(pageSize)
    } else {
      // Apply limit if specified
      salesQuery = salesQuery.limit(limit)
    }

    // Execute query
    const sales = await salesQuery.toArray()

    // Transform MongoDB _id to string id
    const transformedSales = sales.map((sale) => ({
      id: sale._id.toString(),
      invoiceNumber: sale.invoiceNumber,
      date: sale.date,
      customer: sale.customer,
      items: sale.items,
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      taxAmount: sale.taxAmount,
      total: sale.total,
      paymentStatus: sale.paymentStatus,
      paymentMethod: sale.paymentMethod,
      notes: sale.notes,
    }))

    return transformedSales
  } catch (error) {
    console.error("Failed to fetch sales:", error)
    return []
  }
}

export async function getSaleById(id: string) {
  try {
    const { db } = await connectToDatabase()

    const sale = await db.collection("sales").findOne({ _id: new ObjectId(id) })

    if (!sale) return null

    return {
      id: sale._id.toString(),
      invoiceNumber: sale.invoiceNumber,
      date: sale.date,
      customer: sale.customer,
      items: sale.items,
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      taxAmount: sale.taxAmount,
      total: sale.total,
      paymentStatus: sale.paymentStatus,
      paymentMethod: sale.paymentMethod,
      notes: sale.notes,
    }
  } catch (error) {
    console.error("Failed to fetch sale:", error)
    return null
  }
}

export async function createSale(saleData: Omit<Sale, "id">) {
  try {
    const { db } = await connectToDatabase()

    // Generate invoice number if not provided
    if (!saleData.invoiceNumber) {
      const lastSale = await db.collection("sales").findOne({}, { sort: { invoiceNumber: -1 } })

      const lastInvoiceNumber = lastSale?.invoiceNumber || "INV-0000"
      const invoiceNumber = Number.parseInt(lastInvoiceNumber.split("-")[1])
      saleData.invoiceNumber = `INV-${(invoiceNumber + 1).toString().padStart(4, "0")}`
    }

    const result = await db.collection("sales").insertOne({
      ...saleData,
      createdAt: new Date().toISOString(),
    })

    return {
      id: result.insertedId.toString(),
      ...saleData,
    }
  } catch (error) {
    console.error("Failed to create sale:", error)
    throw new Error("Failed to create sale")
  }
}

export async function updateSale(id: string, saleData: Partial<Sale>) {
  try {
    const { db } = await connectToDatabase()

    await db.collection("sales").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...saleData,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    return {
      id,
      ...saleData,
    }
  } catch (error) {
    console.error("Failed to update sale:", error)
    throw new Error("Failed to update sale")
  }
}

export async function deleteSale(id: string) {
  try {
    const { db } = await connectToDatabase()

    await db.collection("sales").deleteOne({ _id: new ObjectId(id) })

    return true
  } catch (error) {
    console.error("Failed to delete sale:", error)
    throw new Error("Failed to delete sale")
  }
}

export async function getNextInvoiceNumber() {
  try {
    const { db } = await connectToDatabase()

    const lastSale = await db.collection("sales").findOne({}, { sort: { invoiceNumber: -1 } })

    const lastInvoiceNumber = lastSale?.invoiceNumber || "INV-0000"
    const invoiceNumber = Number.parseInt(lastInvoiceNumber.split("-")[1])
    return `INV-${(invoiceNumber + 1).toString().padStart(4, "0")}`
  } catch (error) {
    console.error("Failed to generate invoice number:", error)
    return "INV-0001"
  }
}
