import mongoose, { Schema } from "mongoose"
import { connectToDatabase } from "@/lib/mongodb"

interface LogParams {
  action: string
  details: string
  userId?: string
  ipAddress?: string
  metadata?: Record<string, any>
}

export class ActivityLogger {
  static async log(params: LogParams): Promise<void> {
    try {
      await connectToDatabase()

      const activityLogSchema = new Schema({
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
      const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema)

      await ActivityLog.create({
        action: params.action,
        details: params.details,
        userId: params.userId || null,
        ipAddress: params.ipAddress || "unknown",
        metadata: params.metadata || {},
        timestamp: new Date(),
      })
    } catch (error) {
      console.error("Failed to log activity:", error)
      // Don't throw the error to prevent disrupting the main flow
    }
  }
}

export const logActivity = ActivityLogger.log
