import mongoose from "mongoose"

// List of all collections in our application
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

export async function initializeCollections() {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      console.error("Database not connected. Cannot initialize collections.")
      return
    }

    const db = mongoose.connection.db
    const existingCollections = await db.listCollections().toArray()
    const existingCollectionNames = existingCollections.map((c) => c.name)

    for (const collection of collections) {
      if (!existingCollectionNames.includes(collection)) {
        await db.createCollection(collection)
        console.log(`Created collection: ${collection}`)
      }
    }

    console.log("All collections initialized successfully")
  } catch (error) {
    console.error("Error initializing collections:", error)
  }
}
