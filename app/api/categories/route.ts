import { NextResponse } from "next/server"
import { dbService } from "@/lib/db-service"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "supplier"
    const id = searchParams.get("id")

    // Build query
    const query: any = {
      userId: dbService.toObjectId(session.user.id),
      type,
    }

    if (id) {
      query._id = dbService.toObjectId(id)
    }

    if (id) {
      const category = await dbService.findOne("categories", query)

      if (!category) {
        return NextResponse.json({ message: "Category not found" }, { status: 404 })
      }

      return NextResponse.json(category)
    } else {
      const categories = await dbService.find("categories", query, { sort: { name: 1 } })
      return NextResponse.json({ categories })
    }
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      {
        message: "An error occurred while fetching categories",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        {
          message: "Missing required fields: name and type are required",
        },
        { status: 400 },
      )
    }

    const category = {
      ...body,
      userId: dbService.toObjectId(session.user.id),
      createdBy: session.user.name || session.user.email,
    }

    const result = await dbService.insertOne("categories", category)

    return NextResponse.json({
      message: "Category created successfully",
      categoryId: result.insertedId,
      category: {
        ...category,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json(
      {
        message: "An error occurred while creating the category",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Category ID is required" }, { status: 400 })
    }

    const body = await req.json()

    const result = await dbService.updateOne(
      "categories",
      {
        _id: dbService.toObjectId(id),
        userId: dbService.toObjectId(session.user.id),
      },
      { $set: body },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Category updated successfully" })
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json(
      {
        message: "An error occurred while updating the category",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "Category ID is required" }, { status: 400 })
    }

    const result = await dbService.deleteOne("categories", {
      _id: dbService.toObjectId(id),
      userId: dbService.toObjectId(session.user.id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      {
        message: "An error occurred while deleting the category",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

