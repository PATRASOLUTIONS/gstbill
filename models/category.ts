import { Schema, models, model } from "mongoose"

export interface ICategory {
  name: string
  description?: string
  type: "supplier" | "product" | "customer"
  userId: Schema.Types.ObjectId
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ["supplier", "product", "customer"],
      required: [true, "Type is required"],
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

const Category = models.Category || model<ICategory>("Category", categorySchema)

export default Category
