import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { collections, dbConnect } from "@/lib/mongodb"

export async function GET() {
  try {
    await dbConnect()
    const usersCollection = await collections.users()

    // Check if test user already exists
    const existingUser = await usersCollection.findOne({ email: "test@example.com" })

    if (existingUser) {
      // Update the password
      const hashedPassword = await hash("password123", 10)
      await usersCollection.updateOne({ email: "test@example.com" }, { $set: { password: hashedPassword } })
      return NextResponse.json({ message: "Test user password updated" })
    }

    // Create test user
    const hashedPassword = await hash("password123", 10)

    await usersCollection.insertOne({
      name: "Test User",
      email: "test@example.com",
      password: hashedPassword,
      role: "admin",
      createdAt: new Date(),
      sidebarPermissions: {
        dashboard: true,
        products: true,
        invoices: true,
        customers: true,
        suppliers: true,
        purchases: true,
        sales: true,
        refunds: true,
        reports: true,
        settings: true,
        admin: true,
      },
    })

    return NextResponse.json({ message: "Test user created successfully" })
  } catch (error) {
    console.error("Error creating test user:", error)
    return NextResponse.json({ error: "Failed to create test user" }, { status: 500 })
  }
}
