import { MongoClient } from "mongodb"
import mongoose from "mongoose"

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables")
}

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/ims"
const options = {}

let client
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect().catch((err) => {
      console.error("Failed to connect to MongoDB:", err)
      throw err
    })
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect().catch((err) => {
    console.error("Failed to connect to MongoDB:", err)
    throw err
  })
}

export async function connectToDatabase() {
  const client = await clientPromise
  const db = client.db()
  return { client, db }
}

// Add the dbConnect function for Mongoose connections
export async function dbConnect() {
  if (mongoose.connection.readyState >= 1) {
    return
  }

  return mongoose.connect(uri, {
    // Add mongoose connection options if needed
  })
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

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

