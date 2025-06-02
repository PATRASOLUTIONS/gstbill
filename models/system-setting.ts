import mongoose, { Schema } from "mongoose"

export interface ISystemSetting {
  key: string
  value: any
  createdAt: Date
  updatedAt: Date
}

const systemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      required: [true, "Key is required"],
      unique: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: [true, "Value is required"],
    },
  },
  {
    timestamps: true,
  },
)

// Check if the model already exists to prevent overwriting
const SystemSetting =
  mongoose.models.SystemSetting || mongoose.model<ISystemSetting>("SystemSetting", systemSettingSchema)

export default SystemSetting

