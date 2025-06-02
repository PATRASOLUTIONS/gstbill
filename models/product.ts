import type mongoose from "mongoose"
import { Schema, models, model } from "mongoose"

export interface IProduct {
  name: string
  sku: string
  category: string
  quantity: number
  cost: number
  sellingPrice: number
  supplierID: mongoose.Types.ObjectId
  expiryDate?: Date
  barcode?: string
  description?: string
  tax: number
  reorderLevel: number
  hsn?: string
  location?: string
  lastModified?: Date
  lastModifiedFrom?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    cost: {
      type: Number,
      required: [true, "Cost is required"],
      min: [0, "Cost cannot be negative"],
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"],
    },
    supplierID: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier ID is required"],
    },
    expiryDate: {
      type: Date,
    },
    barcode: {
      type: String,
    },
    description: {
      type: String,
    },
    tax: {
      type: Number,
      required: [true, "Tax rate is required"],
      // Removed default: 18
    },
    reorderLevel: {
      type: Number,
      default: 10,
    },
    hsn: {
      type: String,
    },
    location: {
      type: String,
    },
    lastModified: {
      type: Date,
    },
    lastModifiedFrom: {
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

const Product = models.Product || model<IProduct>("Product", productSchema)

export default Product
