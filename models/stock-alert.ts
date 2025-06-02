import type mongoose from "mongoose"
import { Schema, models, model } from "mongoose"

export interface IStockAlert {
  productID: mongoose.Types.ObjectId
  alertThreshold: number
  notifyOnLow: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const stockAlertSchema = new Schema<IStockAlert>(
  {
    productID: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    alertThreshold: {
      type: Number,
      required: [true, "Alert threshold is required"],
      min: [0, "Alert threshold cannot be negative"],
    },
    notifyOnLow: {
      type: Boolean,
      default: true,
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

const StockAlert = models.StockAlert || model<IStockAlert>("StockAlert", stockAlertSchema)

export default StockAlert

