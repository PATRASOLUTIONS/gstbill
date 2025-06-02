import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import User from "@/models/user"
import { dbConnect } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    // Check if the request is from an admin
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, password, role } = await req.json()

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Set default sidebar permissions based on role
    const sidebarPermissions = {
      dashboard: true,
      products: true,
      categories: false,
      customers: false,
      sales: false,
      purchases: false,
      suppliers: false,
      invoices: true,
      refunds: false,
      reports: false,
      admin: false,
      inventory: false,
      "stock-alerts": false,
      settings: false,
    }

    // If admin, grant all permissions
    if (role === "admin") {
      Object.keys(sidebarPermissions).forEach((key) => {
        sidebarPermissions[key] = true
      })
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      sidebarPermissions,
    })

    await newUser.save()

    return NextResponse.json({ message: "User created successfully" }, { status: 201 })
  } catch (error) {
    console.error("User creation error:", error)
    return NextResponse.json({ error: "An error occurred during user creation" }, { status: 500 })
  }
}

