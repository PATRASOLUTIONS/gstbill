import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import * as XLSX from "xlsx"

export async function GET(request: Request) {
  try {
    // Get the session
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    console.log("Export customers for user:", session.user)

    // Get the format from the query parameters
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"

    // Connect to the database
    const { db } = await connectToDatabase()

    // Try different user identifiers to find the right one
    const possibleUserIdentifiers = [
      { createdBy: session.user.id },
      { createdBy: session.user.email },
      { userId: session.user.id },
      { user_id: session.user.id },
      { user: session.user.id },
      { owner: session.user.id },
      { owner: session.user.email },
    ]

    let customers = []
    let userIdentifier = null

    // Try each identifier until we find customers
    for (const identifier of possibleUserIdentifiers) {
      console.log("Trying identifier:", identifier)
      const result = await db.collection("customers").find(identifier).toArray()
      if (result.length > 0) {
        customers = result
        userIdentifier = identifier
        console.log(`Found ${result.length} customers with identifier:`, identifier)
        break
      }
    }

    // If no customers found with specific identifiers, try to get a sample to examine
    if (customers.length === 0) {
      const sampleCustomers = await db.collection("customers").find({}).limit(5).toArray()

      if (sampleCustomers.length > 0) {
        console.log("Sample customer fields:", Object.keys(sampleCustomers[0]))

        // Look for fields that might contain user information
        const userFields = Object.keys(sampleCustomers[0]).filter(
          (key) =>
            key.toLowerCase().includes("user") ||
            key.toLowerCase().includes("creat") ||
            key.toLowerCase().includes("owner"),
        )

        console.log("Potential user identifier fields:", userFields)

        // Try each potential field
        for (const field of userFields) {
          const fieldValues = sampleCustomers.map((c) => c[field])
          console.log(`Values for field ${field}:`, fieldValues)
        }
      } else {
        console.log("No customers found in the database")
      }
    }

    console.log(`Exporting ${customers.length} customers`)

    // Format the data for export - include ALL fields
    const formattedData = customers.map((customer) => {
      // Create a base object with common fields
      const formattedCustomer: Record<string, any> = {
        "Customer Name": customer.name,
        Email: customer.email,
        Phone: customer.contact || "",
        "Customer Type": customer.customerType || "Individual",
        GSTIN: customer.gstin || "",
        Address: customer.address || "",
        "Created Date": new Date(customer.createdAt).toLocaleString(),
      }

      // Add any additional fields that might be present
      Object.keys(customer).forEach((key) => {
        // Skip fields we've already added and internal MongoDB fields
        if (
          !["name", "email", "contact", "customerType", "gstin", "address", "createdAt", "_id"].includes(key) &&
          !key.startsWith("_")
        ) {
          // Format the field name to be more readable
          const formattedKey = key
            .replace(/([A-Z])/g, " $1") // Add space before capital letters
            .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter

          // Add the field to our formatted customer object
          formattedCustomer[formattedKey] = customer[key]
        }
      })

      return formattedCustomer
    })

    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData)

    // Create a workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers")

    // Generate buffer
    const buffer =
      format === "xlsx"
        ? XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
        : XLSX.write(workbook, { type: "buffer", bookType: "csv" })

    // Set the appropriate content type and filename
    const contentType =
      format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv"

    const filename =
      format === "xlsx"
        ? `customers-export-${new Date().toISOString().split("T")[0]}.xlsx`
        : `customers-export-${new Date().toISOString().split("T")[0]}.csv`

    // Return the response
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting customers:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

