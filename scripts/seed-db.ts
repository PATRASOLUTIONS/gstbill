import { dbService } from "../lib/db-service"
import { ObjectId } from "mongodb"

async function seedDatabase() {
  try {
    console.log("Starting database seeding...")

    // Clear existing data
    const collections = ["users", "products", "suppliers", "customers", "purchases", "sales", "refunds", "companies"]
    for (const collection of collections) {
      const coll = await dbService.getCollection(collection)
      await coll.deleteMany({})
      console.log(`Cleared ${collection} collection`)
    }

    // Create a demo user
    // In production, you would hash the password
    // const hashedPassword = await hash('password123', 10)
    const userId = new ObjectId()

    await dbService.insertOne("users", {
      _id: userId,
      name: "Demo User",
      email: "admin@example.com",
      password: "password123", // In production, use hashedPassword
      companyName: "Demo Company",
      gstin: "27AADCB2230M1ZT",
      state: "Maharashtra",
      stateCode: "27",
      contact: "+91 9876543210",
      role: "admin",
    })
    console.log("Created demo user")

    // Create company details
    await dbService.insertOne("companies", {
      userId: userId,
      companyName: "Demo Company",
      address: ["123 Main Street", "Suite 101", "Mumbai, Maharashtra"],
      gstin: "27AADCB2230M1ZT",
      state: "Maharashtra",
      stateCode: "27",
      contact: "+91 9876543210",
      email: "admin@example.com",
      bankDetails: {
        accountHolderName: "Demo Company",
        bankName: "State Bank of India",
        accountNumber: "1234567890",
        branch: "Mumbai Main Branch",
        ifscCode: "SBIN0001234",
      },
    })
    console.log("Created company details")

    // Create categories
    const categories = ["Electronics", "Clothing", "Food & Beverages", "Office Supplies", "Raw Materials"]

    // Create suppliers
    const supplierIds = []
    for (let i = 1; i <= 10; i++) {
      const supplierId = new ObjectId()
      supplierIds.push(supplierId)

      await dbService.insertOne("suppliers", {
        _id: supplierId,
        name: `Supplier ${i}`,
        contactPerson: `Contact Person ${i}`,
        email: `supplier${i}@example.com`,
        phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        address: `${Math.floor(Math.random() * 100) + 1}, Some Street`,
        city: ["Mumbai", "Delhi", "Bangalore", "Chennai"][Math.floor(Math.random() * 4)],
        state: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu"][Math.floor(Math.random() * 4)],
        pincode: `${Math.floor(Math.random() * 900000) + 100000}`,
        gstin: `${Math.floor(Math.random() * 90) + 10}AAAAA${Math.floor(Math.random() * 9000) + 1000}A1Z${Math.floor(Math.random() * 9) + 1}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        status: ["Active", "Inactive", "On Hold"][Math.floor(Math.random() * 3)],
        paymentTerms: ["Net 30", "Net 45", "Net 60", "Immediate"][Math.floor(Math.random() * 4)],
        creditLimit: Math.floor(Math.random() * 1000000) + 100000,
        outstandingBalance: Math.floor(Math.random() * 500000),
        userId: userId,
      })
    }
    console.log("Created suppliers")

    // Create customers
    const customerIds = []
    for (let i = 1; i <= 20; i++) {
      const customerId = new ObjectId()
      customerIds.push(customerId)

      const isBusinessCustomer = Math.random() > 0.5

      await dbService.insertOne("customers", {
        _id: customerId,
        name: isBusinessCustomer ? `Business Customer ${i}` : `Individual Customer ${i}`,
        email: `customer${i}@example.com`,
        phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        address: `${Math.floor(Math.random() * 100) + 1}, Some Street`,
        city: ["Mumbai", "Delhi", "Bangalore", "Chennai"][Math.floor(Math.random() * 4)],
        state: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu"][Math.floor(Math.random() * 4)],
        pincode: `${Math.floor(Math.random() * 900000) + 100000}`,
        gstin: isBusinessCustomer
          ? `${Math.floor(Math.random() * 90) + 10}AAAAA${Math.floor(Math.random() * 9000) + 1000}A1Z${Math.floor(Math.random() * 9) + 1}`
          : null,
        type: isBusinessCustomer ? "Business" : "Individual",
        status: ["Active", "Inactive", "Blocked"][Math.floor(Math.random() * 3)],
        totalOrders: Math.floor(Math.random() * 20),
        totalSpent: Math.floor(Math.random() * 100000),
        userId: userId,
      })
    }
    console.log("Created customers")

    // Create products
    const productIds = []
    for (let i = 1; i <= 50; i++) {
      const productId = new ObjectId()
      productIds.push(productId)

      const category = categories[Math.floor(Math.random() * categories.length)]
      const supplierId = supplierIds[Math.floor(Math.random() * supplierIds.length)]

      await dbService.insertOne("products", {
        _id: productId,
        name: `Product ${i}`,
        sku: `SKU-${1000 + i}`,
        category,
        description: `Description for product ${i}`,
        quantity: Math.floor(Math.random() * 100),
        reorderLevel: Math.floor(Math.random() * 20) + 5,
        cost: Number.parseFloat((Math.random() * 1000 + 100).toFixed(2)),
        sellingPrice: Number.parseFloat((Math.random() * 2000 + 200).toFixed(2)),
        tax: [5, 12, 18, 28][Math.floor(Math.random() * 4)],
        hsn: `${Math.floor(Math.random() * 10000) + 1000}`,
        barcode: Math.random() > 0.3 ? `BAR-${1000 + i}` : null,
        location: ["Warehouse A", "Warehouse B", "Store Room"][Math.floor(Math.random() * 3)],
        supplierId,
        userId: userId,
      })
    }
    console.log("Created products")

    // Create purchases
    for (let i = 1; i <= 20; i++) {
      const supplierId = supplierIds[Math.floor(Math.random() * supplierIds.length)]
      const supplierData = await dbService.findOne("suppliers", { _id: supplierId })

      const numItems = Math.floor(Math.random() * 5) + 1
      const items = []
      let totalAmount = 0

      for (let j = 0; j < numItems; j++) {
        const productId = productIds[Math.floor(Math.random() * productIds.length)]
        const productData = await dbService.findOne("products", { _id: productId })

        const quantity = Math.floor(Math.random() * 20) + 1
        const unitPrice = productData.cost
        const taxRate = productData.tax
        const totalPrice = quantity * unitPrice
        const taxAmount = totalPrice * (taxRate / 100)

        totalAmount += totalPrice + taxAmount

        items.push({
          productId,
          productName: productData.name,
          quantity,
          receivedQuantity: Math.floor(Math.random() * quantity),
          unitPrice,
          totalPrice,
          taxRate,
          taxAmount,
        })
      }

      const status = ["Draft", "Ordered", "Partially Received", "Received", "Cancelled"][Math.floor(Math.random() * 5)]
      const paymentStatus = ["Unpaid", "Partially Paid", "Paid"][Math.floor(Math.random() * 3)]
      const paidAmount =
        paymentStatus === "Paid" ? totalAmount : paymentStatus === "Partially Paid" ? totalAmount * Math.random() : 0

      const orderDate = new Date(Date.now() - Math.random() * 10000000000)

      await dbService.insertOne("purchases", {
        poNumber: `PO-${new Date().getFullYear()}-${1000 + i}`,
        supplierId,
        supplierName: supplierData.name,
        orderDate,
        expectedDeliveryDate: new Date(orderDate.getTime() + Math.random() * 1000000000),
        deliveryDate: status === "Received" ? new Date(orderDate.getTime() + Math.random() * 2000000000) : null,
        status,
        paymentStatus,
        totalAmount,
        paidAmount,
        items,
        notes: Math.random() > 0.7 ? `Note for purchase order ${i}` : null,
        userId: userId,
        createdBy: "Demo User",
      })
    }
    console.log("Created purchases")

    // Create sales
    for (let i = 1; i <= 30; i++) {
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)]
      const customerData = await dbService.findOne("customers", { _id: customerId })

      const numItems = Math.floor(Math.random() * 5) + 1
      const items = []
      let totalAmount = 0

      for (let j = 0; j < numItems; j++) {
        const productId = productIds[Math.floor(Math.random() * productIds.length)]
        const productData = await dbService.findOne("products", { _id: productId })

        const quantity = Math.floor(Math.random() * 5) + 1
        const unitPrice = productData.sellingPrice
        const discount = Math.floor(Math.random() * 100)
        const taxRate = productData.tax
        const totalPrice = quantity * unitPrice - discount
        const taxAmount = totalPrice * (taxRate / 100)

        totalAmount += totalPrice + taxAmount

        items.push({
          productId,
          productName: productData.name,
          quantity,
          unitPrice,
          totalPrice,
          taxRate,
          taxAmount,
          discount,
        })
      }

      const status = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"][
        Math.floor(Math.random() * 6)
      ]
      const paymentStatus = ["Unpaid", "Partially Paid", "Paid", "Refunded"][Math.floor(Math.random() * 4)]
      const paymentMethod = ["Cash", "Credit Card", "Bank Transfer", "UPI", "Other"][Math.floor(Math.random() * 5)]
      const paidAmount =
        paymentStatus === "Paid" ? totalAmount : paymentStatus === "Partially Paid" ? totalAmount * Math.random() : 0

      const orderDate = new Date(Date.now() - Math.random() * 10000000000)

      await dbService.insertOne("sales", {
        orderNumber: `SO-${new Date().getFullYear()}-${1000 + i}`,
        customerId,
        customerName: customerData.name,
        orderDate,
        deliveryDate: status === "Delivered" ? new Date(orderDate.getTime() + Math.random() * 1000000000) : null,
        status,
        paymentStatus,
        paymentMethod,
        totalAmount,
        paidAmount,
        items,
        notes: Math.random() > 0.7 ? `Note for sale order ${i}` : null,
        userId: userId,
        createdBy: "Demo User",
      })
    }
    console.log("Created sales")

    // Create refunds
    for (let i = 1; i <= 10; i++) {
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)]
      const customerData = await dbService.findOne("customers", { _id: customerId })

      const numItems = Math.floor(Math.random() * 3) + 1
      const items = []
      let totalAmount = 0

      for (let j = 0; j < numItems; j++) {
        const productId = productIds[Math.floor(Math.random() * productIds.length)]
        const productData = await dbService.findOne("products", { _id: productId })

        const quantity = Math.floor(Math.random() * 3) + 1
        const unitPrice = productData.sellingPrice
        const totalPrice = quantity * unitPrice

        totalAmount += totalPrice

        items.push({
          productId,
          productName: productData.name,
          quantity,
          unitPrice,
          totalPrice,
          reason: ["Damaged", "Defective", "Wrong item", "Not as described", "No longer needed"][
            Math.floor(Math.random() * 5)
          ],
        })
      }

      const status = ["Pending", "Approved", "Processed", "Rejected"][Math.floor(Math.random() * 4)]
      const refundMethod = ["Original Payment", "Store Credit", "Bank Transfer", "Cash"][Math.floor(Math.random() * 4)]

      const refundDate = new Date(Date.now() - Math.random() * 10000000000)

      await dbService.insertOne("refunds", {
        refundNumber: `REF-${new Date().getFullYear()}-${1000 + i}`,
        orderNumber: `SO-${new Date().getFullYear()}-${1000 + Math.floor(Math.random() * 30)}`,
        customerId,
        customerName: customerData.name,
        refundDate,
        status,
        refundMethod,
        totalAmount,
        reason: ["Damaged product", "Wrong item received", "Item not as described", "Changed mind"][
          Math.floor(Math.random() * 4)
        ],
        items,
        notes: Math.random() > 0.7 ? `Note for refund ${i}` : null,
        processedBy: status === "Processed" ? "Demo User" : null,
        processedDate: status === "Processed" ? new Date(refundDate.getTime() + Math.random() * 1000000000) : null,
        userId: userId,
        createdBy: "Demo User",
      })
    }
    console.log("Created refunds")

    console.log("Database seeding completed successfully!")
  } catch (error) {
    console.error("Error seeding database:", error)
  }
}

// Run the seed function
seedDatabase()
