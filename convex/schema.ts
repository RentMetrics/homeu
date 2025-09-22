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

  // Crypto payments table
  cryptoPayments: defineTable({
    userId: v.string(),
    propertyId: v.string(),
    amount: v.string(),
    currency: v.string(), // 'ETH', 'BTC', 'USDC', 'USDT'
    transactionHash: v.string(),
    status: v.string(), // 'pending', 'confirmed', 'failed'
    blockNumber: v.optional(v.number()),
    gasUsed: v.optional(v.string()),
    gasPrice: v.optional(v.string()),
    recipientAddress: v.string(),
    createdAt: v.number(),
    confirmedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"])
    .index("by_txHash", ["transactionHash"])
    .index("by_property", ["propertyId"]),

  // IPFS documents table
  ipfsDocuments: defineTable({
    userId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    documentType: v.string(), // 'application', 'lease', 'income_verification', 'id_document', 'other'
    ipfsHash: v.string(),
    isShared: v.boolean(),
    sharedWith: v.optional(v.array(v.string())), // Property manager IDs
    uploadedAt: v.number(),
    fileSize: v.optional(v.number()),
    metadata: v.optional(v.any()),
  }).index("by_userId", ["userId"])
    .index("by_ipfsHash", ["ipfsHash"])
    .index("by_documentType", ["documentType"]),

  // Property managers table
  propertyManagers: defineTable({
    workosUserId: v.string(),
    organizationId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    companyName: v.string(),
    role: v.string(), // 'admin', 'manager', 'viewer'
    properties: v.array(v.string()), // Property IDs they manage
    isActive: v.boolean(),
    createdAt: v.number(),
    lastLogin: v.optional(v.number()),
  }).index("by_workosUserId", ["workosUserId"])
    .index("by_organizationId", ["organizationId"])
    .index("by_email", ["email"]),

  // Property manager organizations
  propertyManagerOrganizations: defineTable({
    workosOrganizationId: v.string(),
    companyName: v.string(),
    adminEmail: v.string(),
    properties: v.array(v.string()), // Property IDs managed by this org
    settings: v.optional(v.any()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_workosOrganizationId", ["workosOrganizationId"]),

  // Renter applications to property managers
  renterApplications: defineTable({
    renterId: v.string(),
    propertyId: v.string(),
    propertyManagerId: v.string(),
    organizationId: v.string(),
    status: v.string(), // 'pending', 'approved', 'rejected', 'under_review'
    documentsHash: v.string(), // IPFS hash of application documents
    applicationData: v.any(), // JSON data of the application
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
    score: v.optional(v.number()), // Application score
  }).index("by_renterId", ["renterId"])
    .index("by_propertyId", ["propertyId"])
    .index("by_propertyManagerId", ["propertyManagerId"])
    .index("by_status", ["status"]),

  // Property manager invoices
  propertyManagerInvoices: defineTable({
    organizationId: v.string(),
    propertyManagerId: v.string(),
    invoiceNumber: v.string(),
    month: v.string(), // Format: "YYYY-MM"
    properties: v.array(v.string()), // Property IDs included in invoice
    totalAmount: v.number(),
    currency: v.string(),
    status: v.string(), // 'draft', 'sent', 'paid', 'overdue'
    dueDate: v.number(),
    sentAt: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_organizationId", ["organizationId"])
    .index("by_propertyManagerId", ["propertyManagerId"])
    .index("by_month", ["month"])
    .index("by_status", ["status"]),
}); 