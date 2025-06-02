import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // In a real app, you would store this in your database
    // For now, we'll just return success

    return NextResponse.json({ message: "Bank details saved successfully" })
  } catch (error) {
    console.error("Error saving bank details:", error)
    return NextResponse.json({ message: "An error occurred while saving bank details" }, { status: 500 })
  }
}
