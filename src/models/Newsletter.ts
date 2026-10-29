import mongoose, { Schema, Model } from "mongoose";
import type { INewsletter } from "@/types";
import { slugifyTitle } from "@/lib/utils";

export { slugifyTitle };

const NewsletterSchema = new Schema<INewsletter>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author (createdBy) is required"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// High-performance indexes for published queries and admin lists
NewsletterSchema.index({ status: 1, publishedAt: -1 });
NewsletterSchema.index({ createdAt: -1 });

const Newsletter: Model<INewsletter> =
  (mongoose.models.Newsletter as Model<INewsletter>) ||
  mongoose.model<INewsletter>("Newsletter", NewsletterSchema);

export default Newsletter;
