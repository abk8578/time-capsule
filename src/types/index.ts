import type { DefaultSession } from "next-auth";
import type { Types } from "mongoose";

export interface IUserSettings {
  theme: "dark" | "light";
}

/**
 * User interface representing a registered account in MongoDB.
 */
export interface IUser {
  _id: string | Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  role?: "user" | "admin";
  isSuspended?: boolean;
  settings?: IUserSettings;
  lastSeenNewslettersAt?: Date | null;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
}

export interface INewsletter {
  _id: string | Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  publishedAt?: Date | null;
  createdBy: string | Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminLog {
  _id: string | Types.ObjectId;
  action: string;
  adminEmail: string;
  details?: Record<string, unknown> | string | null;
  ip: string;
  userAgent: string;
  createdAt: Date;
}

export interface AdminStatsDTO {
  totalUsers: number;
  newUsersLast7Days: number;
  totalCapsules: number;
  lockedCapsules: number;
  unlockedCapsules: number;
  openingNext7Days: number;
  signupsLast30Days: { date: string; count: number }[];
}

export interface AdminUserDTO {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isSuspended: boolean;
  capsuleCount: number;
  lockedCount: number;
  unlockedCount: number;
}

export interface AdminCapsuleDTO {
  id: string;
  title: string;
  content?: string;
  unlockAt: string;
  createdAt: string;
  isUnlocked: boolean;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  recipientEmail?: string | null;
  recipientName?: string | null;
  imageCount: number;
  hasAudio: boolean;
  openedEarlyAt?: string | null;
}

export interface ICapsuleImage {
  key: string;      // Private storage path: capsules/<userId>/<uuid>.<ext>
  mimeType: string; // image/jpeg, image/png, image/webp
  size: number;
}

export interface ICapsuleMedia {
  key: string;      // Private storage path: capsules/<userId>/media/<uuid>.<ext>
  mimeType: string; // audio/*, video/*
  size: number;
  mediaType: "audio" | "video";
  duration?: number;
}

/**
 * Capsule interface representing a time-locked message in MongoDB.
 * Note: `content`, `images`, and `media` are optional because queries for sealed
 * capsules explicitly whitelist only safe fields at the database layer.
 */
export interface ICapsule {
  _id: string | Types.ObjectId;
  userId: string | Types.ObjectId;
  title: string;
  content?: string;
  isEncrypted?: boolean;
  iv?: string;
  authTag?: string;
  images?: ICapsuleImage[];
  media?: ICapsuleMedia | null;
  recipientEmail?: string | null;
  recipientName?: string | null;
  recipientTokenHash?: string;
  recipientTokenExpiresAt?: Date | null;
  recipientNotified?: boolean;
  reminderSent?: boolean;
  shareToken?: string;
  shareIncludeTitle?: boolean;
  unlockAt: Date; // Persisted in UTC
  notified: boolean;
  openedEarlyAt?: Date;
  snapshot?: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * Client-facing representation for a sealed capsule (never contains message content or images).
 */
export interface SealedCapsuleDTO {
  id: string;
  title: string;
  unlockAt: string; // ISO 8601 UTC string
  createdAt: string;
  recipientEmail?: string | null;
  isUnlocked: false;
}

/**
 * Client-facing representation for an unlocked capsule (contains full message content and ephemeral signed media URLs).
 */
export interface OpenedCapsuleDTO {
  id: string;
  title: string;
  content?: string;
  images?: { url: string; mimeType: string }[];
  media?: { url: string; mimeType: string; mediaType: "audio" | "video"; duration?: number };
  recipientEmail?: string;
  shareToken?: string;
  unlockAt: string; // ISO 8601 UTC string
  createdAt: string;
  isUnlocked: true;
}

export type CapsuleDTO = SealedCapsuleDTO | OpenedCapsuleDTO;

/**
 * NextAuth module augmentations to include `user.id` in Session and JWT.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      settings?: IUserSettings;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: string;
    settings?: IUserSettings;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    settings?: IUserSettings;
  }
}
