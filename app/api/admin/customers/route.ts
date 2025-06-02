import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/app/api/customers/route"
import Customer from "@/models/customer"
import { handleApiError } from "@/lib/api-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.email !== "admin@example.com" && session.user.email !== "demo@gmail.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectToDatabase()

    // Get all customers
    const customers = await Customer.find({}).lean()

    return NextResponse.json({ customers })
  } catch (error) {
    return handleApiError(error)
  }
}

