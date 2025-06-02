import mongoose, { Schema } from "mongoose"

export interface IRefundItem {
  product: mongoose.Types.ObjectId
  productName: string
  quantity: number
  price: number
  taxRate: number
  taxAmount: number
  total: number
}

export interface IRefund {
  saleId: mongoose.Types.ObjectId
  orderNumber: string
  customer: mongoose.Types.ObjectId
  refundDate: Date
  items: IRefundItem[]
  subtotal: number
  taxTotal: number
  total: number
  reason: string
  status: string
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const refundItemSchema = new Schema<IRefundItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product is required"],
  },
  productName: {
    type: String,
    required: [true, "Product name is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  taxRate: {
    type: Number,
    required: [true, "Tax rate is required"],
    default: 0,
    min: [0, "Tax rate cannot be negative"],
  },
  taxAmount: {
    type: Number,
    required: [true, "Tax amount is required"],
    default: 0,
    min: [0, "Tax amount cannot be negative"],
  },
  total: {
    type: Number,
    required: [true, "Total is required"],
    min: [0, "Total cannot be negative"],
  },
})

const refundSchema = new Schema<IRefund>(
  {
    saleId: {
      type: Schema.Types.ObjectId,
      ref: "Sale",
      required: [true, "Sale ID is required"],
    },
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    refundDate: {
      type: Date,
      required: [true, "Refund date is required"],
      default: Date.now,
    },
    items: {
      type: [refundItemSchema],
      required: [true, "At least one item is required"],
      validate: {
        validator: (items: IRefundItem[]) => items.length > 0,
        message: "At least one item is required",
      },
    },
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    taxTotal: {
      type: Number,
      required: [true, "Tax total is required"],
      default: 0,
      min: [0, "Tax total cannot be negative"],
    },
    total: {
      type: Number,
      required: [true, "Total is required"],
      min: [0, "Total cannot be negative"],
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      enum: ["Damaged", "Defective", "Wrong Item", "Customer Dissatisfaction", "Other"],
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending",
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

// Check if the model already exists to prevent overwriting
const Refund = mongoose.models.Refund || mongoose.model<IRefund>("Refund", refundSchema)

export default Refund
