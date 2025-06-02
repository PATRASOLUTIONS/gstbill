import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { connectToDatabase } from "@/lib/mongodb"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get all products for the user
    const products = await db.collection("products").find({ userId: session.user.id }).toArray()

    // Transform products to match inventory item structure
    const items = products.map((product) => ({
      Name: product.name,
      Category: product.category || "Uncategorized",
      SKU: product.sku || `SKU-${product._id.toString().substring(0, 8)}`,
      "Batch Number": product.batchNumber || "",
      Location: product.location || "",
      Quantity: product.quantity || 0,
      "Unit Price": product.price || 0,
      "Total Value": (product.quantity || 0) * (product.price || 0),
      "Reorder Level": product.reorderLevel || 5,
      Status: getItemStatus(product.quantity || 0, product.reorderLevel || 5),
      "Last Updated": product.updatedAt || product.createdAt || new Date().toISOString(),
      "Expiry Date": product.expiryDate || "",
    }))

    // Convert to CSV
    const headers = Object.keys(items[0] || {})
    const csvRows = [
      headers.join(","),
      ...items.map((item) =>
        headers
          .map((header) => {
            const value = item[header as keyof typeof item]
            // Handle values that might contain commas
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(","),
      ),
    ]

    const csv = csvRows.join("\n")

    // Return CSV as a blob
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="inventory_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting inventory:", error)
    return NextResponse.json({ error: "Failed to export inventory" }, { status: 500 })
  }
}

// Helper function to determine item status
function getItemStatus(quantity: number, reorderLevel: number): string {
  if (quantity === 0) return "Out of Stock"
  if (quantity <= reorderLevel) return "Low Stock"
  return "In Stock"
}
