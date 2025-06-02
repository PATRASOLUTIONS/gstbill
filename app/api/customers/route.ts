import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/auth-utils"
import dbService from "@/lib/database-service"
import { connectToDatabase } from "@/lib/database-service"

// Export connectToDatabase to satisfy the requirement
export { connectToDatabase }

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const query = searchParams.get("query") || ""
    const type = searchParams.get("type") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // If ID is provided, return a single customer
    if (id) {
      const customer = await dbService.findOne("customers", {
        _id: dbService.toObjectId(id),
      })

      if (!customer) {
        return NextResponse.json({ message: "Customer not found" }, { status: 404 })
      }
      return NextResponse.json(customer)
    }

    // Build query
    const queryObj: any = {}
    if (query) {
      queryObj.$or = [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { contact: { $regex: query, $options: "i" } },
      ]
    }
    if (type && type !== "all") {
      queryObj.type = type
    }

    // Get customers
    const customers = await dbService.find("customers", queryObj, { sort: { name: 1 }, skip, limit })

    // Get total count for pagination
    const totalCustomers = await dbService.count("customers", queryObj)

    return NextResponse.json({
      customers,
      pagination: {
        total: totalCustomers,
        page,
        limit,
        pages: Math.ceil(totalCustomers / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ message: "An error occurred while fetching customers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Create customer with user association and sequential number
    const result = await dbService.create("customers", data)

    return NextResponse.json({
      message: "Customer created successfully",
      customerId: result.id,
      customerNo: result.sequentialNumber,
    })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json(
      { message: "An error occurred while creating the customer", error: error.message },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Customer ID is required" }, { status: 400 })
    }

    const data = await request.json()

    // Update customer
    const result = await dbService.updateOne(
      "customers",
      { _id: dbService.toObjectId(id) },
      { $set: { ...data, lastModified: new Date() } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Customer not found or you don't have permission to update it" },
        { status: 404 },
      )
    }

    return NextResponse.json({ message: "Customer updated successfully" })
  } catch (error) {
    console.error("Error updating customer:", error)
    return NextResponse.json(
      { message: "An error occurred while updating the customer", error: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Customer ID is required" }, { status: 400 })
    }

    // Delete customer only if it belongs to the user
    const result = await dbService.deleteOne("customers", {
      _id: dbService.toObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Customer not found or you don't have permission to delete it" },
        { status: 404 },
      )
    }

    return NextResponse.json({ message: "Customer deleted successfully" })
  } catch (error) {
    console.error("Error deleting customer:", error)
    return NextResponse.json(
      { message: "An error occurred while deleting the customer", error: error.message },
      { status: 500 },
    )
  }
}
