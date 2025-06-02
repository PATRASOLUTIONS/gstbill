import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { dbService } from "@/lib/db-service"
import { writeFile } from "fs/promises"
import path from "path"
import { mkdir } from "fs/promises"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const purchaseId = formData.get("purchaseId") as string

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (!purchaseId) {
      return NextResponse.json({ error: "Purchase ID is required" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const uniqueFilename = `${Date.now()}-${file.name}`
    const filePath = path.join(uploadsDir, uniqueFilename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save file info to database
    const fileInfo = {
      fileName: file.name,
      fileUrl: `/uploads/${uniqueFilename}`,
      fileType: file.type,
      uploadedAt: new Date(),
    }

    // Update purchase with file info
    await dbService.updateOne(
      "purchases",
      { _id: dbService.toObjectId(purchaseId), userId: dbService.toObjectId(session.user.id) },
      { $push: { attachments: fileInfo } },
    )

    return NextResponse.json({
      message: "File uploaded successfully",
      file: fileInfo,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      {
        message: "An error occurred while uploading the file",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

