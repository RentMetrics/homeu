import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  renters: defineTable({
    userId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phoneNumber: v.string(),
    dateOfBirth: v.string(),
    street: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    employer: v.string(),
    position: v.string(),
    income: v.number(),
    straddleCustomerId: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    verificationStatus: v.optional(v.string()),
    verificationDate: v.optional(v.number()),
  }).index("by_userId", ["userId"]),
  properties: defineTable({
    title: v.string(),
    type: v.string(),
    price: v.number(),
    beds: v.number(),
    baths: v.number(),
    sqft: v.number(),
    image: v.string(),
    description: v.string(),
    amenities: v.array(v.string()),
    homeuScore: v.number(),
    scoreFactors: v.array(v.string()),
  }),
  multifamilyproperties: defineTable({
    propertyId: v.string(),
    propertyName: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    totalUnits: v.number(),
    yearBuilt: v.number(),
    averageUnitSize: v.number(),
    googleRating: v.optional(v.number()),
    googleImageUrl: v.optional(v.string()),
    homeuScore: v.optional(v.number()),
    scoreFactors: v.optional(v.array(v.string())),
    amenities: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_propertyId", ["propertyId"])
    .index("by_city", ["city"])
    .index("by_state", ["state"])
    .index("by_city_state", ["city", "state"]),
  
  // Monthly occupancy data
  occupancyData: defineTable({
    propertyId: v.string(),
    month: v.string(), // Format: "YYYY-MM"
    occupancyRate: v.number(), // Percentage (0-100)
    occupiedUnits: v.number(),
    vacantUnits: v.number(),
    totalUnits: v.number(),
    createdAt: v.number(),
  }).index("by_propertyId_month", ["propertyId", "month"]),
  
  // Monthly concession data
  concessionData: defineTable({
    propertyId: v.string(),
    month: v.string(), // Format: "YYYY-MM"
    concessionType: v.string(), // e.g., "Free Rent", "Reduced Rent", "Move-in Special"
    concessionAmount: v.number(), // Dollar amount
    concessionDuration: v.number(), // Number of months
    unitsWithConcessions: v.number(),
    totalUnits: v.number(),
    createdAt: v.number(),
  }).index("by_propertyId_month", ["propertyId", "month"]),
  
  // Monthly rent data
  rentData: defineTable({
    propertyId: v.string(),
    month: v.string(), // Format: "YYYY-MM"
    averageRent: v.number(),
    minRent: v.number(),
    maxRent: v.number(),
    rentPerSqFt: v.number(),
    totalRevenue: v.number(),
    unitsRented: v.number(),
    totalUnits: v.number(),
    createdAt: v.number(),
  }).index("by_propertyId_month", ["propertyId", "month"]),

  // Lease uploads and highlights
  leases: defineTable({
    userId: v.string(), // User who uploaded the lease
    fileId: v.string(), // Storage reference to the uploaded file
    fileName: v.string(),
    fileType: v.string(),
    uploadedAt: v.number(),
    term: v.optional(v.string()), // Lease term (extracted)
    rentalAmount: v.optional(v.string()), // Rental amount (extracted)
    abstract: v.optional(v.string()), // Lease abstract/summary
    status: v.optional(v.string()), // e.g., 'processing', 'complete', 'error'
  }).index("by_userId", ["userId"]),

  // Payments table for Straddle integration
  payments: defineTable({
    userId: v.string(),
    propertyId: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.string(), // 'PENDING', 'COMPLETED', 'FAILED'
    type: v.string(), // 'FIAT', 'CRYPTO'
    straddlePaymentId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
}); 