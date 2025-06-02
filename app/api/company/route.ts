import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()

    // Check if companies collection exists, create it if not
    const collections = await db.listCollections({ name: "companies" }).toArray()
    if (collections.length === 0) {
      await db.createCollection("companies")
    }

    // Find company for the current user
    const company = await db.collection("companies").findOne({
      userId: session.user.id,
    })

    if (!company) {
      return NextResponse.json({
        message: "No company information found",
        data: null,
      })
    }

    return NextResponse.json({
      message: "Company information retrieved successfully",
      data: company,
    })
  } catch (error) {
    console.error("Error fetching company data:", error)
    return NextResponse.json(
      {
        message: "An error occurred while fetching company data",
      },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const client = await clientPromise
    const db = client.db()

    // Check if companies collection exists, create it if not
    const collections = await db.listCollections({ name: "companies" }).toArray()
    if (collections.length === 0) {
      await db.createCollection("companies")
    }

    // Prepare company data
    const companyData = {
      userId: session.user.id,
      companyName: body.companyName,
      address: Array.isArray(body.address) ? body.address : [body.address],
      gstin: body.gstin,
      state: body.state,
      stateCode: body.stateCode,
      contact: body.contact,
      email: body.email,
      logo: body.logo || "",
      currency: body.currency || "INR",
      taxRate: body.taxRate || "18",
      bankDetails: {
        accountHolderName: body.bankDetails?.accountHolderName || "",
        bankName: body.bankDetails?.bankName || "",
        accountNumber: body.bankDetails?.accountNumber || "",
        branch: body.bankDetails?.branch || "",
        ifscCode: body.bankDetails?.ifscCode || "",
      },
      updatedAt: new Date(),
    }

    // Check if company already exists for this user
    const existingCompany = await db.collection("companies").findOne({
      userId: session.user.id,
    })

    if (existingCompany) {
      // Update existing company
      await db.collection("companies").updateOne({ userId: session.user.id }, { $set: { ...companyData } })
    } else {
      // Create new company
      companyData.createdAt = new Date()
      await db.collection("companies").insertOne(companyData)
    }

    return NextResponse.json({
      message: "Company information saved successfully",
      data: companyData,
    })
  } catch (error) {
    console.error("Error saving company data:", error)
    return NextResponse.json(
      {
        message: "An error occurred while saving company data",
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: Request) {
  // Redirect to POST for simplicity
  return POST(req)
}

