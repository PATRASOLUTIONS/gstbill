import mongoose, { Schema } from "mongoose"

export interface IActivityLog {
  action: string
  details: string
  userId?: string
  ipAddress: string
  metadata?: Record<string, any>
  timestamp: Date
}

const activityLogSchema = new Schema<IActivityLog>({
  action: {
    type: String,
    required: true,
    index: true,
  },
  details: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    index: true,
  },
  ipAddress: {
    type: String,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
})

// Check if the model already exists to prevent overwriting
const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", activityLogSchema)

export default ActivityLog

