import { MongoClient, type Db, ObjectId } from "mongodb"
import { getCurrentUserId } from "./auth-utils"

let client: MongoClient
let db: Db

export class DatabaseService {
  /**
   * Connect to MongoDB
   */
  async connect(): Promise<{ db: Db; client: MongoClient }> {
    if (db) return { db, client }

    if (!process.env.MONGODB_URI) {
      throw new Error("Please define the MONGODB_URI environment variable")
    }

    if (!client) {
      client = new MongoClient(process.env.MONGODB_URI)
      await client.connect()
    }

    db = client.db()
    return { db, client }
  }

  /**
   * Convert string to ObjectId
   */
  toObjectId(id: string): ObjectId {
    return new ObjectId(id)
  }

  /**
   * Generate a sequential number for a specific collection and user
   * @param collectionName The collection to generate a number for
   * @param prefix Optional prefix for the number (e.g., "CUST-")
   * @returns The next sequential number for this user and collection
   */
  async generateSequentialNumber(collectionName: string, prefix = ""): Promise<string> {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error("User not authenticated")

    const { db } = await this.connect()

    // Get the counters collection or create it if it doesn't exist
    const countersCollection = db.collection("counters")

    // Create a unique key for this user and collection
    const counterKey = `${userId}_${collectionName}`

    // Increment the counter and get the new value
    const result = await countersCollection.findOneAndUpdate(
      { _id: counterKey },
      { $inc: { sequence_value: 1 } },
      { upsert: true, returnDocument: "after" },
    )

    const sequenceNumber = result.sequence_value || 1

    // Format the number with leading zeros (e.g., "0001")
    const formattedNumber = sequenceNumber.toString().padStart(4, "0")

    return `${prefix}${formattedNumber}`
  }

  /**
   * Create a document with user association
   */
  async create<T>(collectionName: string, data: T): Promise<any> {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error("User not authenticated")

    const { db } = await this.connect()

    // Generate a sequential number for this collection if needed
    let sequentialNumber = null
    switch (collectionName) {
      case "customers":
        sequentialNumber = await this.generateSequentialNumber(collectionName, "CUST-")
        break
      case "suppliers":
        sequentialNumber = await this.generateSequentialNumber(collectionName, "SUPP-")
        break
      case "products":
        sequentialNumber = await this.generateSequentialNumber(collectionName, "PROD-")
        break
      case "invoices":
        sequentialNumber = await this.generateSequentialNumber(collectionName, "INV-")
        break
      case "purchases":
        sequentialNumber = await this.generateSequentialNumber(collectionName, "PO-")
        break
      case "sales":
        sequentialNumber = await this.generateSequentialNumber(collectionName, "SO-")
        break
    }

    // Add user ID, sequential number, and timestamps to the document
    const documentWithUser = {
      ...data,
      userId,
      ...(sequentialNumber && { sequentialNumber }),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection(collectionName).insertOne(documentWithUser)
    return {
      id: result.insertedId,
      ...documentWithUser,
    }
  }

  /**
   * Find documents for the current user
   */
  async find(collectionName: string, query: any = {}, options: any = {}): Promise<any[]> {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error("User not authenticated")

    const { db } = await this.connect()

    // Add user ID to the query
    const userQuery = { ...query, userId }

    return db.collection(collectionName).find(userQuery, options).toArray()
  }

  /**
   * Find a single document for the current user
   */
  async findOne(collectionName: string, query: any = {}): Promise<any> {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error("User not authenticated")

    const { db } = await this.connect()

    // Add user ID to the query
    const userQuery = { ...query, userId }

    return db.collection(collectionName).findOne(userQuery)
  }

  /**
   * Update a document for the current user
   */
  async updateOne(collectionName: string, query: any, update: any): Promise<any> {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error("User not authenticated")

    const { db } = await this.connect()

    // Add user ID to the query to ensure ownership
    const userQuery = { ...query, userId }

    // Add updated timestamp
    const updateWithTimestamp = {
      ...update,
      $set: {
        ...(update.$set || {}),
        updatedAt: new Date(),
      },
    }

    return db.collection(collectionName).updateOne(userQuery, updateWithTimestamp)
  }

  /**
   * Delete a document for the current user
   */
  async deleteOne(collectionName: string, query: any): Promise<any> {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error("User not authenticated")

    const { db } = await this.connect()

    // Add user ID to the query to ensure ownership
    const userQuery = { ...query, userId }

    return db.collection(collectionName).deleteOne(userQuery)
  }

  /**
   * Count documents for the current user
   */
  async count(collectionName: string, query: any = {}): Promise<number> {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error("User not authenticated")

    const { db } = await this.connect()

    // Add user ID to the query
    const userQuery = { ...query, userId }

    return db.collection(collectionName).countDocuments(userQuery)
  }

  /**
   * Aggregate with user filter
   */
  async aggregate(collectionName: string, pipeline: any[]): Promise<any[]> {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error("User not authenticated")

    const { db } = await this.connect()

    // Add a match stage at the beginning to filter by user ID
    const userPipeline = [{ $match: { userId } }, ...pipeline]

    return db.collection(collectionName).aggregate(userPipeline).toArray()
  }
}

// Create a singleton instance
const dbService = new DatabaseService()
export default dbService

// Helper function for connecting to the database
export async function connectToDatabase() {
  return dbService.connect()
}
