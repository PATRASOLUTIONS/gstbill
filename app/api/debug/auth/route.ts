import { NextResponse } from "next/server"
import { collections, dbConnect } from "@/lib/mongodb"
import { hash } from "bcryptjs"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    await dbConnect()
    const usersCollection = await collections.users()

    // Find the user but don't return the actual password
    const user = await usersCollection.findOne({ email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user info without the actual password
    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      passwordInfo: {
        exists: !!user.password,
        type: typeof user.password,
        length: user.password ? user.password.length : 0,
        isHashed: user.password && user.password.startsWith("$2"),
      },
    })
  } catch (error) {
    console.error("Debug auth error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// This endpoint allows resetting a user's password for testing
export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json()

    if (!email || !newPassword) {
      return NextResponse.json({ error: "Email and newPassword are required" }, { status: 400 })
    }

    await dbConnect()
    const usersCollection = await collections.users()

    // Find the user
    const user = await usersCollection.findOne({ email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10)

    // Update the user's password
    await usersCollection.updateOne({ email }, { $set: { password: hashedPassword } })

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Debug auth error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
