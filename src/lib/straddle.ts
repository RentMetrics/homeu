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
}

// Export singleton instance
export const straddleAPI = new StraddleAPI();

// Export types for use in other files
export type {
  StraddleCustomer,
  StraddleBankAccount,
  StraddlePayment,
  StraddleVerificationResult,
}; 