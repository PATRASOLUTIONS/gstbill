import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import dbConnect from "@/lib/mongodb"
import Invoice from "@/models/invoice"
import Customer from "@/models/customer"
import Company from "@/models/company"
import Bank from "@/models/bank"
import mongoose from "mongoose"

export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the invoice ID from the query parameters
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    // Debug info
    const debugInfo: any = {
      invoiceId: id,
      dbConnectionStatus: "Not connected",
      steps: [],
      models: {
        invoice: null,
        customer: null,
        company: null,
        bank: null,
      },
    }

    // Step 1: Connect to database
    try {
      debugInfo.steps.push("Connecting to database")
      await dbConnect()
      debugInfo.dbConnectionStatus = "Connected"
      debugInfo.steps.push("Database connection successful")
    } catch (error) {
      debugInfo.steps.push(`Database connection failed: ${(error as Error).message}`)
      return NextResponse.json(
        {
          error: "Database connection failed",
          debugInfo,
        },
        { status: 500 },
      )
    }

    // Step 2: Check if ID is valid MongoDB ObjectId
    try {
      debugInfo.steps.push("Validating invoice ID format")
      if (!mongoose.Types.ObjectId.isValid(id)) {
        debugInfo.steps.push("Invalid invoice ID format")
        return NextResponse.json(
          {
            error: "Invalid invoice ID format",
            debugInfo,
          },
          { status: 400 },
        )
      }
      debugInfo.steps.push("Invoice ID format is valid")
    } catch (error) {
      debugInfo.steps.push(`ID validation error: ${(error as Error).message}`)
      return NextResponse.json(
        {
          error: "Failed to validate invoice ID",
          debugInfo,
        },
        { status: 500 },
      )
    }

    // Step 3: Get invoice data
    let invoice
    try {
      debugInfo.steps.push("Fetching invoice")
      invoice = await Invoice.findById(id)
      if (!invoice) {
        debugInfo.steps.push("Invoice not found")
        return NextResponse.json(
          {
            error: "Invoice not found",
            debugInfo,
          },
          { status: 404 },
        )
      }
      debugInfo.steps.push("Invoice found")
      debugInfo.models.invoice = {
        id: invoice._id,
        number: invoice.number,
        customerId: invoice.customerId,
        hasCustomerId: !!invoice.customerId,
      }
    } catch (error) {
      debugInfo.steps.push(`Error finding invoice: ${(error as Error).message}`)
      return NextResponse.json(
        {
          error: "Failed to fetch invoice",
          details: (error as Error).message,
          debugInfo,
        },
        { status: 500 },
      )
    }

    // Step 4: Get customer data
    let customer
    try {
      if (!invoice.customerId) {
        debugInfo.steps.push("Invoice has no customerId")
        return NextResponse.json(
          {
            error: "Invoice has no customerId",
            debugInfo,
          },
          { status: 400 },
        )
      }

      debugInfo.steps.push(`Fetching customer with ID: ${invoice.customerId}`)
      customer = await Customer.findById(invoice.customerId)

      if (!customer) {
        debugInfo.steps.push("Customer not found")
        return NextResponse.json(
          {
            error: "Customer not found",
            debugInfo,
          },
          { status: 404 },
        )
      }

      debugInfo.steps.push("Customer found")
      debugInfo.models.customer = {
        id: customer._id,
        name: customer.name,
      }
    } catch (error) {
      debugInfo.steps.push(`Error finding customer: ${(error as Error).message}`)
      return NextResponse.json(
        {
          error: "Failed to fetch customer data",
          details: (error as Error).message,
          debugInfo,
        },
        { status: 500 },
      )
    }

    // Step 5: Get company details
    try {
      debugInfo.steps.push("Fetching company details")
      const company = await Company.findOne({})
      debugInfo.models.company = company ? { exists: true } : { exists: false }
      debugInfo.steps.push(company ? "Company found" : "No company found")
    } catch (error) {
      debugInfo.steps.push(`Error finding company: ${(error as Error).message}`)
      // Continue without company data
    }

    // Step 6: Get bank details
    try {
      debugInfo.steps.push("Fetching bank details")
      const bank = await Bank.findOne({})
      debugInfo.models.bank = bank ? { exists: true } : { exists: false }
      debugInfo.steps.push(bank ? "Bank found" : "No bank found")
    } catch (error) {
      debugInfo.steps.push(`Error finding bank: ${(error as Error).message}`)
      // Continue without bank data
    }

    // Return debug info
    return NextResponse.json({
      message: "Debug information retrieved successfully",
      debugInfo,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "An error occurred during debugging",
        details: (error as Error).message,
        stack: process.env.NODE_ENV === "development" ? (error as Error).stack : undefined,
      },
      { status: 500 },
    )
  }
}

