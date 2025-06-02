import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password: string
  role: "admin" | "user" | "manager"
  sidebarPermissions?: {
    dashboard?: boolean
    products?: boolean
    categories?: boolean
    customers?: boolean
    sales?: boolean
    purchases?: boolean
    suppliers?: boolean
    invoices?: boolean
    refunds?: boolean
    reports?: boolean
    admin?: boolean
  }
  createdAt: Date
  updatedAt: Date
}

