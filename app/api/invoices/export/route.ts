import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const invoices = await db.invoice.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        customer: true,
        items: true,
      },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("[INVOICES_EXPORT_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
