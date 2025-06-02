import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Customer } from "@/types"

interface GetCustomersOptions {
  page?: number
  pageSize?: number
  query?: string
}

export async function getCustomers({ page = 1, pageSize = 10, query = "" }: GetCustomersOptions = {}) {
  try {
    const { db } = await connectToDatabase()

    // Create filter based on search query
    const filter = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
            { phone: { $regex: query, $options: "i" } },
          ],
        }
      : {}

    // Get total count for pagination
    const totalCustomers = await db.collection("customers").countDocuments(filter)

    // Fetch customers with pagination
    const customers = await db
      .collection("customers")
      .find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray()

    // Transform MongoDB _id to string id
    const transformedCustomers = customers.map((customer) => ({
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    }))

    return {
      customers: transformedCustomers,
      totalCustomers,
    }
  } catch (error) {
    console.error("Failed to fetch customers:", error)
    return { customers: [], totalCustomers: 0 }
  }
}

export async function getCustomerById(id: string) {
  try {
    const { db } = await connectToDatabase()

    const customer = await db.collection("customers").findOne({ _id: new ObjectId(id) })

    if (!customer) return null

    return {
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    }
  } catch (error) {
    console.error("Failed to fetch customer:", error)
    return null
  }
}

export async function createCustomer(customerData: Omit<Customer, "id">) {
  try {
    const { db } = await connectToDatabase()

    const result = await db.collection("customers").insertOne(customerData)

    return {
      id: result.insertedId.toString(),
      ...customerData,
    }
  } catch (error) {
    console.error("Failed to create customer:", error)
    throw new Error("Failed to create customer")
  }
}

export async function updateCustomer(id: string, customerData: Partial<Customer>) {
  try {
    const { db } = await connectToDatabase()

    await db.collection("customers").updateOne({ _id: new ObjectId(id) }, { $set: customerData })

    return {
      id,
      ...customerData,
    }
  } catch (error) {
    console.error("Failed to update customer:", error)
    throw new Error("Failed to update customer")
  }
}

export async function deleteCustomer(id: string) {
  try {
    const { db } = await connectToDatabase()

    await db.collection("customers").deleteOne({ _id: new ObjectId(id) })

    return true
  } catch (error) {
    console.error("Failed to delete customer:", error)
    throw new Error("Failed to delete customer")
  }
}

