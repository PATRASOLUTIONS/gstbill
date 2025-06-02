import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { dbConnect } from "@/lib/mongodb"
import User from "@/models/user"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    await dbConnect()

    const user = await User.findOne({ email }).select("sidebarPermissions role")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // For admin users, return all permissions
    if (user.role === "admin") {
      return NextResponse.json({
        permissions: [
          "dashboard",
          "products",
          "categories",
          "customers",
          "sales",
          "purchases",
          "suppliers",
          "invoices",
          "refunds",
          "reports",
          "admin",
          "inventory",
          "stock-alerts",
          "settings",
        ],
      })
    }

    // For regular users, return their specific permissions
    const sidebarPermissions = user.sidebarPermissions || {
      dashboard: true,
      sales: true,
      invoices: true,
    }

    // Convert object to array of permitted sections
    const permissions = Object.entries(sidebarPermissions)
      .filter(([_, value]) => value === true)
      .map(([key]) => key)

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error("Error fetching user permissions:", error)
    return NextResponse.json({ error: "Failed to fetch user permissions" }, { status: 500 })
  }
}

