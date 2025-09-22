import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Store crypto payment
export const storeCryptoPayment = mutation({
  args: {
    userId: v.string(),
    propertyId: v.string(),
    amount: v.string(),
    currency: v.string(),
    transactionHash: v.string(),
    recipientAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const paymentId = await ctx.db.insert("cryptoPayments", {
      userId: args.userId,
      propertyId: args.propertyId,
      amount: args.amount,
      currency: args.currency,
      transactionHash: args.transactionHash,
      status: "pending",
      recipientAddress: args.recipientAddress,
      createdAt: Date.now(),
    });

    return paymentId;
  },
});

// Update crypto payment status
export const updateCryptoPaymentStatus = mutation({
  args: {
    transactionHash: v.string(),
    status: v.string(),
    blockNumber: v.optional(v.number()),
    gasUsed: v.optional(v.string()),
    gasPrice: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("cryptoPayments")
      .withIndex("by_txHash", (q) => q.eq("transactionHash", args.transactionHash))
      .first();

    if (!payment) {
      throw new Error("Payment not found");
    }

    await ctx.db.patch(payment._id, {
      status: args.status,
      blockNumber: args.blockNumber,
      gasUsed: args.gasUsed,
      gasPrice: args.gasPrice,
      confirmedAt: args.status === "confirmed" ? Date.now() : undefined,
    });

    return payment._id;
  },
});

// Get user crypto payments
export const getUserCryptoPayments = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cryptoPayments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Store IPFS document
export const storeIPFSDocument = mutation({
  args: {
    userId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    documentType: v.string(),
    ipfsHash: v.string(),
    isShared: v.boolean(),
    fileSize: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const documentId = await ctx.db.insert("ipfsDocuments", {
      userId: args.userId,
      fileName: args.fileName,
      fileType: args.fileType,
      documentType: args.documentType,
      ipfsHash: args.ipfsHash,
      isShared: args.isShared,
      uploadedAt: Date.now(),
      fileSize: args.fileSize,
      metadata: args.metadata,
    });

    return documentId;
  },
});

// Share document with property managers
export const shareDocumentWithPropertyManagers = mutation({
  args: {
    documentId: v.id("ipfsDocuments"),
    propertyManagerIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      isShared: true,
      sharedWith: args.propertyManagerIds,
    });

    return args.documentId;
  },
});

// Get user's IPFS documents
export const getUserIPFSDocuments = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ipfsDocuments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get shared documents for property manager
export const getSharedDocuments = query({
  args: { propertyManagerId: v.string() },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("ipfsDocuments")
      .filter((q) =>
        q.and(
          q.eq(q.field("isShared"), true),
          q.neq(q.field("sharedWith"), undefined)
        )
      )
      .collect();

    // Filter documents shared with this property manager
    return documents.filter(doc =>
      doc.sharedWith && doc.sharedWith.includes(args.propertyManagerId)
    );
  },
});

// Delete IPFS document
export const deleteIPFSDocument = mutation({
  args: { documentId: v.id("ipfsDocuments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.documentId);
    return args.documentId;
  },
});

// Get document by IPFS hash
export const getDocumentByHash = query({
  args: { ipfsHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ipfsDocuments")
      .withIndex("by_ipfsHash", (q) => q.eq("ipfsHash", args.ipfsHash))
      .first();
  },
});

// Get property crypto payments
export const getPropertyCryptoPayments = query({
  args: { propertyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cryptoPayments")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .order("desc")
      .collect();
  },
});

// Get crypto payment statistics
export const getCryptoPaymentStats = query({
  handler: async (ctx) => {
    const allPayments = await ctx.db.query("cryptoPayments").collect();

    const totalPayments = allPayments.length;
    const confirmedPayments = allPayments.filter(p => p.status === "confirmed").length;
    const pendingPayments = allPayments.filter(p => p.status === "pending").length;
    const failedPayments = allPayments.filter(p => p.status === "failed").length;

    const totalValue = allPayments
      .filter(p => p.status === "confirmed")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const currencies = [...new Set(allPayments.map(p => p.currency))];

    return {
      totalPayments,
      confirmedPayments,
      pendingPayments,
      failedPayments,
      totalValue,
      currencies,
    };
  },
});