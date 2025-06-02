import mongoose, { Schema, type Document } from "mongoose"

export interface BankDocument extends Document {
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  branch?: string
  createdAt: Date
  updatedAt: Date
}

const BankSchema = new Schema(
  {
    accountHolderName: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Bank || mongoose.model<BankDocument>("Bank", BankSchema)

