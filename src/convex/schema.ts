import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Better Auth Tables (Manually defined to avoid import issues)
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    emailVerified: v.boolean(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    expiresAt: v.number(),
    token: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  accounts: defineTable({
    userId: v.id("users"),
    accountId: v.string(),
    providerId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    password: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_account_provider", ["providerId", "accountId"]),

  verificationTokens: defineTable({
    identifier: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_token", ["token"]),

  // App Tables
  workspaces: defineTable({
    name: v.string(),
    isPublic: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  drawings: defineTable({
    workspaceId: v.id("workspaces"),
    elements: v.any(),
    appState: v.any(),
    files: v.optional(v.any()),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),
});
