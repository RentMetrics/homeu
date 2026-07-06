interface StraddleCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ssn?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface StraddleBankAccount {
  id: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  bankName: string;
  status: 'active' | 'pending' | 'failed';
  paykey: string;
}

interface StraddlePayment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  paykey: string;
  description: string;
  createdAt: string;
}

interface StraddleVerificationResult {
  customerId: string;
  status: 'approved' | 'rejected' | 'pending';
  kycStatus: 'passed' | 'failed' | 'pending';
  watchlistStatus: 'clear' | 'flagged' | 'pending';
  documents: {
    idDocument: string;
    proofOfIncome: string;
    rentalHistory: string;
  };
}

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

  // Create a new customer for verification
  async createCustomer(customerData: {
    email: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    ssn?: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zipCode: string;
    };
    phone: string;
  }): Promise<StraddleCustomer> {
    return this.request<StraddleCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  // Get customer verification status
  async getCustomerVerification(customerId: string): Promise<StraddleVerificationResult> {
    return this.request<StraddleVerificationResult>(`/customers/${customerId}/verification`);
  }

  // Submit verification documents
  async submitVerificationDocuments(
    customerId: string, 
    documents: {
      idDocument: string; // Base64 encoded document
      proofOfIncome: string; // Base64 encoded document
      rentalHistory: string; // Base64 encoded document
    }
  ): Promise<StraddleVerificationResult> {
    return this.request<StraddleVerificationResult>(`/customers/${customerId}/verification/documents`, {
      method: 'POST',
      body: JSON.stringify(documents),
    });
  }

  // Create a bank account connection link
  async createBankConnection(customerId: string): Promise<{ connectionUrl: string; connectionId: string }> {
    return this.request<{ connectionUrl: string; connectionId: string }>(`/customers/${customerId}/bank-connections`, {
      method: 'POST',
      body: JSON.stringify({
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?success=true`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?canceled=true`,
      }),
    });
  }

  // Get bank account details
  async getBankAccounts(customerId: string): Promise<StraddleBankAccount[]> {
    return this.request<StraddleBankAccount[]>(`/customers/${customerId}/bank-accounts`);
  }

  // Create a payment
  async createPayment(paymentData: {
    customerId: string;
    paykey: string;
    amount: number;
    currency: string;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<StraddlePayment> {
    return this.request<StraddlePayment>('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Get payment status
  async getPayment(paymentId: string): Promise<StraddlePayment> {
    return this.request<StraddlePayment>(`/payments/${paymentId}`);
  }

  // Get customer by ID
  async getCustomer(customerId: string): Promise<StraddleCustomer> {
    return this.request<StraddleCustomer>(`/customers/${customerId}`);
  }

  // -------------------------------------------------------------------------
  // Platform model (organizations / accounts) — used by PM onboarding
  // -------------------------------------------------------------------------

  async createOrganization(data: {
    name: string;
    external_id?: string;
  }): Promise<StraddleOrganization> {
    return this.request<StraddleOrganization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createAccount(data: {
    organization_id: string;
    account_type: string;
    access_level: string;
    business_profile: {
      name: string;
      website?: string;
      phone?: string;
      address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
    };
    external_id?: string;
  }): Promise<StraddleAccount> {
    return this.request<StraddleAccount>('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Sandbox-only: advance an account through review states
  async simulateAccount(accountId: string, status: string): Promise<unknown> {
    return this.request<unknown>(`/accounts/${accountId}/simulate`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async getAccount(accountId: string): Promise<StraddleAccount> {
    return this.request<StraddleAccount>(`/accounts/${accountId}`);
  }

  // -------------------------------------------------------------------------
  // Rent payment helpers
  // -------------------------------------------------------------------------

  /**
   * Split rent payment: one debit from the renter's paykey routed to multiple
   * recipients (property manager rent + HomeU fee). Executed as one payment
   * per route; the first route's payment id is the primary reference.
   */
  async createSplitRentPayment(data: {
    fromCustomerId: string;
    paykey: string;
    totalAmount: number;
    routes: Array<{
      toBusinessCustomerId: string;
      amount: number;
      description: string;
      type: string;
    }>;
    description: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: string; routes: Array<{ id?: string; type: string }> }> {
    const routePayments: Array<{ id?: string; type: string }> = [];

    for (const route of data.routes) {
      const payment = await this.createPayment({
        customerId: data.fromCustomerId,
        paykey: data.paykey,
        amount: route.amount,
        currency: 'USD',
        description: `${data.description} — ${route.description}`,
        metadata: {
          ...data.metadata,
          routeType: route.type,
          recipient: route.toBusinessCustomerId,
        },
      });
      routePayments.push({ id: payment.id, type: route.type });
    }

    return { id: routePayments[0]?.id ?? '', routes: routePayments };
  }

  /**
   * Balance check for rent-payment prediction. Returns account status and
   * whether the customer's linked account can cover the required amount.
   */
  async checkBalance(
    customerId: string,
    requiredAmount: number
  ): Promise<{
    accountStatus: string;
    hasSufficientFunds: boolean;
    availableBalance: number;
  }> {
    try {
      const accounts = await this.getBankAccounts(customerId);
      const active = accounts.find((a) => a.status === 'active') ?? accounts[0];
      if (!active) {
        return { accountStatus: 'inactive', hasSufficientFunds: false, availableBalance: 0 };
      }

      const balance = await this.request<{ available: number; status?: string }>(
        `/customers/${customerId}/bank-accounts/${active.id}/balance`
      );

      return {
        accountStatus: balance.status ?? 'active',
        hasSufficientFunds: balance.available >= requiredAmount,
        availableBalance: balance.available,
      };
    } catch {
      // Balance data unavailable — report as an account error so callers
      // treat the prediction as uncertain rather than a confident yes/no
      return { accountStatus: 'error', hasSufficientFunds: false, availableBalance: 0 };
    }
  }
}

interface StraddleOrganization {
  id: string;
  name: string;
}

interface StraddleAccount {
  id: string;
  organization_id: string;
  status: string;
  business_profile?: { name?: string };
  capabilities?: unknown;
  settings?: unknown;
}

// Export singleton instance
export const straddleAPI = new StraddleAPI();

// Export types for use in other files
export type {
  StraddleCustomer,
  StraddleBankAccount,
  StraddlePayment,
  StraddleVerificationResult,
  StraddleOrganization,
  StraddleAccount,
};
