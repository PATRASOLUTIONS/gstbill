import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { dbConnect } from "@/lib/mongodb"
import User from "@/models/user"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Fetch the latest user data from the database
    const user = await User.findById(session.user.id).select("sidebarPermissions role")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // For admin users, return all permissions as true
    if (user.role === "admin") {
      return NextResponse.json({
        sidebarPermissions: {
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
          inventory: true,
          "stock-alerts": true,
          settings: true,
          admin: true,
        },
      })
    }

    // For regular users, return their specific permissions
    return NextResponse.json({
      sidebarPermissions: user.sidebarPermissions || {
        dashboard: true,
        products: true,
        invoices: true,
      },
    })
  } catch (error) {
    console.error("Error fetching sidebar permissions:", error)
    return NextResponse.json({ error: "Failed to fetch sidebar permissions" }, { status: 500 })
  }
}
