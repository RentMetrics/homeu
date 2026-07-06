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
    // Property linking
    propertyId: v.optional(v.string()),
    propertyManagerId: v.optional(v.string()),
    unitNumber: v.optional(v.string()),
    propertyLinkStatus: v.optional(v.string()), // "linked" | "pending_pm_setup" | "pending_property" | "unlinked"
    pmContactInfo: v.optional(v.object({
      companyName: v.string(),
      contactName: v.optional(v.string()),
      email: v.string(),
      phone: v.optional(v.string()),
    })),
    // Richer profile objects (written by renters.update)
    currentAddress: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    })),
    employment: v.optional(v.object({
      employer: v.string(),
      position: v.string(),
      income: v.number(),
      employmentStartDate: v.string(),
    })),
    preferences: v.optional(v.object({
      preferredPropertyTypes: v.array(v.string()),
      maxRent: v.number(),
      preferredLocations: v.array(v.string()),
      moveInDate: v.optional(v.string()),
    })),
    creditInfo: v.optional(v.any()),
    // Argyle verified employment (written by argyle.ts)
    argyleUserId: v.optional(v.string()),
    argyleAccountId: v.optional(v.string()),
    employmentVerified: v.optional(v.boolean()),
    employmentVerificationDate: v.optional(v.number()),
    verifiedEmployer: v.optional(v.string()),
    verifiedPosition: v.optional(v.string()),
    verifiedIncome: v.optional(v.number()),
    verifiedPayFrequency: v.optional(v.string()),
    verifiedEmploymentStartDate: v.optional(v.string()),
    incomeVerificationMethod: v.optional(v.string()),
    lastIncomeSync: v.optional(v.number()),
  }).index("by_userId", ["userId"])
    .index("by_propertyId", ["propertyId"])
    .index("by_argyleUserId", ["argyleUserId"]),

  // Renter rental history (used by convex/rentalHistory.ts)
  rentalHistory: defineTable({
    userId: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    propertyType: v.string(),
    monthlyRent: v.number(),
    moveInDate: v.number(),
    moveOutDate: v.optional(v.number()),
    landlordName: v.optional(v.string()),
    landlordContact: v.optional(v.string()),
    landlordEmail: v.optional(v.string()),
    paymentHistory: v.object({
      onTimePayments: v.number(),
      latePayments: v.number(),
      totalPayments: v.number(),
    }),
    status: v.string(), // "current" | "past"
    verified: v.boolean(),
    verificationMethod: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"]),

  // Argyle-verified employment history (used by convex/argyle.ts)
  employmentHistory: defineTable({
    userId: v.string(),
    argyleUserId: v.string(),
    argyleEmploymentId: v.string(),
    employerName: v.string(),
    jobTitle: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    isCurrent: v.boolean(),
    basePay: v.optional(v.number()),
    payFrequency: v.optional(v.string()),
    employerCity: v.optional(v.string()),
    employerState: v.optional(v.string()),
    dataSource: v.string(), // "argyle" | "manual"
    verifiedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_argyleEmploymentId", ["argyleEmploymentId"]),

  // PMS (Property Management Software) connections per property.
  // Lets a renter submit their HomeU application directly into the
  // property's management system instead of filling out its online form.
  pmsConnections: defineTable({
    propertyId: v.string(), // multifamilyproperties.propertyId
    provider: v.string(), // "entrata" | "yardi" | "realpage" | "buildium" | "appfolio" | "rentmanager" | "email"
    status: v.string(), // "active" | "inactive" | "pending"
    // Provider-side identifiers for this property
    externalPropertyId: v.optional(v.string()),
    externalSourceId: v.optional(v.string()), // e.g. Yardi ILS source / Entrata lead source
    // Where the provider API lives for this PM company (per-tenant base URLs are common)
    apiBaseUrl: v.optional(v.string()),
    // Name of the server-side env var group holding credentials (never store secrets in the DB)
    credentialRef: v.optional(v.string()),
    // Fallback contact if direct submission fails
    fallbackEmail: v.optional(v.string()),
    notes: v.optional(v.string()),
    lastSubmissionAt: v.optional(v.number()),
    lastSubmissionStatus: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_propertyId", ["propertyId"])
    .index("by_provider", ["provider"])
    .index("by_status", ["status"]),

  // A renter's application submissions to properties (via PMS or email fallback)
  applicationSubmissions: defineTable({
    userId: v.string(),
    propertyId: v.optional(v.string()),
    propertyName: v.string(),
    propertyAddress: v.optional(v.string()),
    pmCompanyName: v.optional(v.string()),
    channel: v.string(), // "pms" | "email"
    provider: v.optional(v.string()), // pms provider when channel === "pms"
    pmsConnectionId: v.optional(v.id("pmsConnections")),
    status: v.string(), // "submitted" | "received" | "under_review" | "approved" | "rejected" | "failed"
    externalApplicationId: v.optional(v.string()), // id assigned by the PMS
    // Snapshot of the standardized application payload that was sent
    payloadSnapshot: v.optional(v.any()),
    sectionsIncluded: v.optional(v.array(v.string())), // e.g. ["personal","employment","rental_history","financial"]
    error: v.optional(v.string()),
    events: v.optional(v.array(v.object({
      at: v.number(),
      status: v.string(),
      note: v.optional(v.string()),
    }))),
    submittedAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_propertyId", ["propertyId"])
    .index("by_status", ["status"]),
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
    googlePlaceId: v.optional(v.string()),
    googlePhotos: v.optional(v.array(v.object({
      photoReference: v.string(),
      width: v.number(),
      height: v.number(),
    }))),
    googleAttributionRequired: v.optional(v.boolean()),
    googleLastVerified: v.optional(v.number()),
    googleFormattedAddress: v.optional(v.string()),
    googleUserRatingsTotal: v.optional(v.number()),
    homeuScore: v.optional(v.number()),
    scoreFactors: v.optional(v.array(v.string())),
    amenities: v.optional(v.array(v.string())),
    lastRenovated: v.optional(v.number()),
    propertyOwner: v.optional(v.string()),
    pmCompanyName: v.optional(v.string()),
    pmWebsite: v.optional(v.string()),
    pmEmail: v.optional(v.string()),
    pmPhone: v.optional(v.string()),
    pmContactName: v.optional(v.string()),
    pmContactTitle: v.optional(v.string()),
    pmNotes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_propertyId", ["propertyId"])
    .index("by_city", ["city"])
    .index("by_state", ["state"])
    .index("by_city_state", ["city", "state"])
    .index("by_googlePlaceId", ["googlePlaceId"])
    .searchIndex("search_name", {
      searchField: "propertyName",
      filterFields: ["city", "state"],
    }),
  
  // Property images (admin-uploaded)
  propertyImages: defineTable({
    propertyId: v.string(),
    storageId: v.id("_storage"),
    fileName: v.string(),
    description: v.optional(v.string()),
    isPrimary: v.boolean(),
    uploadedAt: v.number(),
  }).index("by_propertyId", ["propertyId"]),

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
    straddleCustomerId: v.optional(v.string()),
    straddleBankAccountId: v.optional(v.string()),
    paymentOnboardingComplete: v.optional(v.boolean()),
    paymentOnboardingDate: v.optional(v.number()),
    payoutSchedule: v.optional(v.string()), // 'daily', 'weekly', 'biweekly', 'monthly'
    defaultPayoutMethod: v.optional(v.string()), // 'ach', 'wire'
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

  // Saved renter applications (user-submitted lease applications)
  savedApplications: defineTable({
    userId: v.string(),
    formData: v.any(),
    coApplicants: v.any(),
    occupants: v.any(),
    vehicles: v.any(),
    incomeSources: v.any(),
    status: v.string(), // 'draft', 'submitted'
    submittedAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Pre-aggregated market baselines for Market Intelligence scoring
  marketStats: defineTable({
    city: v.string(),
    state: v.string(),
    month: v.string(),           // "YYYY-MM"
    avgRent: v.number(),
    medianRent: v.number(),
    avgRentPerSqFt: v.number(),
    avgOccupancy: v.number(),
    avgConcessionValue: v.number(),
    concessionPrevalence: v.number(),  // % of properties offering concessions
    rentTrend3mo: v.number(),          // % change
    rentTrend12mo: v.number(),         // % change
    propertyCount: v.number(),
    totalUnits: v.number(),
    updatedAt: v.number(),
  })
    .index("by_city_state_month", ["city", "state", "month"])
    .index("by_state_month", ["state", "month"]),

  // Monthly rent statements
  monthlyStatements: defineTable({
    renterId: v.string(),
    propertyId: v.string(),
    propertyManagerId: v.string(),
    organizationId: v.optional(v.string()),
    month: v.string(), // "YYYY-MM"
    statementNumber: v.string(),
    lineItems: v.array(v.object({
      type: v.string(),
      description: v.string(),
      amount: v.number(),
    })),
    subtotal: v.number(),
    homeuPlatformFee: v.number(), // $9.99
    homeuConvenienceFee: v.optional(v.number()),
    totalDue: v.number(),
    status: v.string(), // "draft" | "sent" | "overdue" | "partial" | "paid"
    dueDate: v.number(),
    paymentIds: v.optional(v.array(v.string())),
    amountPaid: v.optional(v.number()),
    remindersSent: v.optional(v.number()),
    viewedAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_renterId_month", ["renterId", "month"])
    .index("by_renterId", ["renterId"])
    .index("by_month", ["month"])
    .index("by_propertyManagerId", ["propertyManagerId"])
    .index("by_status", ["status"]),

  // Rent payments with fee split routing
  rentPayments: defineTable({
    renterId: v.string(),
    statementId: v.optional(v.id("monthlyStatements")),
    propertyId: v.string(),
    propertyManagerId: v.string(),
    totalAmount: v.number(), // rent + $9.99 fee
    rentAmount: v.number(),
    homeuFee: v.number(), // $9.99
    feeBreakdown: v.object({
      operationsFee: v.number(), // $4.99
      rewardsFunding: v.number(), // $2.00
      creditReportingFee: v.number(), // $3.00
      pointsAwarded: v.number(), // 200
      pointsConversion: v.optional(v.number()),
    }),
    paymentMethod: v.string(), // "ach" | "crypto"
    paykey: v.optional(v.string()),
    status: v.string(), // "pending" | "processing" | "completed" | "failed"
    isOnTime: v.boolean(),
    daysEarly: v.optional(v.number()),
    isAutoPay: v.optional(v.boolean()),
    pointsAwarded: v.boolean(),
    totalPointsEarned: v.optional(v.number()),
    straddlePaymentId: v.optional(v.string()),
    straddleRentRouteId: v.optional(v.string()),
    straddleFeeRouteId: v.optional(v.string()),
    pointsTransactionId: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
    creditReported: v.optional(v.boolean()),
    creditReportedAt: v.optional(v.number()),
    initiatedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_renterId", ["renterId"])
    .index("by_statementId", ["statementId"])
    .index("by_propertyManagerId", ["propertyManagerId"])
    .index("by_status", ["status"]),

  // User reward points balance and stats
  userPoints: defineTable({
    userId: v.string(),
    totalEarned: v.number(),
    totalRedeemed: v.number(),
    currentBalance: v.number(),
    expiringPoints: v.optional(v.number()),
    lastEarnedAt: v.optional(v.number()),
    lastRedeemedAt: v.optional(v.number()),
    streakCount: v.optional(v.number()),
    longestStreak: v.optional(v.number()),
    referralCount: v.optional(v.number()),
    tier: v.string(), // "bronze" | "silver" | "gold" | "platinum"
    // Awardco funding tracking
    totalFundedToAwardco: v.optional(v.number()), // total $ sent to Awardco
    lastAwardcoFundedAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_currentBalance", ["currentBalance"]),

  // Point transaction ledger
  pointTransactions: defineTable({
    userId: v.string(),
    type: v.string(), // "earn" | "redeem" | "expire" | "awardco_fund"
    category: v.string(), // "rent" | "signup" | "referral" | "milestone" | "redemption" | "awardco_funding"
    amount: v.number(), // positive for earn, negative for redeem
    balance: v.number(), // running balance after transaction
    description: v.string(),
    metadata: v.optional(v.any()),
    awardcoSynced: v.optional(v.boolean()),
    awardcoTransactionId: v.optional(v.string()),
    status: v.string(), // "completed" | "pending" | "failed" | "expired"
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_type", ["type"])
    .index("by_awardcoSynced", ["awardcoSynced"]),

  // Payment streaks
  paymentStreaks: defineTable({
    userId: v.string(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastPaymentDate: v.number(),
    streakStartDate: v.number(),
    missedPayments: v.optional(v.number()),
    streakBonuses: v.optional(v.array(v.any())),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // HomeU revenue tracking per payment
  homeuRevenue: defineTable({
    rentPaymentId: v.id("rentPayments"),
    statementId: v.optional(v.id("monthlyStatements")),
    renterId: v.string(),
    propertyManagerId: v.string(),
    totalFee: v.number(), // $9.99
    operationsRevenue: v.number(), // $4.99
    rewardsFunding: v.optional(v.number()), // $2.00
    creditReportingFee: v.optional(v.number()), // $3.00
    pointsLiability: v.number(), // $2.00 (dollar value owed to resident)
    pointsIssued: v.number(), // 200 (points awarded)
    awardcoFunded: v.optional(v.boolean()), // has $ been sent to Awardco
    awardcoFundedAmount: v.optional(v.number()), // $ amount sent
    awardcoFundedAt: v.optional(v.number()),
    pointsTransactionId: v.optional(v.string()),
    status: v.string(), // "pending" | "collected" | "allocated" | "funded" | "reported"
    month: v.string(),
    collectedAt: v.number(),
    createdAt: v.number(),
  }).index("by_rentPaymentId", ["rentPaymentId"])
    .index("by_month", ["month"])
    .index("by_propertyManagerId", ["propertyManagerId"])
    .index("by_renterId", ["renterId"])
    .index("by_awardcoFunded", ["awardcoFunded"]),

  // Awardco funding ledger - tracks money flow to Awardco
  awardcoFundingLedger: defineTable({
    renterId: v.string(),
    revenueId: v.optional(v.id("homeuRevenue")),
    rentPaymentId: v.optional(v.id("rentPayments")),
    type: v.string(), // "payment_funding" | "bulk_transfer" | "adjustment"
    dollarAmount: v.number(), // actual $ sent to Awardco
    pointsEquivalent: v.number(), // points this represents
    description: v.string(),
    awardcoTransactionId: v.optional(v.string()),
    status: v.string(), // "pending" | "funded" | "failed"
    fundedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_renterId", ["renterId"])
    .index("by_status", ["status"])
    .index("by_revenueId", ["revenueId"]),

  // PM outreach requests — triggered when a renter links to a property
  // whose PM hasn't onboarded yet
  pmOutreachRequests: defineTable({
    renterId: v.string(),
    propertyId: v.optional(v.string()),
    pmEmail: v.string(),
    pmCompanyName: v.string(),
    pmContactName: v.optional(v.string()),
    pmPhone: v.optional(v.string()),
    propertyName: v.optional(v.string()),
    propertyAddress: v.optional(v.string()),
    propertyCity: v.optional(v.string()),
    propertyState: v.optional(v.string()),
    propertyZipCode: v.optional(v.string()),
    status: v.string(), // "pending" | "sent" | "onboarded" | "declined"
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
  }).index("by_renterId", ["renterId"])
    .index("by_pmEmail", ["pmEmail"])
    .index("by_status", ["status"]),

  // Rent payment routing config
  rentPaymentRouting: defineTable({
    renterId: v.string(),
    propertyId: v.string(),
    propertyManagerId: v.optional(v.string()),
    monthlyRentAmount: v.number(),
    dueDay: v.optional(v.number()),
    isActive: v.boolean(),
    autoPayEnabled: v.optional(v.boolean()),
    straddlePaymentMethodId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_renterId", ["renterId"])
    .index("by_propertyId", ["propertyId"])
    .index("by_propertyManagerId", ["propertyManagerId"]),

  // Property charge templates
  propertyChargeTemplates: defineTable({
    propertyId: v.string(),
    chargeType: v.string(),
    name: v.string(),
    amount: v.number(),
    frequency: v.string(), // "monthly" | "one-time"
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_propertyId", ["propertyId"]),

  // Achievement definitions (gamification layer — convex/achievements.ts)
  achievementDefinitions: defineTable({
    achievementId: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    iconName: v.string(),
    badgeColor: v.string(),
    requirements: v.object({
      type: v.string(),
      target: v.number(),
      metric: v.string(),
    }),
    pointsAwarded: v.number(),
    isHidden: v.boolean(),
    displayOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_achievementId", ["achievementId"])
    .index("by_isActive", ["isActive"])
    .index("by_category", ["category"]),

  // Per-user achievement progress
  achievementProgress: defineTable({
    userId: v.string(),
    achievementId: v.string(),
    achievementDefinitionId: v.id("achievementDefinitions"),
    currentValue: v.number(),
    targetValue: v.number(),
    percentComplete: v.number(),
    status: v.string(), // "in_progress" | "completed"
    unlockedAt: v.optional(v.number()),
    notified: v.boolean(),
    celebrationShown: v.boolean(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_userId_achievementId", ["userId", "achievementId"]),

  // Unlocked achievements per user
  userAchievements: defineTable({
    userId: v.string(),
    achievementId: v.string(),
    name: v.string(),
    description: v.string(),
    iconUrl: v.optional(v.string()),
    pointsAwarded: v.number(),
    unlockedAt: v.number(),
    metadata: v.optional(v.any()),
  }).index("by_userId", ["userId"])
    .index("by_userId_achievementId", ["userId", "achievementId"]),

  // Referral tracking (queried by achievements)
  referrals: defineTable({
    referrerId: v.string(),
    referredUserId: v.optional(v.string()),
    referredEmail: v.optional(v.string()),
    status: v.string(), // "pending" | "completed"
    completedAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  }).index("by_referrerId", ["referrerId"]),

  // PM subscriptions to premium features (rent predictions etc.)
  propertyManagerSubscriptions: defineTable({
    propertyManagerId: v.string(),
    organizationId: v.string(),
    plan: v.string(),
    features: v.array(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_propertyManagerId", ["propertyManagerId"]),

  // Monthly rent collection predictions per PM
  rentPredictions: defineTable({
    propertyManagerId: v.string(),
    organizationId: v.string(),
    month: v.string(), // "YYYY-MM"
    totalResidents: v.number(),
    predictedPayments: v.number(),
    predictedNonPayments: v.number(),
    uncertainPayments: v.number(),
    predictedCollectionRate: v.number(),
    predictedCollectionAmount: v.number(),
    totalExpectedRent: v.number(),
    confidence: v.string(),
    residentPredictions: v.array(v.object({
      renterId: v.string(),
      renterName: v.string(),
      propertyId: v.string(),
      propertyAddress: v.string(),
      rentAmount: v.number(),
      prediction: v.string(),
      confidenceScore: v.number(),
      reason: v.string(),
      lastChecked: v.number(),
    })),
    metadata: v.optional(v.any()),
    generatedAt: v.number(),
  }).index("by_propertyManagerId", ["propertyManagerId"])
    .index("by_propertyManagerId_month", ["propertyManagerId", "month"]),

  // Bank balance checks (Straddle) backing rent predictions
  balanceChecks: defineTable({
    renterId: v.string(),
    propertyManagerId: v.string(),
    checkType: v.string(),
    straddleCheckId: v.optional(v.string()),
    hasSufficientFunds: v.boolean(),
    rentAmount: v.number(),
    availableBalance: v.optional(v.number()),
    accountStatus: v.string(),
    checkedAt: v.number(),
    expiresAt: v.number(),
  }).index("by_renterId", ["renterId"])
    .index("by_propertyManagerId", ["propertyManagerId"]),

  // PM onboarding tokens for bank setup
  pmOnboardingTokens: defineTable({
    propertyManagerId: v.id("propertyManagers"),
    token: v.string(),
    email: v.string(),
    status: v.string(), // "pending" | "completed" | "expired"
    createdAt: v.number(),
    expiresAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_token", ["token"])
    .index("by_propertyManagerId", ["propertyManagerId"]),
}); 