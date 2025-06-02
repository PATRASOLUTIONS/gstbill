import type mongoose from "mongoose"
import { Schema, models, model } from "mongoose"

export interface IPurchase {
  supplierID: mongoose.Types.ObjectId
  productID: mongoose.Types.ObjectId
  quantity: number
  purchasePrice: number
  purchaseDate: Date
  status: string
  invoiceNumber: string
  paymentStatus: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  attachments?: {
    fileName: string
    fileUrl: string
    fileType: string
    uploadedAt: Date
  }[]
}

const purchaseSchema = new Schema<IPurchase>(
  {
    supplierID: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier ID is required"],
    },
    productID: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    purchasePrice: {
      type: Number,
      required: [true, "Purchase price is required"],
      min: [0, "Purchase price cannot be negative"],
    },
    purchaseDate: {
      type: Date,
      required: [true, "Purchase date is required"],
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
    },
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Overdue", "Cancelled"],
      default: "Pending",
    },
    createdBy: {
      type: String,
      required: [true, "Creator email is required"],
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

const Purchase = models.Purchase || model<IPurchase>("Purchase", purchaseSchema)

export default Purchase
