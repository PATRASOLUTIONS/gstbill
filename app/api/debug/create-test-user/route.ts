import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/database-service"
import { hash } from "bcryptjs"

export async function POST(req: Request) {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== "development" && !process.env.ALLOW_TEST_USER_CREATION) {
      return NextResponse.json({ error: "Not allowed in production" }, { status: 403 })
    }

    const { email = "test@example.com", password = "password123", name = "Test User" } = await req.json()

    const { db } = await connectToDatabase()

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email })

    if (existingUser) {
      // Update the existing user's password
      const hashedPassword = await hash(password, 10)

      await db.collection("users").updateOne(
        { email },
        {
          $set: {
            password: hashedPassword,
            name,
            updatedAt: new Date(),
          },
        },
      )

      return NextResponse.json({
        message: "Test user updated",
        email,
        name,
        id: existingUser._id.toString(),
      })
    }

    // Create new user
    const hashedPassword = await hash(password, 10)

    const result = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      message: "Test user created",
      email,
      name,
      id: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Error creating test user:", error)
    return NextResponse.json(
      {
        error: "Failed to create test user",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
