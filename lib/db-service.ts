import clientPromise from "./mongodb"
import { ObjectId } from "mongodb"

export class DatabaseService {
  private dbName = "ims" // Inventory Management System database

  async getCollection(collectionName: string) {
    try {
      const client = await clientPromise
      const db = client.db(this.dbName)
      return db.collection(collectionName)
    } catch (error) {
      console.error(`Error getting collection ${collectionName}:`, error)
      throw error
    }
  }

  async findOne(collectionName: string, query: any) {
    try {
      const collection = await this.getCollection(collectionName)
      return await collection.findOne(query)
    } catch (error) {
      console.error(`Error finding document in ${collectionName}:`, error)
      return null
    }
  }

  async find(collectionName: string, query: any, options: any = {}) {
    try {
      const collection = await this.getCollection(collectionName)
      return await collection.find(query, options).toArray()
    } catch (error) {
      console.error(`Error finding documents in ${collectionName}:`, error)
      return []
    }
  }

  async insertOne(collectionName: string, document: any) {
    try {
      const collection = await this.getCollection(collectionName)
      const now = new Date()
      const documentWithTimestamps = {
        ...document,
        createdAt: document.createdAt || now,
        updatedAt: document.updatedAt || now,
      }
      return await collection.insertOne(documentWithTimestamps)
    } catch (error) {
      console.error(`Error inserting document into ${collectionName}:`, error)
      throw error
    }
  }

  async insertMany(collectionName: string, documents: any[]) {
    try {
      const collection = await this.getCollection(collectionName)
      const now = new Date()
      const documentsWithTimestamps = documents.map((doc) => ({
        ...doc,
        createdAt: doc.createdAt || now,
        updatedAt: doc.updatedAt || now,
      }))
      return await collection.insertMany(documentsWithTimestamps)
    } catch (error) {
      console.error(`Error inserting documents into ${collectionName}:`, error)
      throw error
    }
  }

  async updateOne(collectionName: string, query: any, update: any) {
    try {
      const collection = await this.getCollection(collectionName)
      const now = new Date()

      // Ensure $set exists in the update
      if (!update.$set) {
        update.$set = {}
      }

      update.$set.updatedAt = now

      return await collection.updateOne(query, update)
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error)
      throw error
    }
  }

  async deleteOne(collectionName: string, query: any) {
    try {
      const collection = await this.getCollection(collectionName)
      return await collection.deleteOne(query)
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error)
      throw error
    }
  }

  async countDocuments(collectionName: string, query: any = {}) {
    try {
      const collection = await this.getCollection(collectionName)
      return await collection.countDocuments(query)
    } catch (error) {
      console.error(`Error counting documents in ${collectionName}:`, error)
      return 0
    }
  }

  // Helper to convert string ID to ObjectId
  toObjectId(id: string) {
    try {
      return new ObjectId(id)
    } catch (error) {
      console.error("Invalid ObjectId:", id, error)
      throw new Error(`Invalid ObjectId: ${id}`)
    }
  }
}

export const dbService = new DatabaseService()
