import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { dbService } from "@/lib/db-service"
import { logActivity } from "@/lib/activity-logger"
import bcrypt from "bcryptjs"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const userId = params.id

    // Get request body
    const body = await req.json()
    const { name, email, password, role } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if user exists
    const user = await dbService.findOne("users", { _id: dbService.toObjectId(userId) })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent updating protected users
    if (user.email === "admin@example.com" || user.email === "demo@gmail.com") {
      if (email !== user.email || role !== user.role) {
        return NextResponse.json({ error: "Cannot modify protected user's email or role" }, { status: 403 })
      }
    }

    // Check if email is being changed and if it already exists
    if (email !== user.email) {
      const existingUser = await dbService.findOne("users", { email })
      if (existingUser) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
      }
    }

    // Prepare update data
    const updateData: any = {
      $set: {
        name,
        email,
        role,
      },
    }

    // Hash password if provided
    if (password) {
      updateData.$set.password = await bcrypt.hash(password, 10)
    }

    // Update user
    await dbService.updateOne("users", { _id: dbService.toObjectId(userId) }, updateData)

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: "UPDATE_USER",
      details: `Updated user: ${email}`,
      targetId: userId,
      targetType: "USER",
    })

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const userId = params.id

    // Check if user exists
    const user = await dbService.findOne("users", { _id: dbService.toObjectId(userId) })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent deleting protected users
    if (user.email === "admin@example.com" || user.email === "demo@gmail.com") {
      return NextResponse.json({ error: "Cannot delete protected user" }, { status: 403 })
    }

    // Delete user
    await dbService.deleteOne("users", { _id: dbService.toObjectId(userId) })

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: "DELETE_USER",
      details: `Deleted user: ${user.email}`,
      targetId: userId,
      targetType: "USER",
    })

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
