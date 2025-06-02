import mongoose, { Schema, type Document } from "mongoose"

export interface InvoiceItem {
  productId: string
  productName: string
  quantity: number
  price: number
  tax: number
  total: number
}

export interface InvoiceDocument extends Document {
  number: string
  date: string
  dueDate: string
  customerId: string
  customerName: string
  items: InvoiceItem[]
  subtotal: number
  taxTotal: number
  total: number
  status: "paid" | "pending" | "overdue" | "cancelled" | "draft"
  paymentMethod: string
  notes: string
  isGst: boolean
  convertedToSale: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
  discountType: string
  discountAmount: number
  discountValue: number
}

const InvoiceItemSchema = new Schema({
  productId: {
    type: String,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  tax: {
    type: Number,
    required: true,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
})

const InvoiceSchema = new Schema(
  {
    number: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: String,
      required: true,
    },
    dueDate: {
      type: String,
      required: true,
    },
    customerId: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    items: [InvoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    taxTotal: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "pending", "overdue", "cancelled", "draft"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    isGst: {
      type: Boolean,
      default: true,
    },
    convertedToSale: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
      required: true,
    },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed",
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    discountValue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Invoice || mongoose.model<InvoiceDocument>("Invoice", InvoiceSchema)
