import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { dbConnect } from "@/lib/mongodb"
import User from "@/models/user"
import { ObjectId } from "mongodb"
import { logActivity } from "@/lib/activity-logger"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id
    const { permissions } = await request.json()

    // Validate userId
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    await dbConnect()

    const user = await User.findById(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user permissions
    user.sidebarPermissions = permissions
    await user.save()

    // Force a session update by making the user re-login
    // This ensures the new permissions are reflected immediately
    await logActivity({
      userId: session.user.id,
      action: "UPDATE_USER_PERMISSIONS",
      details: `Updated sidebar permissions for user: ${user.email}`,
      targetId: userId,
      targetType: "USER",
    })

    return NextResponse.json({
      message: "Sidebar permissions updated successfully",
      sidebarPermissions: user.sidebarPermissions,
    })
  } catch (error) {
    console.error("Error updating sidebar permissions:", error)
    return NextResponse.json({ error: "Failed to update sidebar permissions" }, { status: 500 })
  }
}

