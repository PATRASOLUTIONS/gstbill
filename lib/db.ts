import { MongoClient, type Db } from "mongodb"

// Connection URL
const url = process.env.MONGODB_URI || "mongodb://localhost:27017"
const dbName = "inventorymanagement"

// Create a global variable to cache the database connection
let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase() {
  // If the connection is already established, return the cached connection
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  // Connect to the MongoDB server
  const client = await MongoClient.connect(url)
  const db = client.db(dbName)

  // Cache the connection
  cachedClient = client
  cachedDb = db

  return { client, db }
}

// Export collections as functions to ensure connection is established
export const collections = {
  users: async () => {
    const { db } = await connectToDatabase()
    return db.collection("users")
  },
  products: async () => {
    const { db } = await connectToDatabase()
    return db.collection("products")
  },
  customers: async () => {
    const { db } = await connectToDatabase()
    return db.collection("customers")
  },
  sales: async () => {
    const { db } = await connectToDatabase()
    return db.collection("sales")
  },
  invoices: async () => {
    const { db } = await connectToDatabase()
    return db.collection("invoices")
  },
  refunds: async () => {
    const { db } = await connectToDatabase()
    return db.collection("refunds")
  },
}

// Helper function to generate ObjectId
export const generateId = () => {
  const timestamp = ((new Date().getTime() / 1000) | 0).toString(16)
  return (
    timestamp +
    "xxxxxxxxxxxxxxxx"
      .replace(/[x]/g, () => {
        return ((Math.random() * 16) | 0).toString(16)
      })
      .toLowerCase()
  )
}

// Export the database connection
export const db = { connect: connectToDatabase, collections, generateId }

