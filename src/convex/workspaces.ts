import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Fetch all workspaces (Single User Mode)
    const workspaces = await ctx.db
      .query("workspaces")
      .order("desc")
      .collect();

    return workspaces;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic: false,
    });

    // Create an empty drawing for this workspace
    await ctx.db.insert("drawings", {
      workspaceId,
      elements: [],
      appState: { theme: "dark" },
      updatedAt: Date.now(),
    });

    return workspaceId;
  },
});

export const deleteWorkspace = mutation({
  args: {
    id: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    // Delete the workspace
    await ctx.db.delete(args.id);

    // Delete associated drawings
    const drawings = await ctx.db
      .query("drawings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.id))
      .collect();

    for (const drawing of drawings) {
      await ctx.db.delete(drawing._id);
    }
  },
});

export const rename = mutation({
  args: {
    id: v.id("workspaces"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: Date.now(),
    });
  },
});
