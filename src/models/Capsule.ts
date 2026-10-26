import mongoose, { Schema, Model } from "mongoose";
import type { ICapsule } from "@/types";

/**
 * Capsule Mongoose Schema
 * Represents a time-locked message written to the user's future self.
 *
 * Security Note:
 * When querying capsules before `unlockAt <= now`, the server MUST apply `.select("-content")`
 * so locked messages never travel from the database layer to the server or client.
 */
const CapsuleSchema = new Schema<ICapsule>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Capsule owner userId is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    iv: {
      type: String,
      default: null,
    },
    authTag: {
      type: String,
      default: null,
    },
    images: {
      type: [
        {
          key: { type: String, required: true },
          mimeType: { type: String, required: true },
          size: { type: Number, required: true },
        },
      ],
      default: [],
    },
    media: {
      type: {
        key: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        mediaType: { type: String, enum: ["audio", "video"], required: true },
        duration: { type: Number, default: null },
      },
      default: null,
    },
    recipientEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    recipientName: {
      type: String,
      default: null,
      trim: true,
      maxlength: [100, "Recipient name cannot exceed 100 characters"],
    },
    recipientTokenHash: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },
    recipientTokenExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    recipientNotified: {
      type: Boolean,
      default: false,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    shareToken: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },
    shareIncludeTitle: {
      type: Boolean,
      default: false,
    },
    unlockAt: {
      type: Date,
      required: [true, "Unlock date is required"],
    },
    notified: {
      type: Boolean,
      default: false,
    },
    openedEarlyAt: {
      type: Date,
      default: null,
    },
    snapshot: {
      type: Schema.Types.Mixed,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound index for the cron job query: finds unnotified capsules where unlockAt <= now
CapsuleSchema.index({ unlockAt: 1, notified: 1 });
CapsuleSchema.index({ unlockAt: 1, recipientNotified: 1 });
CapsuleSchema.index({ unlockAt: 1, reminderSent: 1 });

// Index for dashboard query: fetch user's capsules ordered by creation or unlock date
CapsuleSchema.index({ userId: 1, createdAt: -1 });

// Prevent model re-compilation error during Next.js hot-reloads
const Capsule: Model<ICapsule> =
  (mongoose.models.Capsule as Model<ICapsule>) ||
  mongoose.model<ICapsule>("Capsule", CapsuleSchema);

export default Capsule;
