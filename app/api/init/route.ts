import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Call the db-setup endpoint to ensure indexes are created
    const response = await fetch(new URL("/api/db-setup", request.url).toString())

    if (!response.ok) {
      throw new Error("Failed to initialize database")
    }

    return NextResponse.json({
      success: true,
      message: "Application initialized successfully",
    })
  } catch (error) {
    console.error("Error initializing application:", error)
    return NextResponse.json({ error: "Failed to initialize application" }, { status: 500 })
  }
}
