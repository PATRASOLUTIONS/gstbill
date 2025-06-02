import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const includeDetails = searchParams.get("includeDetails") === "true"

    // Validate date parameters
    let startDate: Date | null = null
    let endDate: Date | null = null

    if (startDateParam) {
      try {
        startDate = new Date(startDateParam)
        if (isNaN(startDate.getTime())) {
          return NextResponse.json({ error: "Invalid start date format" }, { status: 400 })
        }
      } catch (error) {
        return NextResponse.json({ error: "Invalid start date format" }, { status: 400 })
      }
    }

    if (endDateParam) {
      try {
        endDate = new Date(endDateParam)
        if (isNaN(endDate.getTime())) {
          return NextResponse.json({ error: "Invalid end date format" }, { status: 400 })
        }
      } catch (error) {
        return NextResponse.json({ error: "Invalid end date format" }, { status: 400 })
      }
    }

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json({ error: "Start date cannot be after end date" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Build query
    const query: any = {}

    if (status && status !== "all") {
      query.status = status
    }

    if (type && type !== "all") {
      query.type = type
    }

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        query.createdAt.$gte = startDate
      }
      if (endDate) {
        // Add one day to include the end date fully
        const nextDay = new Date(endDate)
        nextDay.setDate(nextDay.getDate() + 1)
        query.createdAt.$lte = nextDay
      }
    }

    // Get refunds with proper error handling
    let refunds
    try {
      refunds = await db.collection("refunds").find(query).sort({ createdAt: -1 }).toArray()
    } catch (dbError) {
      console.error("Database error when fetching refunds:", dbError)
      return NextResponse.json({ error: "Failed to fetch refunds data" }, { status: 500 })
    }

    // Populate references if includeDetails is true
    if (includeDetails && refunds.length > 0) {
      try {
        // Get all customer and supplier IDs
        const customerIds = refunds
          .filter((r) => r.type === "customer" && r.customer)
          .map((r) => {
            try {
              return new ObjectId(r.customer)
            } catch (error) {
              console.warn(`Invalid customer ID format: ${r.customer}`)
              return null
            }
          })
          .filter(Boolean)

        const supplierIds = refunds
          .filter((r) => r.type === "supplier" && r.supplier)
          .map((r) => {
            try {
              return new ObjectId(r.supplier)
            } catch (error) {
              console.warn(`Invalid supplier ID format: ${r.supplier}`)
              return null
            }
          })
          .filter(Boolean)

        const saleIds = refunds
          .filter((r) => r.type === "customer" && r.sale)
          .map((r) => {
            try {
              return new ObjectId(r.sale)
            } catch (error) {
              console.warn(`Invalid sale ID format: ${r.sale}`)
              return null
            }
          })
          .filter(Boolean)

        const purchaseIds = refunds
          .filter((r) => r.type === "supplier" && r.purchase)
          .map((r) => {
            try {
              return new ObjectId(r.purchase)
            } catch (error) {
              console.warn(`Invalid purchase ID format: ${r.purchase}`)
              return null
            }
          })
          .filter(Boolean)

        // Fetch related data
        const [customers, suppliers, sales, purchases] = await Promise.all([
          customerIds.length > 0
            ? db
                .collection("customers")
                .find({ _id: { $in: customerIds } })
                .toArray()
            : [],
          supplierIds.length > 0
            ? db
                .collection("suppliers")
                .find({ _id: { $in: supplierIds } })
                .toArray()
            : [],
          saleIds.length > 0
            ? db
                .collection("sales")
                .find({ _id: { $in: saleIds } })
                .toArray()
            : [],
          purchaseIds.length > 0
            ? db
                .collection("purchases")
                .find({ _id: { $in: purchaseIds } })
                .toArray()
            : [],
        ])

        // Create lookup maps
        const customerMap = customers.reduce((map, customer) => {
          map[customer._id.toString()] = customer
          return map
        }, {})

        const supplierMap = suppliers.reduce((map, supplier) => {
          map[supplier._id.toString()] = supplier
          return map
        }, {})

        const saleMap = sales.reduce((map, sale) => {
          map[sale._id.toString()] = sale
          return map
        }, {})

        const purchaseMap = purchases.reduce((map, purchase) => {
          map[purchase._id.toString()] = purchase
          return map
        }, {})

        // Populate refunds with related data
        refunds = refunds.map((refund) => {
          const refundObj = { ...refund }

          if (refund.type === "customer" && refund.customer) {
            try {
              const customerId = refund.customer.toString()
              refundObj.customerDetails = customerMap[customerId] || null
            } catch (error) {
              console.warn(`Error processing customer details for refund ${refund._id}:`, error)
            }
          }

          if (refund.type === "supplier" && refund.supplier) {
            try {
              const supplierId = refund.supplier.toString()
              refundObj.supplierDetails = supplierMap[supplierId] || null
            } catch (error) {
              console.warn(`Error processing supplier details for refund ${refund._id}:`, error)
            }
          }

          if (refund.type === "customer" && refund.sale) {
            try {
              const saleId = refund.sale.toString()
              refundObj.saleDetails = saleMap[saleId] || null
            } catch (error) {
              console.warn(`Error processing sale details for refund ${refund._id}:`, error)
            }
          }

          if (refund.type === "supplier" && refund.purchase) {
            try {
              const purchaseId = refund.purchase.toString()
              refundObj.purchaseDetails = purchaseMap[purchaseId] || null
            } catch (error) {
              console.warn(`Error processing purchase details for refund ${refund._id}:`, error)
            }
          }

          return refundObj
        })
      } catch (lookupError) {
        console.error("Error populating refund references:", lookupError)
        // Continue with unpopulated refunds rather than failing the export
      }
    }

    // Prepare CSV data
    let headers = [
      { label: "Refund Number", key: "refundNumber" },
      { label: "Type", key: "type" },
      { label: "Amount", key: "amount" },
      { label: "Status", key: "status" },
      { label: "Reason", key: "reason" },
      { label: "Date", key: "createdAt" },
    ]

    if (includeDetails) {
      headers = [
        ...headers,
        { label: "Reference Number", key: "referenceNumber" },
        { label: "Customer/Supplier", key: "entityName" },
        { label: "Contact", key: "contact" },
        { label: "Email", key: "email" },
        { label: "Notes", key: "notes" },
      ]
    }

    const csvData = refunds.map((refund) => {
      const baseData = {
        refundNumber: refund.refundNumber || "N/A",
        type: refund.type === "customer" ? "Customer" : "Supplier",
        amount: typeof refund.amount === "number" ? refund.amount.toFixed(2) : "0.00",
        status: refund.status ? refund.status.charAt(0).toUpperCase() + refund.status.slice(1) : "Unknown",
        reason: refund.reason || "N/A",
        createdAt: refund.createdAt ? new Date(refund.createdAt).toLocaleDateString() : "N/A",
        notes: refund.notes || "",
      }

      if (includeDetails) {
        let referenceNumber = "N/A"
        let entityName = "N/A"
        let contact = "N/A"
        let email = "N/A"

        try {
          if (refund.type === "customer") {
            referenceNumber = refund.saleDetails?.saleNumber || "N/A"
            entityName = refund.customerDetails?.name || "N/A"
            contact = refund.customerDetails?.phone || "N/A"
            email = refund.customerDetails?.email || "N/A"
          } else {
            referenceNumber = refund.purchaseDetails?.purchaseNumber || "N/A"
            entityName = refund.supplierDetails?.name || "N/A"
            contact = refund.supplierDetails?.phone || "N/A"
            email = refund.supplierDetails?.email || "N/A"
          }
        } catch (error) {
          console.warn(`Error formatting detailed data for refund ${refund._id}:`, error)
        }

        return {
          ...baseData,
          referenceNumber,
          entityName,
          contact,
          email,
        }
      }

      return baseData
    })

    return NextResponse.json({
      success: true,
      refunds,
      headers,
      data: csvData,
    })
  } catch (error) {
    console.error("Error exporting refunds:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}

