import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import dbConnect from "@/lib/mongodb"
import Invoice from "@/models/invoice"
import Customer from "@/models/customer"
import Company from "@/models/company"
import mongoose from "mongoose"

export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    await dbConnect()

    // Get the invoice ID from the query parameters
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    console.log(`Fetching invoice with ID: ${id}`)

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid invoice ID format" }, { status: 400 })
    }

    // Get invoice data
    const invoice = await Invoice.findById(id)
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Get customer data
    const customer = await Customer.findById(invoice.customerId)
    if (!customer) {
      return NextResponse.json(
        {
          error: "Customer not found",
          customerId: invoice.customerId,
        },
        { status: 404 },
      )
    }

    // Get company data (we only need one company record)
    const company = await Company.findOne({})
    if (!company) {
      return NextResponse.json({ error: "Company information not found" }, { status: 404 })
    }

    // Format the data for the PDF generator
    const formattedData = {
      invoice: {
        _id: invoice._id,
        number: invoice.number,
        date: invoice.date,
        dueDate: invoice.dueDate,
        items: invoice.items,
        subtotal: invoice.subtotal,
        taxTotal: invoice.taxTotal,
        total: invoice.total,
        status: invoice.status,
        paymentMethod: invoice.paymentMethod,
        notes: invoice.notes,
      },
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        gstin: customer.gstin,
      },
      company: {
        _id: company._id,
        name: company.companyName,
        address: company.address,
        gstin: company.gstin,
        state: company.state,
        stateCode: company.stateCode,
        contact: company.contact,
        email: company.email,
        taxRate: company.taxRate,
        bankDetails: company.bankDetails,
      },
    }

    console.log("Successfully prepared response data")
    return NextResponse.json(formattedData)
  } catch (error) {
    console.error("Error in invoice download API:", error)
    return NextResponse.json(
      {
        error: "An error occurred while fetching invoice data",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
