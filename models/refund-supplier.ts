import type mongoose from "mongoose"
import { Schema, models, model } from "mongoose"

export interface IRefundSupplier {
  supplierID: mongoose.Types.ObjectId
  productID: mongoose.Types.ObjectId
  quantity: number
  refundAmount: number
  refundDate: Date
  reason: string
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const refundSupplierSchema = new Schema<IRefundSupplier>(
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
    refundAmount: {
      type: Number,
      required: [true, "Refund amount is required"],
      min: [0, "Refund amount cannot be negative"],
    },
    refundDate: {
      type: Date,
      required: [true, "Refund date is required"],
      default: Date.now,
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
    },
    notes: {
      type: String,
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

const RefundSupplier = models.RefundSupplier || model<IRefundSupplier>("RefundSupplier", refundSupplierSchema)

export default RefundSupplier

