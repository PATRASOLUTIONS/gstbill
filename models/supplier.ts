import { Schema, models, model } from "mongoose"

export interface ISupplier {
  name: string
  contactPerson: string
  email: string
  phone: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gstin?: string
  category?: string
  status: "Active" | "Inactive" | "On Hold"
  paymentTerms?: string
  creditLimit?: number
  outstandingBalance?: number
  lastOrderDate?: Date
  userId: Schema.Types.ObjectId
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const supplierSchema = new Schema<ISupplier>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    contactPerson: {
      type: String,
      required: [true, "Contact person is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    pincode: {
      type: String,
    },
    gstin: {
      type: String,
    },
    category: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "On Hold"],
      default: "Active",
    },
    paymentTerms: {
      type: String,
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
    },
    lastOrderDate: {
      type: Date,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, "User ID is required"],
      ref: "User",
    },
    createdBy: {
      type: String,
      required: [true, "Creator name is required"],
    },
  },
  {
    timestamps: true,
  },
)

const Supplier = models.Supplier || model<ISupplier>("Supplier", supplierSchema)

export default Supplier

