import mongoose, { Schema } from "mongoose"

export interface ICustomer {
  name: string
  contact: string
  email: string
  customerType: string
  gstin?: string
  address?: string
  permissions?: string[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    contact: {
      type: String,
      required: [true, "Contact is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
    },
    customerType: {
      type: String,
      required: [true, "Customer type is required"],
      enum: ["Individual", "Corporate", "Government", "Educational", "Other"],
    },
    gstin: {
      type: String,
    },
    address: {
      type: String,
    },
    permissions: {
      type: [String],
      default: ["dashboard", "sales", "invoices", "customers"],
    },
    createdBy: {
      type: String,
      required: [true, "Creator email is required"],
    },
  },
  {
    timestamps: true,
  },
)

// Check if the model already exists to prevent overwriting
const Customer = mongoose.models.Customer || mongoose.model<ICustomer>("Customer", customerSchema)

export default Customer

