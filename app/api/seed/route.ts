import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { exec } from "child_process"
import { promisify } from "util"

const execPromise = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.email !== "demo@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (token !== process.env.SEED_TOKEN) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Run the seed script
    const { stdout, stderr } = await execPromise("npx ts-node -r tsconfig-paths/register scripts/seed-data.ts")

    if (stderr) {
      console.error("Seed script error:", stderr)
      return NextResponse.json({ error: "Error running seed script", details: stderr }, { status: 500 })
    }

    return NextResponse.json({
      message: "Database seeded successfully",
      details: stdout,
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json(
      {
        error: "An error occurred while seeding the database",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
