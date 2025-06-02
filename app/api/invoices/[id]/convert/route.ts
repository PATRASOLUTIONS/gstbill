import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const invoiceId = params.id

    // Get the invoice
    const invoice = await db.invoice.findUnique({
      where: {
        id: invoiceId,
        userId: session.user.id,
      },
      include: {
        items: true,
        customer: true,
      },
    })

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 })
    }

    if (invoice.status !== "PENDING") {
      return new NextResponse("Only pending invoices can be converted to sales", { status: 400 })
    }

    // Create a new sale from the invoice
    const sale = await db.sale.create({
      data: {
        customerId: invoice.customerId,
        userId: session.user.id,
        totalAmount: invoice.totalAmount,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        discount: invoice.discount,
        status: "COMPLETED",
        paymentStatus: "PAID",
        paymentMethod: "CASH", // Default payment method
        notes: `Converted from Invoice #${invoice.invoiceNumber}`,
        items: {
          create: invoice.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            description: item.description || "",
          })),
        },
      },
    })

    // Update the invoice status to PAID
    await db.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        status: "PAID",
        saleId: sale.id,
      },
    })

    // Update product inventory
    for (const item of invoice.items) {
      await db.product.update({
        where: {
          id: item.productId,
        },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Invoice converted to sale successfully",
      sale,
    })
  } catch (error) {
    console.error("Error converting invoice to sale:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

