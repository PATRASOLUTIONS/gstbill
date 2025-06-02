import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { format } from "date-fns"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    console.log("Export API called")
    const searchParams = request.nextUrl.searchParams
    const exportFormat = searchParams.get("format") || "csv"
    const exportAll = searchParams.get("exportAll") === "true"

    console.log("Export params:", { exportFormat, exportAll })

    // Connect to the database
    const { db } = await connectToDatabase()

    console.log("Connected to database, retrieving all invoices")

    // Fetch ALL invoices without any filtering
    const invoices = await db.collection("invoices").find({}).toArray()
    console.log(`Found ${invoices.length} invoices to export`)

    if (invoices.length === 0) {
      return NextResponse.json({ error: "No invoices found to export" }, { status: 404 })
    }

    // Process invoices to ensure proper data structure
    const processedInvoices = invoices.map(processInvoiceForExport)
    console.log(`Processed ${processedInvoices.length} invoices for export`)

    // Generate the export file based on the requested format
    let fileContent: any
    let contentType: string
    let fileExtension: string

    switch (exportFormat) {
      case "csv":
        fileContent = generateCsv(processedInvoices)
        contentType = "text/csv"
        fileExtension = "csv"
        break
      case "xlsx":
        fileContent = await generateExcel(processedInvoices)
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        fileExtension = "xlsx"
        break
      case "json":
        fileContent = JSON.stringify(processedInvoices, null, 2)
        contentType = "application/json"
        fileExtension = "json"
        break
      default:
        return NextResponse.json({ error: "Unsupported export format" }, { status: 400 })
    }

    // Check if we have valid content
    if (!fileContent || (typeof fileContent === "string" && fileContent === "No data to export")) {
      console.error("No valid content generated for export")
      return NextResponse.json({ error: "Failed to generate export content" }, { status: 500 })
    }

    console.log(`Generated ${fileExtension} file successfully`)

    // Return the file
    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename=invoice-data-export-${format(
          new Date(),
          "yyyy-MM-dd",
        )}.${fileExtension}`,
      },
    })
  } catch (error) {
    console.error("Error exporting invoices:", error)
    return NextResponse.json(
      { error: "Failed to export invoices: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}

// Helper function to process an invoice for export
function processInvoiceForExport(invoice: any) {
  try {
    // Create a clean copy of the invoice
    const processed: any = { ...invoice }

    // Format dates
    if (processed.date) {
      try {
        processed.date = format(new Date(processed.date), "yyyy-MM-dd")
      } catch (e) {
        processed.date = String(processed.date)
      }
    }

    if (processed.dueDate) {
      try {
        processed.dueDate = format(new Date(processed.dueDate), "yyyy-MM-dd")
      } catch (e) {
        processed.dueDate = String(processed.dueDate)
      }
    }

    if (processed.createdAt) {
      try {
        processed.createdAt = format(new Date(processed.createdAt), "yyyy-MM-dd HH:mm:ss")
      } catch (e) {
        processed.createdAt = String(processed.createdAt)
      }
    }

    if (processed.updatedAt) {
      try {
        processed.updatedAt = format(new Date(processed.updatedAt), "yyyy-MM-dd HH:mm:ss")
      } catch (e) {
        processed.updatedAt = String(processed.updatedAt)
      }
    }

    // Convert MongoDB ObjectId to string
    if (processed._id) {
      processed._id = String(processed._id)
    }

    // Handle items for CSV/Excel export
    if (processed.items && Array.isArray(processed.items)) {
      // Create a string representation of items for flat exports
      processed.itemsJson = JSON.stringify(processed.items)
      processed.itemCount = processed.items.length

      // Process each item
      processed.items.forEach((item: any, index: number) => {
        if (item._id) {
          item._id = String(item._id)
        }
      })
    } else {
      processed.itemCount = 0
      processed.itemsJson = "[]"
    }

    return processed
  } catch (error) {
    console.error("Error processing invoice for export:", error, invoice)
    // Return a simplified version if processing fails
    return {
      _id: String(invoice._id || ""),
      number: invoice.number || "",
      error: "Failed to process this invoice fully",
    }
  }
}

// Helper function to generate CSV
function generateCsv(invoices: any[]) {
  if (!invoices || invoices.length === 0) {
    console.error("No invoices provided to generateCsv")
    return "No data to export"
  }

  try {
    console.log(`Generating CSV for ${invoices.length} invoices`)

    // Get all unique headers from all invoices
    const allHeaders = new Set<string>()
    invoices.forEach((invoice) => {
      Object.keys(invoice).forEach((key) => {
        // Skip the items array as we'll use itemsJson instead
        if (key !== "items") {
          allHeaders.add(key)
        }
      })
    })

    const headers = Array.from(allHeaders)
    console.log(`CSV headers: ${headers.join(", ")}`)

    // Create CSV header row
    let csv = headers.join(",") + "\r\n"

    // Add data rows
    invoices.forEach((invoice, index) => {
      const row = headers.map((header) => {
        // Skip the items array
        if (header === "items") return ""

        const value = invoice[header] !== undefined ? invoice[header] : ""

        // Handle different data types
        if (value === null) return ""

        if (typeof value === "object") {
          // Convert objects to JSON strings
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        }

        // Escape quotes and wrap in quotes if the value contains a comma, quote, or newline
        if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
          return `"${value.replace(/"/g, '""')}"`
        }

        return value
      })

      csv += row.join(",") + "\r\n"

      // Log progress for large datasets
      if (index % 100 === 0) {
        console.log(`Processed ${index}/${invoices.length} rows for CSV`)
      }
    })

    console.log(`CSV generation complete, size: ${csv.length} characters`)
    return csv
  } catch (error) {
    console.error("Error generating CSV:", error)
    return "Error generating CSV: " + (error instanceof Error ? error.message : String(error))
  }
}

// Helper function to generate Excel
async function generateExcel(invoices: any[]) {
  if (!invoices || invoices.length === 0) {
    console.error("No invoices provided to generateExcel")
    return Buffer.from("No data to export")
  }

  try {
    console.log(`Generating Excel for ${invoices.length} invoices`)

    // Create a new workbook
    const workbook = XLSX.utils.book_new()

    // Create a deep copy of invoices with proper structure for Excel
    const processedInvoices = invoices.map((invoice) => {
      // Create a flattened version of the invoice without the items array
      const { items, ...rest } = invoice

      // Make sure all values are properly formatted for Excel
      Object.keys(rest).forEach((key) => {
        const value = rest[key]

        // Convert objects to strings
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
          rest[key] = JSON.stringify(value)
        }
      })

      return rest
    })

    console.log(`Processed ${processedInvoices.length} invoices for Excel`)

    // Convert to worksheet
    const worksheet = XLSX.utils.json_to_sheet(processedInvoices)

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices")

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })
    console.log(`Excel generation complete, buffer size: ${excelBuffer.length} bytes`)

    return excelBuffer
  } catch (error) {
    console.error("Error generating Excel:", error)
    // Return an error message as buffer
    return Buffer.from("Error generating Excel: " + (error instanceof Error ? error.message : String(error)))
  }
}

