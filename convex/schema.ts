import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
    })),
  }).index("by_user", ["userId"]),

  documents: defineTable({
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    title: v.string(),
    content: v.string(),
    lastModified: v.number(),
  }).index("by_user", ["userId"])
    .index("by_conversation", ["conversationId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
