/**
 * Argyle API Client
 *
 * Official API Documentation: https://docs.argyle.com
 * Sandbox Base URL: https://api-sandbox.argyle.com/v2
 * Production Base URL: https://api.argyle.com/v2
 *
 * Authentication: Basic Auth with API ID + Secret (base64 encoded)
 */

import {
  ArgyleUser,
  ArgyleUserToken,
  ArgyleAccount,
  ArgyleEmployment,
  ArgylePaystub,
  ArgyleIncome,
  ArgyleIdentity,
  ArgyleEmployer,
  ArgyleListResponse,
} from './types';

const ARGYLE_SANDBOX_URL = 'https://api-sandbox.argyle.com/v2';
const ARGYLE_PRODUCTION_URL = 'https://api.argyle.com/v2';

export interface ArgyleConfig {
  apiId: string;
  apiSecret: string;
  environment: 'sandbox' | 'production';
}

export class ArgyleClient {
  private apiId: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(config: ArgyleConfig) {
    this.apiId = config.apiId;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.environment === 'production'
      ? ARGYLE_PRODUCTION_URL
      : ARGYLE_SANDBOX_URL;
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.apiId}:${this.apiSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.getAuthHeader(),
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (body && (method === 'POST')) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Argyle API Error: ${response.status}`, errorText);
        throw new Error(`Argyle API Error: ${response.status} - ${errorText}`);
      }

      // Some endpoints return no content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('Argyle API request failed:', error);
      throw error;
    }
  }

  // ========================================
  // USER MANAGEMENT
  // ========================================

  /**
   * Create a new Argyle user
   * This should be called once per HomeU user when they start the employment verification flow
   */
  async createUser(): Promise<ArgyleUser> {
    return this.makeRequest<ArgyleUser>('/users', 'POST', {});
  }

  /**
   * Get a user by ID
   */
  async getUser(userId: string): Promise<ArgyleUser> {
    return this.makeRequest<ArgyleUser>(`/users/${userId}`);
  }

  /**
   * Create a user token for initializing Argyle Link
   * Tokens expire after 30 minutes
   */
  async createUserToken(userId: string): Promise<ArgyleUserToken> {
    return this.makeRequest<ArgyleUserToken>('/user-tokens', 'POST', {
      user: userId,
    });
  }

  // ========================================
  // ACCOUNT MANAGEMENT
  // ========================================

  /**
   * Get all accounts for a user
   */
  async getAccounts(userId: string): Promise<ArgyleListResponse<ArgyleAccount>> {
    return this.makeRequest<ArgyleListResponse<ArgyleAccount>>(`/accounts?user=${userId}`);
  }

  /**
   * Get a specific account by ID
   */
  async getAccount(accountId: string): Promise<ArgyleAccount> {
    return this.makeRequest<ArgyleAccount>(`/accounts/${accountId}`);
  }

  /**
   * Delete/disconnect an account
   */
  async deleteAccount(accountId: string): Promise<void> {
    await this.makeRequest<void>(`/accounts/${accountId}`, 'DELETE');
  }

  // ========================================
  // EMPLOYMENT DATA
  // ========================================

  /**
   * Get employments for a user
   */
  async getEmployments(userId: string, accountId?: string): Promise<ArgyleListResponse<ArgyleEmployment>> {
    let endpoint = `/employments?user=${userId}`;
    if (accountId) {
      endpoint += `&account=${accountId}`;
    }
    return this.makeRequest<ArgyleListResponse<ArgyleEmployment>>(endpoint);
  }

  /**
   * Get a specific employment record
   */
  async getEmployment(employmentId: string): Promise<ArgyleEmployment> {
    return this.makeRequest<ArgyleEmployment>(`/employments/${employmentId}`);
  }

  /**
   * Get employer information
   */
  async getEmployer(employerId: string): Promise<ArgyleEmployer> {
    return this.makeRequest<ArgyleEmployer>(`/employers/${employerId}`);
  }

  // ========================================
  // INCOME DATA
  // ========================================

  /**
   * Get income records for a user
   */
  async getIncomes(userId: string, accountId?: string): Promise<ArgyleListResponse<ArgyleIncome>> {
    let endpoint = `/incomes?user=${userId}`;
    if (accountId) {
      endpoint += `&account=${accountId}`;
    }
    return this.makeRequest<ArgyleListResponse<ArgyleIncome>>(endpoint);
  }

  /**
   * Get a specific income record
   */
  async getIncome(incomeId: string): Promise<ArgyleIncome> {
    return this.makeRequest<ArgyleIncome>(`/incomes/${incomeId}`);
  }

  // ========================================
  // PAYSTUB DATA
  // ========================================

  /**
   * Get paystubs for a user
   */
  async getPaystubs(
    userId: string,
    options?: {
      accountId?: string;
      limit?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ArgyleListResponse<ArgylePaystub>> {
    const params = new URLSearchParams({ user: userId });

    if (options?.accountId) params.append('account', options.accountId);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.startDate) params.append('from_pay_date', options.startDate);
    if (options?.endDate) params.append('to_pay_date', options.endDate);

    return this.makeRequest<ArgyleListResponse<ArgylePaystub>>(`/paystubs?${params.toString()}`);
  }

  /**
   * Get a specific paystub
   */
  async getPaystub(paystubId: string): Promise<ArgylePaystub> {
    return this.makeRequest<ArgylePaystub>(`/paystubs/${paystubId}`);
  }

  // ========================================
  // IDENTITY DATA
  // ========================================

  /**
   * Get identities for a user
   */
  async getIdentities(userId: string, accountId?: string): Promise<ArgyleListResponse<ArgyleIdentity>> {
    let endpoint = `/identities?user=${userId}`;
    if (accountId) {
      endpoint += `&account=${accountId}`;
    }
    return this.makeRequest<ArgyleListResponse<ArgyleIdentity>>(endpoint);
  }

  /**
   * Get a specific identity
   */
  async getIdentity(identityId: string): Promise<ArgyleIdentity> {
    return this.makeRequest<ArgyleIdentity>(`/identities/${identityId}`);
  }
}

/**
 * Create an Argyle client instance with environment variables
 */
export function createArgyleClient(): ArgyleClient {
  const apiId = process.env.ARGYLE_API_ID;
  const apiSecret = process.env.ARGYLE_API_SECRET;
  const environment = (process.env.ARGYLE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

  if (!apiId || !apiSecret) {
    throw new Error('Missing Argyle API credentials. Set ARGYLE_API_ID and ARGYLE_API_SECRET.');
  }

  return new ArgyleClient({
    apiId,
    apiSecret,
    environment,
  });
}

/**
 * Create an Argyle client with custom config
 */
export function createArgyleClientWithConfig(config: ArgyleConfig): ArgyleClient {
  return new ArgyleClient(config);
}
