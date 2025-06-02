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

    // Get products from the product collection
    const products = await db.collection("products").find({ userId: session.user.id }).toArray()

    // Transform products to match inventory item structure
    const items = products.map((product) => ({
      _id: product._id.toString(),
      name: product.name,
      category: product.category || "Uncategorized",
      sku: product.sku || `SKU-${product._id.toString().substring(0, 8)}`,
      batchNumber: product.batchNumber || "",
      location: product.location || "",
      quantity: product.quantity || 0,
      unitPrice: product.price || 0,
      reorderLevel: product.reorderLevel || 5,
      lastUpdated: product.updatedAt || product.createdAt || new Date().toISOString(),
      expiryDate: product.expiryDate || null,
      createdBy: session.user.id,
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Error fetching inventory items:", error)
    return NextResponse.json({ error: "Failed to fetch inventory items" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const data = await request.json()

    // Create a new product
    const newProduct = {
      name: data.name,
      category: data.category,
      sku: data.sku,
      batchNumber: data.batchNumber || "",
      location: data.location || "",
      quantity: data.quantity || 0,
      price: data.unitPrice || 0,
      reorderLevel: data.reorderLevel || 5,
      expiryDate: data.expiryDate || null,
      userId: session.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await db.collection("products").insertOne(newProduct)

    // Return the newly created item with the expected structure
    const item = {
      _id: result.insertedId.toString(),
      ...newProduct,
      unitPrice: newProduct.price,
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Error adding inventory item:", error)
    return NextResponse.json({ error: "Failed to add inventory item" }, { status: 500 })
  }
}
