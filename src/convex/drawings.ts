import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) return null;

    const drawing = await ctx.db
      .query("drawings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .unique();

    return drawing;
  },
});

export const save = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    elements: v.any(),
    appState: v.any(),
    files: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const drawing = await ctx.db
      .query("drawings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .unique();

    if (drawing) {
      await ctx.db.patch(drawing._id, {
        elements: args.elements,
        appState: args.appState,
        files: args.files,
        updatedAt: Date.now(),
      });
    } else {
      // Should have been created with workspace, but just in case
      await ctx.db.insert("drawings", {
        workspaceId: args.workspaceId,
        elements: args.elements,
        appState: args.appState,
        files: args.files,
        updatedAt: Date.now(),
      });
    }
    
    // Also update workspace timestamp
    await ctx.db.patch(args.workspaceId, { updatedAt: Date.now() });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
