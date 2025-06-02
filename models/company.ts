import mongoose, { Schema, type Document } from "mongoose"

export interface CompanyDocument extends Document {
  name: string
  address: string
  gstin: string
  email: string
  phone: string
  logo?: string
  website?: string
  createdAt: Date
  updatedAt: Date
}

const CompanySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    gstin: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
    },
    website: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Company || mongoose.model<CompanyDocument>("Company", CompanySchema)
