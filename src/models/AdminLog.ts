import mongoose, { Schema, Model } from "mongoose";
import type { IAdminLog } from "@/types";

/**
 * AdminLog Mongoose Schema
 * Audit trail recording every administrative action for accountability and security.
 */
const AdminLogSchema = new Schema<IAdminLog>(
  {
    action: {
      type: String,
      required: [true, "Action type is required"],
      index: true,
    },
    adminEmail: {
      type: String,
      required: [true, "Admin email is required"],
      lowercase: true,
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: "127.0.0.1",
    },
    userAgent: {
      type: String,
      default: "Unknown",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// High-performance index for latest-first audit queries
AdminLogSchema.index({ createdAt: -1 });

const AdminLog: Model<IAdminLog> =
  (mongoose.models.AdminLog as Model<IAdminLog>) ||
  mongoose.model<IAdminLog>("AdminLog", AdminLogSchema);

export default AdminLog;
