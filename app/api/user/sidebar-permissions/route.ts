import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const user = await db
      .collection("users")
      .findOne({ email: session.user.email }, { projection: { role: 1, sidebarPermissions: 1 } })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Default sidebar permissions based on role
    let sidebarPermissions = {
      dashboard: true,
      products: true,
      categories: true,
      customers: true,
      sales: true,
      purchases: true,
      suppliers: true,
      invoices: true,
      refunds: true,
      reports: true,
      admin: user.role === "admin",
    }

    // Override with user-specific sidebar permissions if they exist
    if (user.sidebarPermissions) {
      sidebarPermissions = { ...sidebarPermissions, ...user.sidebarPermissions }
    }

    return NextResponse.json({ sidebarPermissions })
  } catch (error) {
    console.error("Error fetching user sidebar permissions:", error)
    return NextResponse.json({ error: "Failed to fetch user sidebar permissions" }, { status: 500 })
  }
}
