import { NextResponse } from "next/server"
import { dbService } from "@/lib/db-service"

export async function GET() {
  try {
    // Test the database connection
    const collection = await dbService.getCollection("users")
    const count = await collection.countDocuments()

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      userCount: count,
    })
  } catch (error) {
    console.error("Database connection test failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

