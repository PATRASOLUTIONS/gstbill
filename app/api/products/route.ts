import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/database-service"
import { getCurrentUserId } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const products = await db
      .collection("products")
      .find({ userId: new ObjectId(userId) })
      .sort({ name: 1 })
      .toArray()

    // Ensure we always return an array
    const productsArray = Array.isArray(products) ? products : []

    console.log("Products API - returning:", productsArray.length, "products")

    return NextResponse.json(productsArray)
  } catch (error) {
    console.error("Error fetching products:", error)
    // Return empty array on error to prevent filter issues
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.name || data.price === undefined || data.stock === undefined) {
      return NextResponse.json({ error: "Name, price, and stock are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const productData = {
      ...data,
      userId: new ObjectId(userId),
      price: Number(data.price),
      stock: Number(data.stock),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("products").insertOne(productData)

    return NextResponse.json({
      _id: result.insertedId,
      ...productData,
    })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
