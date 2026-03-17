/**
 * Convex Functions for HomeU Monthly Statements
 *
 * Handles generation, retrieval, and management of monthly rent statements
 * that include the $9.99 HomeU platform fee.
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Constants
export const HOMEU_PLATFORM_FEE = 9.99;
export const HOMEU_CONVENIENCE_FEE = HOMEU_PLATFORM_FEE; // legacy alias

/**
 * Generate a unique statement number
 */
function generateStatementNumber(month: string, sequence: number): string {
  const [year, monthNum] = month.split('-');
  return `STMT-${year}-${monthNum}-${String(sequence).padStart(4, '0')}`;
}

// ========================================
// STATEMENT GENERATION
// ========================================

/**
 * Generate a monthly statement for a renter
 */
export const generateMonthlyStatement = mutation({
  args: {
    renterId: v.string(),
    propertyId: v.string(),
    propertyManagerId: v.string(),
    organizationId: v.string(),
    month: v.string(), // Format: "YYYY-MM"
    baseRent: v.number(),
    additionalCharges: v.optional(v.array(v.object({
      type: v.string(),
      description: v.string(),
      amount: v.number(),
    }))),
    dueDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if statement already exists for this month
    const existing = await ctx.db
      .query("monthlyStatements")
      .withIndex("by_renterId_month", (q) =>
        q.eq("renterId", args.renterId).eq("month", args.month)
      )
      .first();

    if (existing) {
      return {
        success: false,
        message: "Statement already exists for this month",
        statementId: existing._id,
      };
    }

    // Get property charge templates for additional recurring charges
    const chargeTemplates = await ctx.db
      .query("propertyChargeTemplates")
      .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Build line items
    const lineItems: Array<{ type: string; description: string; amount: number }> = [
      {
        type: "base_rent",
        description: "Monthly Rent",
        amount: args.baseRent,
      },
    ];

    // Add charges from templates
    for (const template of chargeTemplates) {
      if (template.frequency === "monthly") {
        lineItems.push({
          type: template.chargeType,
          description: template.name,
          amount: template.amount,
        });
      }
    }

    // Add any additional one-time charges
    if (args.additionalCharges) {
      lineItems.push(...args.additionalCharges);
    }

    // Add HomeU convenience fee
    lineItems.push({
      type: "homeu_fee",
      description: "HomeU Convenience Fee",
      amount: HOMEU_CONVENIENCE_FEE,
    });

    // Calculate totals
    const subtotal = lineItems
      .filter((item) => item.type !== "homeu_fee")
      .reduce((sum, item) => sum + item.amount, 0);
    const totalDue = subtotal + HOMEU_CONVENIENCE_FEE;

    // Generate statement number
    const monthStatements = await ctx.db
      .query("monthlyStatements")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .collect();
    const sequence = monthStatements.length + 1;
    const statementNumber = generateStatementNumber(args.month, sequence);

    // Create statement
    const statementId = await ctx.db.insert("monthlyStatements", {
      renterId: args.renterId,
      propertyId: args.propertyId,
      propertyManagerId: args.propertyManagerId,
      organizationId: args.organizationId,
      month: args.month,
      statementNumber,
      lineItems,
      subtotal,
      homeuConvenienceFee: HOMEU_CONVENIENCE_FEE,
      totalDue,
      status: "draft",
      dueDate: args.dueDate,
      paymentIds: [],
      amountPaid: 0,
      remindersSent: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      statementId,
      statementNumber,
      totalDue,
    };
  },
});

/**
 * Send a statement to the renter (marks as sent)
 */
export const sendStatement = mutation({
  args: {
    statementId: v.id("monthlyStatements"),
  },
  handler: async (ctx, args) => {
    const statement = await ctx.db.get(args.statementId);
    if (!statement) {
      return { success: false, message: "Statement not found" };
    }

    await ctx.db.patch(args.statementId, {
      status: "sent",
      sentAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Add a late fee to a statement
 */
export const addLateFee = mutation({
  args: {
    statementId: v.id("monthlyStatements"),
    amount: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const statement = await ctx.db.get(args.statementId);
    if (!statement) {
      return { success: false, message: "Statement not found" };
    }

    const newLineItems = [
      ...statement.lineItems,
      {
        type: "late_fee",
        description: args.description || "Late Payment Fee",
        amount: args.amount,
      },
    ];

    const newSubtotal = statement.subtotal + args.amount;
    const newTotalDue = newSubtotal + HOMEU_CONVENIENCE_FEE;

    await ctx.db.patch(args.statementId, {
      lineItems: newLineItems,
      subtotal: newSubtotal,
      totalDue: newTotalDue,
      status: "overdue",
      updatedAt: Date.now(),
    });

    return {
      success: true,
      newTotalDue,
    };
  },
});

// ========================================
// STATEMENT QUERIES
// ========================================

/**
 * Get the current statement for a renter
 */
export const getCurrentStatement = query({
  args: { renterId: v.string() },
  handler: async (ctx, args) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const statement = await ctx.db
      .query("monthlyStatements")
      .withIndex("by_renterId_month", (q) =>
        q.eq("renterId", args.renterId).eq("month", currentMonth)
      )
      .first();

    if (!statement) {
      return null;
    }

    return {
      ...statement,
      feeExplainer: {
        totalFee: HOMEU_CONVENIENCE_FEE,
        operationsFee: 4.00,
        pointsConversion: 1.00,
        pointsYouEarn: 100,
        message: "Your $9.99 fee includes credit bureau reporting + 200 reward points!"
      }
    };
  },
});

/**
 * Get all statements for a renter
 */
export const getRenterStatements = query({
  args: {
    renterId: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("monthlyStatements")
      .withIndex("by_renterId", (q) => q.eq("renterId", args.renterId))
      .order("desc");

    const statements = await query.take(args.limit || 12);

    // Filter by status if specified
    if (args.status) {
      return statements.filter((s) => s.status === args.status);
    }

    return statements;
  },
});

/**
 * Get a specific statement by ID
 */
export const getStatementById = query({
  args: { statementId: v.id("monthlyStatements") },
  handler: async (ctx, args) => {
    const statement = await ctx.db.get(args.statementId);
    if (!statement) return null;

    // Get associated payments
    const payments = await ctx.db
      .query("rentPayments")
      .withIndex("by_statementId", (q) => q.eq("statementId", args.statementId))
      .collect();

    return {
      ...statement,
      payments,
      feeExplainer: {
        totalFee: HOMEU_CONVENIENCE_FEE,
        operationsFee: 4.00,
        pointsConversion: 1.00,
        pointsYouEarn: 100,
        message: "Your $9.99 fee includes credit bureau reporting + 200 reward points!"
      }
    };
  },
});

/**
 * Get unpaid statements for a renter
 */
export const getUnpaidStatements = query({
  args: { renterId: v.string() },
  handler: async (ctx, args) => {
    const statements = await ctx.db
      .query("monthlyStatements")
      .withIndex("by_renterId", (q) => q.eq("renterId", args.renterId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "sent"),
          q.eq(q.field("status"), "overdue"),
          q.eq(q.field("status"), "partial")
        )
      )
      .collect();

    return statements;
  },
});

/**
 * Get overdue statements for reminders
 */
export const getOverdueStatements = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const overdueStatements = await ctx.db
      .query("monthlyStatements")
      .withIndex("by_status", (q) => q.eq("status", "sent"))
      .filter((q) => q.lt(q.field("dueDate"), now))
      .collect();

    return overdueStatements;
  },
});

// ========================================
// STATEMENT STATUS UPDATES
// ========================================

/**
 * Mark statement as viewed
 */
export const markStatementViewed = mutation({
  args: { statementId: v.id("monthlyStatements") },
  handler: async (ctx, args) => {
    const statement = await ctx.db.get(args.statementId);
    if (!statement) return { success: false };

    if (!statement.viewedAt) {
      await ctx.db.patch(args.statementId, {
        viewedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Update statement after payment received
 */
export const recordPaymentOnStatement = mutation({
  args: {
    statementId: v.id("monthlyStatements"),
    paymentId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const statement = await ctx.db.get(args.statementId);
    if (!statement) {
      return { success: false, message: "Statement not found" };
    }

    const newAmountPaid = statement.amountPaid + args.amount;
    const newPaymentIds = [...statement.paymentIds, args.paymentId];

    // Determine new status
    let newStatus = statement.status;
    if (newAmountPaid >= statement.totalDue) {
      newStatus = "paid";
    } else if (newAmountPaid > 0) {
      newStatus = "partial";
    }

    await ctx.db.patch(args.statementId, {
      amountPaid: newAmountPaid,
      paymentIds: newPaymentIds,
      status: newStatus,
      paidAt: newStatus === "paid" ? Date.now() : undefined,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      newStatus,
      remainingBalance: statement.totalDue - newAmountPaid,
    };
  },
});

// ========================================
// PROPERTY MANAGER QUERIES
// ========================================

/**
 * Get statements for a property manager
 */
export const getPropertyManagerStatements = query({
  args: {
    propertyManagerId: v.string(),
    month: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("monthlyStatements")
      .withIndex("by_propertyManagerId", (q) =>
        q.eq("propertyManagerId", args.propertyManagerId)
      )
      .order("desc");

    let statements = await query.take(args.limit || 100);

    // Filter by month if specified
    if (args.month) {
      statements = statements.filter((s) => s.month === args.month);
    }

    // Filter by status if specified
    if (args.status) {
      statements = statements.filter((s) => s.status === args.status);
    }

    // Calculate summary
    const summary = {
      total: statements.length,
      draft: statements.filter((s) => s.status === "draft").length,
      sent: statements.filter((s) => s.status === "sent").length,
      paid: statements.filter((s) => s.status === "paid").length,
      overdue: statements.filter((s) => s.status === "overdue").length,
      totalDue: statements.reduce((sum, s) => sum + s.totalDue, 0),
      totalCollected: statements.reduce((sum, s) => sum + s.amountPaid, 0),
    };

    return {
      statements,
      summary,
    };
  },
});

/**
 * Bulk generate statements for all active renters of a property
 */
export const bulkGenerateStatements = mutation({
  args: {
    propertyId: v.string(),
    propertyManagerId: v.string(),
    organizationId: v.string(),
    month: v.string(),
    dueDay: v.number(), // Day of month for due date
  },
  handler: async (ctx, args) => {
    // Get all active rent routing for this property
    const rentRouting = await ctx.db
      .query("rentPaymentRouting")
      .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const results: Array<{ renterId: string; success: boolean; statementId?: Id<"monthlyStatements">; error?: string }> = [];

    for (const routing of rentRouting) {
      // Check if statement already exists
      const existing = await ctx.db
        .query("monthlyStatements")
        .withIndex("by_renterId_month", (q) =>
          q.eq("renterId", routing.renterId).eq("month", args.month)
        )
        .first();

      if (existing) {
        results.push({
          renterId: routing.renterId,
          success: false,
          error: "Statement already exists",
        });
        continue;
      }

      // Calculate due date
      const [year, monthNum] = args.month.split('-');
      const dueDate = new Date(parseInt(year), parseInt(monthNum) - 1, args.dueDay).getTime();

      // Get charge templates
      const chargeTemplates = await ctx.db
        .query("propertyChargeTemplates")
        .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      // Build line items
      const lineItems: Array<{ type: string; description: string; amount: number }> = [
        {
          type: "base_rent",
          description: "Monthly Rent",
          amount: routing.monthlyRentAmount,
        },
      ];

      for (const template of chargeTemplates) {
        if (template.frequency === "monthly") {
          lineItems.push({
            type: template.chargeType,
            description: template.name,
            amount: template.amount,
          });
        }
      }

      lineItems.push({
        type: "homeu_fee",
        description: "HomeU Convenience Fee",
        amount: HOMEU_CONVENIENCE_FEE,
      });

      // Calculate totals
      const subtotal = lineItems
        .filter((item) => item.type !== "homeu_fee")
        .reduce((sum, item) => sum + item.amount, 0);
      const totalDue = subtotal + HOMEU_CONVENIENCE_FEE;

      // Generate statement number
      const monthStatements = await ctx.db
        .query("monthlyStatements")
        .withIndex("by_month", (q) => q.eq("month", args.month))
        .collect();
      const sequence = monthStatements.length + results.filter(r => r.success).length + 1;
      const statementNumber = generateStatementNumber(args.month, sequence);

      // Create statement
      const statementId = await ctx.db.insert("monthlyStatements", {
        renterId: routing.renterId,
        propertyId: args.propertyId,
        propertyManagerId: args.propertyManagerId,
        organizationId: args.organizationId,
        month: args.month,
        statementNumber,
        lineItems,
        subtotal,
        homeuConvenienceFee: HOMEU_CONVENIENCE_FEE,
        totalDue,
        status: "draft",
        dueDate,
        paymentIds: [],
        amountPaid: 0,
        remindersSent: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      results.push({
        renterId: routing.renterId,
        success: true,
        statementId,
      });
    }

    return {
      success: true,
      generated: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      details: results,
    };
  },
});
