import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Straddle API client for Convex
class StraddleAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://production.straddle.io' 
      : 'https://sandbox.straddle.io';
    this.apiKey = process.env.STRADDLE_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('STRADDLE_API_KEY environment variable is required');
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/v1${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Request-Id': crypto.randomUUID(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Straddle API Error: ${response.status} - ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  async createCustomer(customerData: any) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async getCustomerVerification(customerId: string) {
    return this.request(`/customers/${customerId}/verification`);
  }

  async submitVerificationDocuments(customerId: string, documents: any) {
    return this.request(`/customers/${customerId}/verification/documents`, {
      method: 'POST',
      body: JSON.stringify(documents),
    });
  }

  async createBankConnection(customerId: string) {
    return this.request(`/customers/${customerId}/bank-connections`, {
      method: 'POST',
      body: JSON.stringify({
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?success=true`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?canceled=true`,
      }),
    });
  }

  async getBankAccounts(customerId: string) {
    return this.request(`/customers/${customerId}/bank-accounts`);
  }

  async createPayment(paymentData: any) {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getPayment(paymentId: string) {
    return this.request(`/payments/${paymentId}`);
  }
}

// Create Straddle customer and submit verification
export const createStraddleCustomer = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    ssn: v.optional(v.string()),
    address: v.object({
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
    }),
    phone: v.string(),
    documents: v.optional(v.object({
      idDocument: v.string(),
      proofOfIncome: v.string(),
      rentalHistory: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const straddleAPI = new StraddleAPI();

    // Check if user already exists
    const existingRenter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    let straddleCustomerId = existingRenter?.straddleCustomerId;

    // Create Straddle customer if not exists
    if (!straddleCustomerId) {
      const customer = await straddleAPI.createCustomer({
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        dateOfBirth: args.dateOfBirth,
        ssn: args.ssn,
        address: args.address,
        phone: args.phone,
      });

      straddleCustomerId = (customer as any).id;

      // Update or create renter record
      if (existingRenter) {
        await ctx.db.patch(existingRenter._id, {
          straddleCustomerId: (customer as any).id,
          firstName: args.firstName,
          lastName: args.lastName,
          phoneNumber: args.phone,
          dateOfBirth: args.dateOfBirth,
          street: args.address.line1,
          city: args.address.city,
          state: args.address.state,
          zipCode: args.address.zipCode,
        });
      } else {
        await ctx.db.insert("renters", {
          userId: args.userId,
          email: args.email,
          firstName: args.firstName,
          lastName: args.lastName,
          phoneNumber: args.phone,
          dateOfBirth: args.dateOfBirth,
          street: args.address.line1,
          city: args.address.city,
          state: args.address.state,
          zipCode: args.address.zipCode,
          employer: "",
          position: "",
          income: 0,
          straddleCustomerId: (customer as any).id,
          verified: false,
        });
      }
    }

    // Submit verification documents if provided
    if (args.documents) {
      await straddleAPI.submitVerificationDocuments(straddleCustomerId, args.documents);
    }

    // Get verification status
    const verification = await straddleAPI.getCustomerVerification(straddleCustomerId);

    // Update verification status
    if (existingRenter) {
      await ctx.db.patch(existingRenter._id, {
        verified: verification.status === 'approved',
        verificationStatus: verification.status,
        verificationDate: verification.status === 'approved' ? Date.now() : null,
      });
    }

    return {
      success: true,
      customerId: straddleCustomerId,
      verification: verification
    };
  },
});

// Get verification status
export const getVerificationStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter?.straddleCustomerId) {
      return { error: 'No Straddle customer found' };
    }

    try {
      const straddleAPI = new StraddleAPI();
      const verification = await straddleAPI.getCustomerVerification(renter.straddleCustomerId);
      
      return {
        verification,
        localVerification: {
          verified: renter.verified,
          verificationStatus: renter.verificationStatus,
          verificationDate: renter.verificationDate,
        }
      };
    } catch (error) {
      return { error: 'Failed to get verification status' };
    }
  },
});

// Create bank connection
export const createBankConnection = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter?.straddleCustomerId) {
      throw new Error('User must be verified with Straddle first');
    }

    const straddleAPI = new StraddleAPI();
    const connection = await straddleAPI.createBankConnection(renter.straddleCustomerId);

    return {
      success: true,
      connectionUrl: connection.connectionUrl,
      connectionId: connection.connectionId
    };
  },
});

// Get bank accounts
export const getBankAccounts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter?.straddleCustomerId) {
      return { error: 'No Straddle customer found' };
    }

    try {
      const straddleAPI = new StraddleAPI();
      const bankAccounts = await straddleAPI.getBankAccounts(renter.straddleCustomerId);
      
      return { bankAccounts };
    } catch (error) {
      return { error: 'Failed to get bank accounts' };
    }
  },
});

// Create payment
export const createPayment = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    paykey: v.string(),
    propertyId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter?.straddleCustomerId) {
      throw new Error('User must be verified with Straddle first');
    }

    const straddleAPI = new StraddleAPI();
    
    // Create payment through Straddle
    const straddlePayment = await straddleAPI.createPayment({
      customerId: renter.straddleCustomerId,
      paykey: args.paykey,
      amount: args.amount,
      currency: args.currency,
      description: args.description,
      metadata: {
        ...args.metadata,
        propertyId: args.propertyId,
        userId: args.userId,
        paymentType: 'rent'
      }
    });

    // Create local payment record
    const payment = await ctx.db.insert("payments", {
      userId: args.userId,
      propertyId: args.propertyId,
      amount: args.amount,
      currency: args.currency,
      status: straddlePayment.status === 'completed' ? 'COMPLETED' : 
              straddlePayment.status === 'failed' ? 'FAILED' : 'PENDING',
      type: 'FIAT',
      straddlePaymentId: straddlePayment.id,
      metadata: {
        straddlePaymentId: straddlePayment.id,
        paykey: args.paykey,
        description: args.description,
        ...args.metadata
      },
      createdAt: Date.now(),
    });

    return {
      success: true,
      payment: {
        id: payment,
        amount: args.amount,
        currency: args.currency,
        status: straddlePayment.status,
        straddlePaymentId: straddlePayment.id
      }
    };
  },
});

// Get payment status
export const getPaymentStatus = query({
  args: { paymentId: v.string() },
  handler: async (ctx, args) => {
    try {
      const straddleAPI = new StraddleAPI();
      const payment = await straddleAPI.getPayment(args.paymentId);
      
      return { payment };
    } catch (error) {
      return { error: 'Failed to get payment status' };
    }
  },
});

// Get user payments
export const getUserPayments = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return { payments };
  },
}); 