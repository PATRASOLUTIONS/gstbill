import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import User from "@/models/user"
import Product from "@/models/product"
import Supplier from "@/models/supplier"
import Purchase from "@/models/purchase"
import Sale from "@/models/sale"
import Customer from "@/models/customer"
import Invoice from "@/models/invoice"
import RefundCustomer from "@/models/refund-customer"
import RefundSupplier from "@/models/refund-supplier"
import StockAlert from "@/models/stock-alert"

async function seedDatabase() {
  try {
    console.log("Connecting to database...")
    await connectToDatabase()
    console.log("Connected to database")

    // Check if user exists
    const existingUser = await User.findOne({ email: "demo@gmail.com" })
    const userEmail = "demo@gmail.com"

    if (!existingUser) {
      console.log("Creating user...")
      // Create user
      await User.create({
        _id: "67cdf304261874da9d1756f0",
        name: "Premium",
        email: "demo@gmail.com",
        password: "1234567890",
        companyName: "PATRA SOLUTIONS",
        gstin: "22AA3JSU833432",
        state: "ODISHA",
        stateCode: "ODISHA",
        contact: "18332936831",
        role: "admin",
        createdAt: new Date("2025-03-09T19:59:00.843+00:00"),
        updatedAt: new Date("2025-03-09T19:59:00.843+00:00"),
      })
      console.log("User created")
    } else {
      console.log("User already exists, skipping creation")
    }

    // Create suppliers
    console.log("Creating suppliers...")
    const suppliers = [
      {
        name: "Tech Distributors Ltd",
        contact: "9876543210",
        paymentTerms: "Net 30",
        email: "tech@distributor.com",
        address: "123 Tech Park, Bhubaneswar, Odisha",
        createdBy: userEmail,
      },
      {
        name: "Office Supplies Co",
        contact: "8765432109",
        paymentTerms: "Net 15",
        email: "office@supplies.com",
        address: "456 Business Center, Cuttack, Odisha",
        createdBy: userEmail,
      },
      {
        name: "Electronics Wholesale",
        contact: "7654321098",
        paymentTerms: "Net 45",
        email: "sales@electronics.com",
        address: "789 Electronic Market, Puri, Odisha",
        createdBy: userEmail,
      },
    ]

    const createdSuppliers = []
    for (const supplier of suppliers) {
      const existingSupplier = await Supplier.findOne({
        name: supplier.name,
        createdBy: userEmail,
      })

      if (!existingSupplier) {
        const newSupplier = await Supplier.create(supplier)
        createdSuppliers.push(newSupplier)
        console.log(`Supplier created: ${supplier.name}`)
      } else {
        createdSuppliers.push(existingSupplier)
        console.log(`Supplier already exists: ${supplier.name}`)
      }
    }

    // Create products
    console.log("Creating products...")
    const products = [
      {
        name: "Laptop - Dell XPS 15",
        sku: "DELL-XPS15-001",
        category: "Electronics",
        quantity: 25,
        cost: 85000,
        sellingPrice: 95000,
        supplierID: createdSuppliers[0]._id,
        expiryDate: null,
        barcode: "4901234123457",
        description: "High-performance laptop with 16GB RAM and 512GB SSD",
        createdBy: userEmail,
      },
      {
        name: "Office Chair - Ergonomic",
        sku: "CHAIR-ERGO-002",
        category: "Furniture",
        quantity: 15,
        cost: 8500,
        sellingPrice: 12000,
        supplierID: createdSuppliers[1]._id,
        expiryDate: null,
        barcode: "5901234123458",
        description: "Adjustable ergonomic office chair with lumbar support",
        createdBy: userEmail,
      },
      {
        name: "Printer - HP LaserJet",
        sku: "HP-LASER-003",
        category: "Electronics",
        quantity: 10,
        cost: 18000,
        sellingPrice: 22000,
        supplierID: createdSuppliers[0]._id,
        expiryDate: null,
        barcode: "6901234123459",
        description: "High-speed laser printer with duplex printing",
        createdBy: userEmail,
      },
      {
        name: "Desk - Standing Convertible",
        sku: "DESK-STAND-004",
        category: "Furniture",
        quantity: 8,
        cost: 25000,
        sellingPrice: 35000,
        supplierID: createdSuppliers[1]._id,
        expiryDate: null,
        barcode: "7901234123460",
        description: "Adjustable standing desk with electric height control",
        createdBy: userEmail,
      },
      {
        name: "Smartphone - Samsung Galaxy",
        sku: "SAMSUNG-GAL-005",
        category: "Electronics",
        quantity: 30,
        cost: 45000,
        sellingPrice: 55000,
        supplierID: createdSuppliers[2]._id,
        expiryDate: null,
        barcode: "8901234123461",
        description: "Latest Samsung Galaxy smartphone with 128GB storage",
        createdBy: userEmail,
      },
    ]

    const createdProducts = []
    for (const product of products) {
      const existingProduct = await Product.findOne({
        sku: product.sku,
        createdBy: userEmail,
      })

      if (!existingProduct) {
        const newProduct = await Product.create(product)
        createdProducts.push(newProduct)
        console.log(`Product created: ${product.name}`)
      } else {
        createdProducts.push(existingProduct)
        console.log(`Product already exists: ${product.name}`)
      }
    }

    // Create customers
    console.log("Creating customers...")
    const customers = [
      {
        name: "Infosys Ltd",
        contact: "9123456780",
        email: "procurement@infosys.com",
        customerType: "Corporate",
        gstin: "29AABCI1234A1Z5",
        address: "Infosys Campus, Bhubaneswar, Odisha",
        createdBy: userEmail,
      },
      {
        name: "TCS",
        contact: "9234567801",
        email: "orders@tcs.com",
        customerType: "Corporate",
        gstin: "27AABCT1234B1Z3",
        address: "TCS Office, Cuttack, Odisha",
        createdBy: userEmail,
      },
      {
        name: "State Bank of India",
        contact: "9345678012",
        email: "procurement@sbi.co.in",
        customerType: "Government",
        gstin: "33AABCS1234C1Z1",
        address: "SBI Regional Office, Puri, Odisha",
        createdBy: userEmail,
      },
      {
        name: "Odisha University",
        contact: "9456780123",
        email: "purchase@odishauniv.ac.in",
        customerType: "Educational",
        gstin: "21AAAGO1234D1Z9",
        address: "University Campus, Bhubaneswar, Odisha",
        createdBy: userEmail,
      },
    ]

    const createdCustomers = []
    for (const customer of customers) {
      const existingCustomer = await Customer.findOne({
        name: customer.name,
        createdBy: userEmail,
      })

      if (!existingCustomer) {
        const newCustomer = await Customer.create(customer)
        createdCustomers.push(newCustomer)
        console.log(`Customer created: ${customer.name}`)
      } else {
        createdCustomers.push(existingCustomer)
        console.log(`Customer already exists: ${customer.name}`)
      }
    }

    // Create purchases
    console.log("Creating purchases...")
    const purchases = [
      {
        supplierID: createdSuppliers[0]._id,
        productID: createdProducts[0]._id,
        quantity: 10,
        purchasePrice: 85000,
        purchaseDate: new Date("2025-01-15"),
        status: "Completed",
        invoiceNumber: "PUR-2025-001",
        paymentStatus: "Paid",
        createdBy: userEmail,
      },
      {
        supplierID: createdSuppliers[1]._id,
        productID: createdProducts[1]._id,
        quantity: 20,
        purchasePrice: 8500,
        purchaseDate: new Date("2025-01-20"),
        status: "Completed",
        invoiceNumber: "PUR-2025-002",
        paymentStatus: "Paid",
        createdBy: userEmail,
      },
      {
        supplierID: createdSuppliers[0]._id,
        productID: createdProducts[2]._id,
        quantity: 5,
        purchasePrice: 18000,
        purchaseDate: new Date("2025-02-05"),
        status: "Completed",
        invoiceNumber: "PUR-2025-003",
        paymentStatus: "Paid",
        createdBy: userEmail,
      },
      {
        supplierID: createdSuppliers[2]._id,
        productID: createdProducts[4]._id,
        quantity: 15,
        purchasePrice: 45000,
        purchaseDate: new Date("2025-02-15"),
        status: "Completed",
        invoiceNumber: "PUR-2025-004",
        paymentStatus: "Paid",
        createdBy: userEmail,
      },
    ]

    for (const purchase of purchases) {
      const existingPurchase = await Purchase.findOne({
        invoiceNumber: purchase.invoiceNumber,
        createdBy: userEmail,
      })

      if (!existingPurchase) {
        await Purchase.create(purchase)
        console.log(`Purchase created: ${purchase.invoiceNumber}`)
      } else {
        console.log(`Purchase already exists: ${purchase.invoiceNumber}`)
      }
    }

    // Create sales
    console.log("Creating sales...")
    const sales = [
      {
        customerID: createdCustomers[0]._id,
        productID: createdProducts[0]._id,
        quantity: 5,
        sellingPrice: 95000,
        saleDate: new Date("2025-02-10"),
        status: "Completed",
        discountApplied: 2000,
        invoiceNumber: "INV-2025-001",
        paymentStatus: "Paid",
        createdBy: userEmail,
      },
      {
        customerID: createdCustomers[1]._id,
        productID: createdProducts[1]._id,
        quantity: 10,
        sellingPrice: 12000,
        saleDate: new Date("2025-02-15"),
        status: "Completed",
        discountApplied: 1000,
        invoiceNumber: "INV-2025-002",
        paymentStatus: "Paid",
        createdBy: userEmail,
      },
      {
        customerID: createdCustomers[2]._id,
        productID: createdProducts[2]._id,
        quantity: 2,
        sellingPrice: 22000,
        saleDate: new Date("2025-02-20"),
        status: "Completed",
        discountApplied: 0,
        invoiceNumber: "INV-2025-003",
        paymentStatus: "Paid",
        createdBy: userEmail,
      },
      {
        customerID: createdCustomers[3]._id,
        productID: createdProducts[3]._id,
        quantity: 3,
        sellingPrice: 35000,
        saleDate: new Date("2025-03-01"),
        status: "Completed",
        discountApplied: 3000,
        invoiceNumber: "INV-2025-004",
        paymentStatus: "Paid",
        createdBy: userEmail,
      },
    ]

    const createdSales = []
    for (const sale of sales) {
      const existingSale = await Sale.findOne({
        invoiceNumber: sale.invoiceNumber,
        createdBy: userEmail,
      })

      if (!existingSale) {
        const newSale = await Sale.create(sale)
        createdSales.push(newSale)
        console.log(`Sale created: ${sale.invoiceNumber}`)
      } else {
        createdSales.push(existingSale)
        console.log(`Sale already exists: ${sale.invoiceNumber}`)
      }
    }

    // Create invoices
    console.log("Creating invoices...")
    const invoices = [
      {
        saleID: createdSales[0]._id,
        totalAmount: 5 * 95000 - 2000, // quantity * price - discount
        invoiceDate: new Date("2025-02-10"),
        paymentMethod: "Bank Transfer",
        invoiceNumber: "INV-2025-001",
        customerID: createdCustomers[0]._id,
        status: "Paid",
        dueDate: new Date("2025-03-10"),
        createdBy: userEmail,
      },
      {
        saleID: createdSales[1]._id,
        totalAmount: 10 * 12000 - 1000,
        invoiceDate: new Date("2025-02-15"),
        paymentMethod: "Credit Card",
        invoiceNumber: "INV-2025-002",
        customerID: createdCustomers[1]._id,
        status: "Paid",
        dueDate: new Date("2025-03-15"),
        createdBy: userEmail,
      },
      {
        saleID: createdSales[2]._id,
        totalAmount: 2 * 22000,
        invoiceDate: new Date("2025-02-20"),
        paymentMethod: "Bank Transfer",
        invoiceNumber: "INV-2025-003",
        customerID: createdCustomers[2]._id,
        status: "Paid",
        dueDate: new Date("2025-03-20"),
        createdBy: userEmail,
      },
      {
        saleID: createdSales[3]._id,
        totalAmount: 3 * 35000 - 3000,
        invoiceDate: new Date("2025-03-01"),
        paymentMethod: "UPI",
        invoiceNumber: "INV-2025-004",
        customerID: createdCustomers[3]._id,
        status: "Paid",
        dueDate: new Date("2025-04-01"),
        createdBy: userEmail,
      },
    ]

    for (const invoice of invoices) {
      const existingInvoice = await Invoice.findOne({
        invoiceNumber: invoice.invoiceNumber,
        createdBy: userEmail,
      })

      if (!existingInvoice) {
        await Invoice.create(invoice)
        console.log(`Invoice created: ${invoice.invoiceNumber}`)
      } else {
        console.log(`Invoice already exists: ${invoice.invoiceNumber}`)
      }
    }

    // Create customer refunds
    console.log("Creating customer refunds...")
    const customerRefunds = [
      {
        customerID: createdCustomers[0]._id,
        productID: createdProducts[0]._id,
        quantity: 1,
        refundAmount: 95000 - 2000, // price - discount
        reason: "Defective product",
        refundDate: new Date("2025-02-20"),
        status: "Completed",
        notes: "Customer reported laptop screen issues",
        createdBy: userEmail,
      },
      {
        customerID: createdCustomers[1]._id,
        productID: createdProducts[1]._id,
        quantity: 2,
        refundAmount: 2 * (12000 - 100), // 2 * (price - discount per unit)
        reason: "Wrong product delivered",
        refundDate: new Date("2025-02-25"),
        status: "Completed",
        notes: "Customer received wrong chair model",
        createdBy: userEmail,
      },
    ]

    for (const refund of customerRefunds) {
      const existingRefund = await RefundCustomer.findOne({
        customerID: refund.customerID,
        productID: refund.productID,
        refundDate: refund.refundDate,
        createdBy: userEmail,
      })

      if (!existingRefund) {
        await RefundCustomer.create(refund)
        console.log(`Customer refund created for customer ID: ${refund.customerID}`)
      } else {
        console.log(`Customer refund already exists for customer ID: ${refund.customerID}`)
      }
    }

    // Create supplier refunds
    console.log("Creating supplier refunds...")
    const supplierRefunds = [
      {
        supplierID: createdSuppliers[0]._id,
        productID: createdProducts[0]._id,
        quantity: 2,
        refundAmount: 2 * 85000,
        reason: "Damaged during shipping",
        refundDate: new Date("2025-01-25"),
        status: "Completed",
        notes: "Laptops arrived with cracked screens",
        createdBy: userEmail,
      },
      {
        supplierID: createdSuppliers[2]._id,
        productID: createdProducts[4]._id,
        quantity: 3,
        refundAmount: 3 * 45000,
        reason: "Incorrect specifications",
        refundDate: new Date("2025-02-20"),
        status: "Completed",
        notes: "Smartphones had wrong storage capacity",
        createdBy: userEmail,
      },
    ]

    for (const refund of supplierRefunds) {
      const existingRefund = await RefundSupplier.findOne({
        supplierID: refund.supplierID,
        productID: refund.productID,
        refundDate: refund.refundDate,
        createdBy: userEmail,
      })

      if (!existingRefund) {
        await RefundSupplier.create(refund)
        console.log(`Supplier refund created for supplier ID: ${refund.supplierID}`)
      } else {
        console.log(`Supplier refund already exists for supplier ID: ${refund.supplierID}`)
      }
    }

    // Create stock alerts
    console.log("Creating stock alerts...")
    const stockAlerts = [
      {
        productID: createdProducts[0]._id,
        alertThreshold: 5,
        notifyOnLow: true,
        createdBy: userEmail,
      },
      {
        productID: createdProducts[1]._id,
        alertThreshold: 3,
        notifyOnLow: true,
        createdBy: userEmail,
      },
      {
        productID: createdProducts[2]._id,
        alertThreshold: 2,
        notifyOnLow: true,
        createdBy: userEmail,
      },
      {
        productID: createdProducts[3]._id,
        alertThreshold: 2,
        notifyOnLow: true,
        createdBy: userEmail,
      },
      {
        productID: createdProducts[4]._id,
        alertThreshold: 5,
        notifyOnLow: true,
        createdBy: userEmail,
      },
    ]

    for (const alert of stockAlerts) {
      const existingAlert = await StockAlert.findOne({
        productID: alert.productID,
        createdBy: userEmail,
      })

      if (!existingAlert) {
        await StockAlert.create(alert)
        console.log(`Stock alert created for product ID: ${alert.productID}`)
      } else {
        console.log(`Stock alert already exists for product ID: ${alert.productID}`)
      }
    }

    console.log("Database seeding completed successfully!")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    // Close the database connection
    await mongoose.disconnect()
    console.log("Database connection closed")
  }
}

// Add these objects to the existing seed data
// Don't replace the entire file - just add these sections

export const companySeedData = [
  {
    name: "Your Amazing Store",
    address: "123 Business Street\nTech City, State - 560001",
    gstin: "29AADCB2230M1ZP",
    email: "contact@youramazingstore.com",
    phone: "9876543210",
    website: "www.youramazingstore.com",
  },
]

export const bankSeedData = [
  {
    accountHolderName: "Your Amazing Store",
    bankName: "State Bank of India",
    accountNumber: "1234567890123456",
    ifscCode: "SBIN0000123",
    branch: "Tech City Branch",
  },
]

// Run the seed function
seedDatabase()

