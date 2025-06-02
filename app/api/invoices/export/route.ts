import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectToDatabase } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { db } = await connectToDatabase()
    const invoicesCollection = db.collection("invoices")

    const invoices = await invoicesCollection.find({ userId: session.user.id }).sort({ createdAt: -1 }).toArray()

    // Get customer and product details for each invoice
    const customersCollection = db.collection("customers")
    const productsCollection = db.collection("products")

    const enrichedInvoices = await Promise.all(
      invoices.map(async (invoice) => {
        let customer = null
        if (invoice.customerId) {
          customer = await customersCollection.findOne({ _id: invoice.customerId })
        }

        // Get product details for invoice items
        const items = invoice.items || []
        const enrichedItems = await Promise.all(
          items.map(async (item: any) => {
            const product = await productsCollection.findOne({ _id: item.productId })
            return {
              ...item,
              product: product || null,
            }
          }),
        )

        return {
          ...invoice,
          customer,
          items: enrichedItems,
        }
      }),
    )

    return NextResponse.json(enrichedInvoices)
  } catch (error) {
    console.error("[INVOICES_EXPORT_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
