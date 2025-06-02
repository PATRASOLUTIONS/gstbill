import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Import db dynamically to avoid build-time issues
    const { db } = await import("@/lib/db")

    const invoices = await db.invoice.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        customer: true,
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("[INVOICES_EXPORT_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
