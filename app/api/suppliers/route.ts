import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/auth-utils"
import dbService from "@/lib/database-service"

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const query = searchParams.get("query") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // If ID is provided, return a single supplier
    if (id) {
      const supplier = await dbService.findOne("suppliers", {
        _id: dbService.toObjectId(id),
      })

      if (!supplier) {
        return NextResponse.json({ message: "Supplier not found" }, { status: 404 })
      }
      return NextResponse.json(supplier)
    }

    // Build query
    const queryObj: any = {}
    if (query) {
      queryObj.$or = [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { contactPerson: { $regex: query, $options: "i" } },
      ]
    }

    // Get suppliers
    const suppliers = await dbService.find("suppliers", queryObj, { sort: { name: 1 }, skip, limit })

    // Get total count for pagination
    const totalSuppliers = await dbService.count("suppliers", queryObj)

    return NextResponse.json({
      suppliers,
      pagination: {
        total: totalSuppliers,
        page,
        limit,
        pages: Math.ceil(totalSuppliers / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return NextResponse.json({ message: "An error occurred while fetching suppliers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Create supplier with user association and sequential number
    const result = await dbService.create("suppliers", data)

    return NextResponse.json({
      message: "Supplier created successfully",
      supplierId: result.id,
      supplierNo: result.sequentialNumber,
    })
  } catch (error) {
    console.error("Error creating supplier:", error)
    return NextResponse.json(
      { message: "An error occurred while creating the supplier", error: error.message },
      { status: 500 },
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Supplier ID is required" }, { status: 400 })
    }

    const body = await req.json()

    const result = await dbService.updateOne("suppliers", { _id: dbService.toObjectId(id) }, { $set: body })

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Supplier not found" }, { status: 404 })
    }

    // Get the updated supplier to return
    const updatedSupplier = await dbService.findOne("suppliers", {
      _id: dbService.toObjectId(id),
    })

    return NextResponse.json({
      message: "Supplier updated successfully",
      supplier: updatedSupplier,
    })
  } catch (error) {
    console.error("Error updating supplier:", error)
    return NextResponse.json(
      {
        message: "An error occurred while updating the supplier",
        error: error instanceof Error ? error.message : String(error),
      },
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
      return NextResponse.json({ message: "Supplier ID is required" }, { status: 400 })
    }

    // Delete supplier only if it belongs to the user
    const result = await dbService.deleteOne("suppliers", {
      _id: dbService.toObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Supplier not found or you don't have permission to delete it" },
        { status: 404 },
      )
    }

    return NextResponse.json({ message: "Supplier deleted successfully" })
  } catch (error) {
    console.error("Error deleting supplier:", error)
    return NextResponse.json(
      { message: "An error occurred while deleting the supplier", error: error.message },
      { status: 500 },
    )
  }
}
