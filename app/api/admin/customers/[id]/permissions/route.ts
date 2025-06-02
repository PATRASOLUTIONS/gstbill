import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/app/api/customers/route"
import Customer from "@/models/customer"
import { handleApiError } from "@/lib/api-utils"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.email !== "admin@example.com" && session.user.email !== "demo@gmail.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const customerId = params.id
    const { permissions } = await req.json()

    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: "Invalid permissions format" }, { status: 400 })
    }

    await connectToDatabase()

    // Update customer permissions
    const result = await Customer.updateOne({ _id: customerId }, { $set: { permissions } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Permissions updated successfully" })
  } catch (error) {
    return handleApiError(error)
  }
}
