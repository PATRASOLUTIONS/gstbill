import { type NextRequest, NextResponse } from "next/server"
import { dbService } from "@/lib/db-service"
import { ObjectId } from "mongodb"
import mongoose from "mongoose"
import { connectToDatabase } from "@/lib/mongodb"

// Helper function to create MongoDB schema if it doesn't exist
async function ensureCollectionExists(collectionName: string) {
  try {
    const db = mongoose.connection.db
    const collections = await db.listCollections().toArray()
    const collectionExists = collections.some((col) => col.name === collectionName)

    if (!collectionExists) {
      await db.createCollection(collectionName)
      console.log(`Created collection: ${collectionName}`)
    }
  } catch (error) {
    console.error(`Error ensuring collection ${collectionName} exists:`, error)
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check for a secret token to prevent unauthorized seeding
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (token !== process.env.SEED_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    await connectToDatabase()

    // Ensure all collections exist
    const collections = [
      "users",
      "products",
      "suppliers",
      "customers",
      "purchases",
      "sales",
      "invoices",
      "refunds_customer",
      "refunds_supplier",
      "stock_alerts",
      "companies",
    ]

    for (const collection of collections) {
      await ensureCollectionExists(collection)
    }

    // Check if database already has user data
    const userCount = await dbService.countDocuments("users")
    const userExists = await dbService.findOne("users", { email: "demo@gmail.com" })

    // Clear existing data if force parameter is provided
    const force = searchParams.get("force") === "true"
    if (force) {
      for (const collection of collections) {
        await dbService.getCollection(collection).then((coll) => coll.deleteMany({}))
      }
      console.log("Cleared existing data")
    }

    // Create or update the demo user
    const userId = userExists ? userExists._id : new ObjectId("67cdf304261874da9d1756f0")

    if (!userExists) {
      await dbService.insertOne("users", {
        _id: userId,
        name: "Premium",
        email: "demo@gmail.com",
        password: "1234567890", // In production, this should be hashed
        companyName: "PATRA SOLUTIONS",
        gstin: "22AA3JSU833432",
        state: "ODISHA",
        stateCode: "ODISHA",
        contact: "18332936831",
        role: "admin",
        createdAt: new Date("2025-03-09T19:59:00.843+00:00"),
        updatedAt: new Date("2025-03-09T19:59:00.843+00:00"),
      })
    }

    // Create company details for the user
    const companyExists = await dbService.findOne("companies", { userId })

    if (!companyExists) {
      await dbService.insertOne("companies", {
        userId,
        companyName: "PATRA SOLUTIONS",
        address: ["123 Main Street", "Suite 101", "ODISHA"],
        gstin: "22AA3JSU833432",
        state: "ODISHA",
        stateCode: "ODISHA",
        contact: "18332936831",
        email: "demo@gmail.com",
        bankDetails: {
          accountHolderName: "PATRA SOLUTIONS",
          bankName: "State Bank of India",
          accountNumber: "1234567890",
          branch: "Main Branch",
          ifscCode: "SBIN0001234",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Create suppliers
    const suppliers = []
    const supplierNames = [
      "Tech Distributors Ltd",
      "Office Supplies Co",
      "Electronics Wholesale",
      "Furniture Depot",
      "Computer Parts Inc",
    ]

    for (let i = 0; i < supplierNames.length; i++) {
      const supplier = {
        _id: new ObjectId(),
        name: supplierNames[i],
        contactPerson: `Contact Person ${i + 1}`,
        email: `supplier${i + 1}@example.com`,
        phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        address: `${Math.floor(Math.random() * 100) + 1}, Some Street, ODISHA`,
        city: ["Bhubaneswar", "Cuttack", "Puri", "Rourkela"][Math.floor(Math.random() * 4)],
        state: "ODISHA",
        pincode: `${Math.floor(Math.random() * 900000) + 100000}`,
        gstin: `22AAAAA${Math.floor(Math.random() * 9000) + 1000}A1Z${Math.floor(Math.random() * 9) + 1}`,
        category: ["Electronics", "Furniture", "Office Supplies", "Computer Parts", "Stationery"][i],
        status: ["Active", "Inactive", "On Hold"][Math.floor(Math.random() * 3)],
        paymentTerms: ["Net 30", "Net 45", "Net 60", "Immediate"][Math.floor(Math.random() * 4)],
        creditLimit: Math.floor(Math.random() * 1000000) + 100000,
        outstandingBalance: Math.floor(Math.random() * 500000),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const existingSupplier = await dbService.findOne("suppliers", { name: supplier.name, userId })

      if (!existingSupplier) {
        await dbService.insertOne("suppliers", supplier)
        suppliers.push(supplier)
      } else {
        suppliers.push(existingSupplier)
      }
    }

    // Create products
    const products = []
    const productData = [
      {
        name: "Laptop - Dell XPS 15",
        category: "Electronics",
        cost: 85000,
        sellingPrice: 95000,
        supplierId: suppliers[0]._id,
      },
      {
        name: "Office Chair - Ergonomic",
        category: "Furniture",
        cost: 8500,
        sellingPrice: 12000,
        supplierId: suppliers[3]._id,
      },
      {
        name: "Printer - HP LaserJet",
        category: "Electronics",
        cost: 18000,
        sellingPrice: 22000,
        supplierId: suppliers[0]._id,
      },
      {
        name: "Desk - Standing Convertible",
        category: "Furniture",
        cost: 25000,
        sellingPrice: 35000,
        supplierId: suppliers[3]._id,
      },
      {
        name: "Smartphone - Samsung Galaxy",
        category: "Electronics",
        cost: 45000,
        sellingPrice: 55000,
        supplierId: suppliers[2]._id,
      },
      {
        name: "Monitor - 27 inch 4K",
        category: "Computer Parts",
        cost: 28000,
        sellingPrice: 35000,
        supplierId: suppliers[4]._id,
      },
      {
        name: "Keyboard - Mechanical",
        category: "Computer Parts",
        cost: 5000,
        sellingPrice: 7500,
        supplierId: suppliers[4]._id,
      },
      {
        name: "Mouse - Wireless",
        category: "Computer Parts",
        cost: 1500,
        sellingPrice: 2500,
        supplierId: suppliers[4]._id,
      },
      {
        name: "Notebook - Premium",
        category: "Stationery",
        cost: 200,
        sellingPrice: 350,
        supplierId: suppliers[1]._id,
      },
      {
        name: "Pen Set - Executive",
        category: "Stationery",
        cost: 500,
        sellingPrice: 1200,
        supplierId: suppliers[1]._id,
      },
    ]

    for (let i = 0; i < productData.length; i++) {
      const product = {
        _id: new ObjectId(),
        name: productData[i].name,
        sku: `SKU-${i + 1000}`,
        category: productData[i].category,
        description: `Description for ${productData[i].name}`,
        quantity: Math.floor(Math.random() * 100) + 10,
        reorderLevel: Math.floor(Math.random() * 20) + 5,
        cost: productData[i].cost,
        sellingPrice: productData[i].sellingPrice,
        tax: [5, 12, 18, 28][Math.floor(Math.random() * 4)],
        hsn: `${Math.floor(Math.random() * 10000) + 1000}`,
        barcode: `BAR-${1000 + i}`,
        location: ["Warehouse A", "Warehouse B", "Store Room"][Math.floor(Math.random() * 3)],
        supplierId: productData[i].supplierId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const existingProduct = await dbService.findOne("products", { sku: product.sku, userId })

      if (!existingProduct) {
        await dbService.insertOne("products", product)
        products.push(product)
      } else {
        products.push(existingProduct)
      }
    }

    // Create customers
    const customers = []
    const customerData = [
      {
        name: "Infosys Ltd",
        type: "Corporate",
        gstin: "29AABCI1234A1Z5",
      },
      {
        name: "TCS",
        type: "Corporate",
        gstin: "27AABCT1234B1Z3",
      },
      {
        name: "State Bank of India",
        type: "Government",
        gstin: "33AABCS1234C1Z1",
      },
      {
        name: "Odisha University",
        type: "Educational",
        gstin: "21AAAGO1234D1Z9",
      },
      {
        name: "John Doe",
        type: "Individual",
        gstin: null,
      },
    ]

    for (let i = 0; i < customerData.length; i++) {
      const customer = {
        _id: new ObjectId(),
        name: customerData[i].name,
        email: `customer${i + 1}@example.com`,
        phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        address: `${Math.floor(Math.random() * 100) + 1}, Some Street`,
        city: ["Bhubaneswar", "Cuttack", "Puri", "Rourkela"][Math.floor(Math.random() * 4)],
        state: "ODISHA",
        pincode: `${Math.floor(Math.random() * 900000) + 100000}`,
        gstin: customerData[i].gstin,
        type: customerData[i].type,
        status: ["Active", "Inactive", "Blocked"][Math.floor(Math.random() * 3)],
        totalOrders: 0,
        totalSpent: 0,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const existingCustomer = await dbService.findOne("customers", { name: customer.name, userId })

      if (!existingCustomer) {
        await dbService.insertOne("customers", customer)
        customers.push(customer)
      } else {
        customers.push(existingCustomer)
      }
    }

    // Create purchases
    const purchases = []
    for (let i = 0; i < 20; i++) {
      const productIndex = Math.floor(Math.random() * products.length)
      const product = products[productIndex]
      const supplier = suppliers.find((s) => s._id.toString() === product.supplierId.toString())

      const quantity = Math.floor(Math.random() * 20) + 1
      const purchasePrice = product.cost
      const totalAmount = quantity * purchasePrice

      const purchase = {
        _id: new ObjectId(),
        poNumber: `PO-${1000 + i}`,
        supplierId: supplier._id,
        supplierName: supplier.name,
        orderDate: new Date(Date.now() - Math.random() * 10000000000),
        expectedDeliveryDate: new Date(Date.now() + Math.random() * 1000000000),
        deliveryDate: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 5000000000) : null,
        status: ["Draft", "Ordered", "Partially Received", "Received", "Cancelled"][Math.floor(Math.random() * 5)],
        paymentStatus: ["Unpaid", "Partially Paid", "Paid"][Math.floor(Math.random() * 3)],
        totalAmount,
        paidAmount: Math.random() > 0.5 ? totalAmount : totalAmount * Math.random(),
        items: [
          {
            productId: product._id,
            productName: product.name,
            quantity,
            receivedQuantity: Math.floor(Math.random() * quantity),
            unitPrice: purchasePrice,
            totalPrice: quantity * purchasePrice,
            taxRate: product.tax,
            taxAmount: quantity * purchasePrice * (product.tax / 100),
          },
        ],
        notes: Math.random() > 0.7 ? `Note for purchase order ${i}` : null,
        userId,
        createdBy: "Premium",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const existingPurchase = await dbService.findOne("purchases", { poNumber: purchase.poNumber, userId })

      if (!existingPurchase) {
        await dbService.insertOne("purchases", purchase)
        purchases.push(purchase)

        // Update product quantity
        await dbService.updateOne("products", { _id: product._id }, { $inc: { quantity: quantity } })
      } else {
        purchases.push(existingPurchase)
      }
    }

    // Create sales and invoices
    const sales = []
    const invoices = []

    for (let i = 0; i < 25; i++) {
      const productIndex = Math.floor(Math.random() * products.length)
      const product = products[productIndex]
      const customer = customers[Math.floor(Math.random() * customers.length)]

      const quantity = Math.floor(Math.random() * 5) + 1
      const sellingPrice = product.sellingPrice
      const discount = Math.floor(Math.random() * 1000)
      const totalPrice = quantity * sellingPrice - discount
      const taxAmount = totalPrice * (product.tax / 100)
      const totalAmount = totalPrice + taxAmount

      const saleId = new ObjectId()
      const orderDate = new Date(Date.now() - Math.random() * 10000000000)

      const sale = {
        _id: saleId,
        orderNumber: `SO-${1000 + i}`,
        customerId: customer._id,
        customerName: customer.name,
        orderDate,
        deliveryDate: Math.random() > 0.3 ? new Date(orderDate.getTime() + Math.random() * 1000000000) : null,
        status: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"][
          Math.floor(Math.random() * 6)
        ],
        paymentStatus: ["Unpaid", "Partially Paid", "Paid", "Refunded"][Math.floor(Math.random() * 4)],
        paymentMethod: ["Cash", "Credit Card", "Bank Transfer", "UPI", "Other"][Math.floor(Math.random() * 5)],
        totalAmount,
        paidAmount: Math.random() > 0.5 ? totalAmount : totalAmount * Math.random(),
        items: [
          {
            productId: product._id,
            productName: product.name,
            quantity,
            unitPrice: sellingPrice,
            totalPrice,
            taxRate: product.tax,
            taxAmount,
            discount,
          },
        ],
        notes: Math.random() > 0.7 ? `Note for sale order ${i}` : null,
        userId,
        createdBy: "Premium",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const existingSale = await dbService.findOne("sales", { orderNumber: sale.orderNumber, userId })

      if (!existingSale) {
        await dbService.insertOne("sales", sale)
        sales.push(sale)

        // Update product quantity (decrease)
        await dbService.updateOne("products", { _id: product._id }, { $inc: { quantity: -quantity } })

        // Create invoice
        const invoice = {
          saleId,
          invoiceNumber: `INV-${1000 + i}`,
          customerName: customer.name,
          customerId: customer._id,
          invoiceDate: orderDate,
          dueDate: new Date(orderDate.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days later
          totalAmount,
          paidAmount: sale.paidAmount,
          paymentStatus: sale.paymentStatus,
          paymentMethod: sale.paymentMethod,
          items: sale.items,
          userId,
          createdBy: "Premium",
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await dbService.insertOne("invoices", invoice)
        invoices.push(invoice)

        // Update customer's total orders and total spent
        await dbService.updateOne(
          "customers",
          { _id: customer._id },
          {
            $inc: {
              totalOrders: 1,
              totalSpent: totalAmount,
            },
            $set: {
              lastOrderDate: orderDate,
            },
          },
        )
      } else {
        sales.push(existingSale)
      }
    }

    // Create refunds
    const customerRefunds = []
    for (let i = 0; i < 8; i++) {
      const sale = sales[Math.floor(Math.random() * sales.length)]
      const customer = customers.find((c) => c._id.toString() === sale.customerId.toString())
      const product = products.find((p) => p._id.toString() === sale.items[0].productId.toString())

      const quantity = Math.floor(Math.random() * sale.items[0].quantity) + 1
      const refundAmount = quantity * (sale.items[0].unitPrice - sale.items[0].discount / sale.items[0].quantity)

      const refund = {
        refundNumber: `REF-C-${1000 + i}`,
        orderNumber: sale.orderNumber,
        customerId: customer._id,
        customerName: customer.name,
        refundDate: new Date(sale.orderDate.getTime() + Math.random() * 1000000000),
        status: ["Pending", "Approved", "Processed", "Rejected"][Math.floor(Math.random() * 4)],
        refundMethod: ["Original Payment", "Store Credit", "Bank Transfer", "Cash"][Math.floor(Math.random() * 4)],
        totalAmount: refundAmount,
        reason: ["Damaged product", "Wrong item received", "Item not as described", "Changed mind"][
          Math.floor(Math.random() * 4)
        ],
        items: [
          {
            productId: product._id,
            productName: product.name,
            quantity,
            unitPrice: sale.items[0].unitPrice,
            totalPrice: refundAmount,
            reason: ["Damaged", "Defective", "Wrong item", "Not as described", "No longer needed"][
              Math.floor(Math.random() * 5)
            ],
          },
        ],
        notes: Math.random() > 0.7 ? `Note for refund ${i}` : null,
        processedBy: Math.random() > 0.5 ? "Premium" : null,
        processedDate: Math.random() > 0.5 ? new Date() : null,
        userId,
        createdBy: "Premium",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const existingRefund = await dbService.findOne("refunds_customer", { refundNumber: refund.refundNumber, userId })

      if (!existingRefund) {
        await dbService.insertOne("refunds_customer", refund)
        customerRefunds.push(refund)
      } else {
        customerRefunds.push(existingRefund)
      }
    }

    // Create supplier refunds
    const supplierRefunds = []
    for (let i = 0; i < 5; i++) {
      const purchase = purchases[Math.floor(Math.random() * purchases.length)]
      const supplier = suppliers.find((s) => s._id.toString() === purchase.supplierId.toString())
      const product = products.find((p) => p._id.toString() === purchase.items[0].productId.toString())

      const quantity = Math.floor(Math.random() * purchase.items[0].quantity) + 1
      const refundAmount = quantity * purchase.items[0].unitPrice

      const refund = {
        refundNumber: `REF-S-${1000 + i}`,
        poNumber: purchase.poNumber,
        supplierId: supplier._id,
        supplierName: supplier.name,
        refundDate: new Date(purchase.orderDate.getTime() + Math.random() * 1000000000),
        status: ["Pending", "Approved", "Processed", "Rejected"][Math.floor(Math.random() * 4)],
        refundMethod: ["Original Payment", "Credit Note", "Bank Transfer", "Cash"][Math.floor(Math.random() * 4)],
        totalAmount: refundAmount,
        reason: ["Damaged product", "Wrong item received", "Item not as described", "Order error"][
          Math.floor(Math.random() * 4)
        ],
        items: [
          {
            productId: product._id,
            productName: product.name,
            quantity,
            unitPrice: purchase.items[0].unitPrice,
            totalPrice: refundAmount,
            reason: ["Damaged", "Defective", "Wrong item", "Not as described", "Order error"][
              Math.floor(Math.random() * 5)
            ],
          },
        ],
        notes: Math.random() > 0.7 ? `Note for refund ${i}` : null,
        processedBy: Math.random() > 0.5 ? "Premium" : null,
        processedDate: Math.random() > 0.5 ? new Date() : null,
        userId,
        createdBy: "Premium",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const existingRefund = await dbService.findOne("refunds_supplier", { refundNumber: refund.refundNumber, userId })

      if (!existingRefund) {
        await dbService.insertOne("refunds_supplier", refund)
        supplierRefunds.push(refund)
      } else {
        supplierRefunds.push(existingRefund)
      }
    }

    // Create stock alerts
    const stockAlerts = []
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const reorderLevel = product.reorderLevel || 10
      const currentStock = Math.max(0, Math.floor(reorderLevel * (Math.random() * 1.5)))

      let status
      if (currentStock === 0) {
        status = "Critical"
      } else if (currentStock < reorderLevel * 0.5) {
        status = "Low"
      } else {
        status = "Reorder Soon"
      }

      const alert = {
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        currentStock,
        reorderLevel,
        minimumOrderQuantity: Math.floor(Math.random() * 10) + 5,
        lastOrderDate: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 10000000000) : null,
        expectedDeliveryDate: Math.random() > 0.7 ? new Date(Date.now() + Math.random() * 10000000000) : null,
        supplier: (await dbService.findOne("suppliers", { _id: product.supplierId }))?.name || "Unknown Supplier",
        status,
        notificationSent: Math.random() > 0.5,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const existingAlert = await dbService.findOne("stock_alerts", {
        productId: alert.productId,
        userId,
      })

      if (!existingAlert) {
        await dbService.insertOne("stock_alerts", alert)
        stockAlerts.push(alert)
      } else {
        stockAlerts.push(existingAlert)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      counts: {
        users: 1,
        suppliers: suppliers.length,
        products: products.length,
        customers: customers.length,
        purchases: purchases.length,
        sales: sales.length,
        invoices: invoices.length,
        customerRefunds: customerRefunds.length,
        supplierRefunds: supplierRefunds.length,
        stockAlerts: stockAlerts.length,
      },
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json(
      {
        error: "Failed to seed database",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
