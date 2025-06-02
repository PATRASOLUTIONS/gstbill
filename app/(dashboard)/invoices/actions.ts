"use server"
import { auth } from "@/auth"
import { db } from "@/db"
import { formatCurrency } from "@/lib/utils"

// Other existing actions...

export async function exportInvoices({
  startDate,
  endDate,
}: {
  startDate: string
  endDate: string
}) {
  try {
    const session = await auth()

    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in to export invoices",
      }
    }

    // Get user ID from session
    const userId = session.user.id

    // Query invoices for the logged-in user within the date range
    const invoices = await db.invoice.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        customer: true,
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (invoices.length === 0) {
      return {
        success: false,
        error: "No invoices found for the selected date range",
      }
    }

    // Create CSV header
    const headers = ["Invoice Number", "Date", "Customer", "Status", "Items", "Subtotal", "Tax", "Total"].join(",")

    // Create CSV rows
    const rows = invoices.map((invoice) => {
      const itemCount = invoice.items.length
      const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
      const tax = subtotal * 0.1 // Assuming 10% tax
      const total = subtotal + tax

      return [
        invoice.invoiceNumber,
        new Date(invoice.createdAt).toLocaleDateString(),
        `${invoice.customer.name}`,
        invoice.status,
        itemCount,
        formatCurrency(subtotal),
        formatCurrency(tax),
        formatCurrency(total),
      ].join(",")
    })

    // Combine header and rows
    const csvContent = [headers, ...rows].join("\n")

    return {
      success: true,
      data: csvContent,
    }
  } catch (error) {
    console.error("Export invoices error:", error)
    return {
      success: false,
      error: "Failed to export invoices",
    }
  }
}

