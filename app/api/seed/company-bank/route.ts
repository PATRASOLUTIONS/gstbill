import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import dbConnect from "@/lib/mongodb"
import Company from "@/models/company"
import Bank from "@/models/bank"

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    await dbConnect()

    // Company data
    const companyData = {
      name: "Your Amazing Store",
      address: "123 Business Street\nTech City, State - 560001",
      gstin: "29AADCB2230M1ZP",
      email: "contact@youramazingstore.com",
      phone: "9876543210",
      website: "www.youramazingstore.com",
    }

    // Bank data
    const bankData = {
      accountHolderName: "Your Amazing Store",
      bankName: "State Bank of India",
      accountNumber: "1234567890123456",
      ifscCode: "SBIN0000123",
      branch: "Tech City Branch",
    }

    // Seed company data
    let company
    try {
      // Check if company exists
      company = await Company.findOne({})

      if (!company) {
        // Create new company
        company = await Company.create(companyData)
        console.log("Company created")
      } else {
        // Update existing company
        company = await Company.findByIdAndUpdate(company._id, companyData, { new: true })
        console.log("Company updated")
      }
    } catch (error) {
      console.error("Error seeding company data:", error)
      return NextResponse.json(
        {
          error: "Failed to seed company data",
          details: (error as Error).message,
        },
        { status: 500 },
      )
    }

    // Seed bank data
    let bank
    try {
      // Check if bank exists
      bank = await Bank.findOne({})

      if (!bank) {
        // Create new bank
        bank = await Bank.create(bankData)
        console.log("Bank created")
      } else {
        // Update existing bank
        bank = await Bank.findByIdAndUpdate(bank._id, bankData, { new: true })
        console.log("Bank updated")
      }
    } catch (error) {
      console.error("Error seeding bank data:", error)
      return NextResponse.json(
        {
          error: "Failed to seed bank data",
          details: (error as Error).message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      message: "Company and bank data seeded successfully",
      company: company,
      bank: bank,
    })
  } catch (error) {
    console.error("Unhandled error in seed API:", error)
    return NextResponse.json(
      {
        error: "An error occurred while seeding data",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

