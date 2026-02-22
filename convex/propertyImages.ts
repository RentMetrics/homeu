import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate an upload URL for the client
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return { url: await ctx.storage.generateUploadUrl() };
  },
});

// Save image metadata after file upload
export const saveImage = mutation({
  args: {
    propertyId: v.string(),
    storageId: v.id("_storage"),
    fileName: v.string(),
    description: v.optional(v.string()),
    isPrimary: v.boolean(),
  },
  handler: async (ctx, args) => {
    // If this is set as primary, unset any existing primary images for this property
    if (args.isPrimary) {
      const existing = await ctx.db
        .query("propertyImages")
        .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
        .collect();
      for (const img of existing) {
        if (img.isPrimary) {
          await ctx.db.patch(img._id, { isPrimary: false });
        }
      }
    }

    const id = await ctx.db.insert("propertyImages", {
      propertyId: args.propertyId,
      storageId: args.storageId,
      fileName: args.fileName,
      description: args.description,
      isPrimary: args.isPrimary,
      uploadedAt: Date.now(),
    });
    return id;
  },
});

// Get all images for a property
export const getImagesByProperty = query({
  args: { propertyId: v.string() },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("propertyImages")
      .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    // Attach serving URLs
    const withUrls = await Promise.all(
      images.map(async (img) => {
        const url = await ctx.storage.getUrl(img.storageId);
        return { ...img, url };
      })
    );

    return withUrls;
  },
});

// Get serving URL for a single image
export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Set an image as the primary image for its property
export const setPrimaryImage = mutation({
  args: { imageId: v.id("propertyImages") },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image not found");

    // Unset existing primary images for this property
    const existing = await ctx.db
      .query("propertyImages")
      .withIndex("by_propertyId", (q) => q.eq("propertyId", image.propertyId))
      .collect();
    for (const img of existing) {
      if (img.isPrimary) {
        await ctx.db.patch(img._id, { isPrimary: false });
      }
    }

    // Set this image as primary
    await ctx.db.patch(args.imageId, { isPrimary: true });
    return { success: true };
  },
});

// Delete an image
export const deleteImage = mutation({
  args: { imageId: v.id("propertyImages") },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image not found");

    // Delete from storage
    await ctx.storage.delete(image.storageId);

    // Delete metadata
    await ctx.db.delete(args.imageId);
    return { success: true };
  },
});
