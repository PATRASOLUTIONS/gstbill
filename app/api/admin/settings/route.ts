import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/app/api/customers/route"
import SystemSetting from "@/models/system-setting"
import { handleApiError } from "@/lib/api-utils"
import { logActivity } from "@/lib/activity-logger"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.email !== "admin@example.com" && session.user.email !== "demo@gmail.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectToDatabase()

    // Get system settings
    const settingsDoc = await SystemSetting.findOne({ key: "system_settings" }).lean()

    // Return default settings if none exist
    if (!settingsDoc) {
      const defaultSettings = {
        general: {
          companyName: "QuickBill GST",
          companyLogo: "",
          currency: "INR",
          timezone: "Asia/Kolkata",
          dateFormat: "DD/MM/YYYY",
        },
        invoice: {
          prefix: "INV-",
          termsAndConditions: "Thank you for your business!",
          showLogo: true,
          showSignature: true,
          defaultDueDays: 15,
        },
        email: {
          enableEmailNotifications: true,
          senderName: "QuickBill GST",
          senderEmail: "noreply@quickbillgst.com",
          invoiceEmailTemplate:
            "Dear {{customerName}},\n\nPlease find attached your invoice {{invoiceNumber}} for {{amount}}.\n\nRegards,\nQuickBill GST Team",
          reminderEmailTemplate:
            "Dear {{customerName}},\n\nThis is a reminder that invoice {{invoiceNumber}} for {{amount}} is due on {{dueDate}}.\n\nRegards,\nQuickBill GST Team",
        },
        security: {
          sessionTimeout: 60,
          requireStrongPasswords: true,
          enableTwoFactorAuth: false,
          passwordExpiryDays: 90,
        },
      }

      return NextResponse.json({ settings: defaultSettings })
    }

    return NextResponse.json({ settings: settingsDoc.value })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.email !== "admin@example.com" && session.user.email !== "demo@gmail.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { settings } = await req.json()

    if (!settings) {
      return NextResponse.json({ error: "Settings object is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Update or create settings
    await SystemSetting.updateOne(
      { key: "system_settings" },
      {
        $set: {
          key: "system_settings",
          value: settings,
        },
      },
      { upsert: true },
    )

    // Log activity
    await logActivity({
      user: session.user.email,
      action: "update_settings",
      details: "Updated system settings",
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ message: "Settings updated successfully" })
  } catch (error) {
    return handleApiError(error)
  }
}
