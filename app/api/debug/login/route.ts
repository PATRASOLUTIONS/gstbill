import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/database-service"
import { compare } from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Find the user
    const user = await db.collection("users").findOne({
      email: email.toLowerCase().trim(),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found", status: "user_not_found" }, { status: 404 })
    }

    // Check if password exists and is a string
    if (!user.password || typeof user.password !== "string") {
      return NextResponse.json(
        {
          error: "Invalid password format in database",
          status: "invalid_password_format",
          passwordInfo: {
            exists: !!user.password,
            type: typeof user.password,
          },
        },
        { status: 500 },
      )
    }

    // Check if password is valid
    let isPasswordValid = false
    try {
      isPasswordValid = await compare(password, user.password)
    } catch (error) {
      return NextResponse.json(
        {
          error: "Error comparing passwords",
          status: "password_compare_error",
          details: (error as Error).message,
        },
        { status: 500 },
      )
    }

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid password", status: "invalid_password" }, { status: 401 })
    }

    return NextResponse.json({
      message: "Login credentials are valid",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name || "User",
      },
    })
  } catch (error) {
    console.error("Debug login error:", error)
    return NextResponse.json(
      {
        error: "Something went wrong",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
