/**
 * Awardco API Client
 *
 * Official API Documentation: https://api.awardco.com
 * Base URL: https://api.awardco.com/api
 *
 * Authentication: API Key in request header
 */

const AWARDCO_API_BASE_URL = 'https://api.awardco.com/api';

export interface AwardcoConfig {
  apiKey: string;
  partnerId?: string;
}

export interface RecognitionRequest {
  recipients: string[]; // Array of employeeIds, emails, or usernames
  tags?: string[]; // Tags to attach to recognition
  recognitionProgramId?: number; // ID of recognition program
  recognitionProgramName?: string; // Name of recognition program (alternative to ID)
  giver?: string; // Giver's email/username (null = company bot)
  note: string; // Recognition note (API field name is "note", not "message")
  budgetName?: string; // Budget name if using allowable access budgets
  amount?: number; // Cash value in currency
}

export interface RewardRequest {
  recipients: string[]; // Array of employeeIds, emails, or usernames
  giver?: string; // Giver's email/username
  note: string; // Reward note (API field name is "note", not "message")
  amount: number; // Cash value in currency
  budgetName?: string; // Budget name
}

export interface UserBalanceRequest {
  employeeId?: string;
  email?: string;
  username?: string;
}

export interface UserBalanceResponse {
  success: boolean;
  balance: number;
  currency: string;
  userId: string;
}

export interface RecognitionResponse {
  success: boolean;
  recognitionId?: string;
  message?: string;
  error?: string;
}

export interface RewardResponse {
  success: boolean;
  rewardId?: string;
  message?: string;
  error?: string;
}

export interface ReportRequest {
  reportName: string;
  returnType?: 'json' | 'csv';
  timeRangeOption?: 'This Week' | 'This Month' | 'This Quarter' | 'This Year' | 'Last Week' | 'Last Month' | 'Last Quarter' | 'Last Year' | 'All Time' | 'Custom';
  startDate?: string; // ISO-8601 format
  endDate?: string; // ISO-8601 format
  includeRecordCount?: boolean;
  dataFilters?: Record<string, any>;
  contentColumns?: string[];
}

export class AwardcoClient {
  private apiKey: string;
  private partnerId?: string;

  constructor(config: AwardcoConfig) {
    this.apiKey = config.apiKey;
    this.partnerId = config.partnerId;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'apiKey': this.apiKey,
    };

    if (this.partnerId) {
      headers['X-Partner-Id'] = this.partnerId;
    }

    return headers;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${AWARDCO_API_BASE_URL}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Awardco API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Awardco API request failed:', error);
      throw error;
    }
  }

  /**
   * Create recognition for specified users
   * @see https://api.awardco.com/api/recognize
   */
  async createRecognition(request: RecognitionRequest): Promise<RecognitionResponse> {
    return this.makeRequest<RecognitionResponse>('/recognize', 'POST', request);
  }

  /**
   * Create a reward for specified users
   * @see https://api.awardco.com/api/reward
   */
  async createReward(request: RewardRequest): Promise<RewardResponse> {
    return this.makeRequest<RewardResponse>('/reward', 'POST', request);
  }

  /**
   * Bulk reward multiple users
   * @see https://api.awardco.com/api/bulk-reward
   */
  async bulkReward(requests: RewardRequest[]): Promise<RewardResponse[]> {
    return this.makeRequest<RewardResponse[]>('/bulk-reward', 'POST', { rewards: requests });
  }

  /**
   * Get user point balance
   * @see https://api.awardco.com/api/user-balance
   */
  async getUserBalance(request: UserBalanceRequest): Promise<UserBalanceResponse> {
    return this.makeRequest<UserBalanceResponse>('/user-balance', 'POST', request);
  }

  /**
   * Get recognition details report
   * @see https://api.awardco.com/api/reports/recognition-details/json
   */
  async getRecognitionDetails(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest<any>(`/reports/recognition-details/json${query}`);
  }

  /**
   * Get redemption details report
   * @see https://api.awardco.com/api/reports/redemption-details/json
   */
  async getRedemptionDetails(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest<any>(`/reports/redemption-details/json${query}`);
  }

  /**
   * Get custom report data
   * @see https://api.awardco.com/api/report-api
   */
  async getReport(request: ReportRequest): Promise<any> {
    return this.makeRequest<any>('/report-api', 'POST', request);
  }

  /**
   * Check if a user exists in Awardco
   * @see https://api.awardco.com/api/user-exists
   */
  async userExists(identifier: { employeeId?: string; email?: string; username?: string }): Promise<boolean> {
    const response = await this.makeRequest<{ exists: boolean }>('/user-exists', 'POST', identifier);
    return response.exists;
  }

  /**
   * Create a new user in Awardco
   * @see https://api.awardco.com/api/create-user
   */
  async createUser(userData: {
    employeeId: string;
    email: string;
    firstName: string;
    lastName: string;
    username?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    return this.makeRequest<any>('/create-user', 'POST', userData);
  }

  /**
   * Get social feed
   * @see https://api.awardco.com/api/social-feed
   */
  async getSocialFeed(limit?: number, offset?: number): Promise<any> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest<any>(`/social-feed${query}`);
  }

  /**
   * Activate a user in Awardco
   * @see https://api.awardco.com/api/activate-user
   */
  async activateUser(identifier: { employeeId?: string; email?: string; username?: string }): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest<{ success: boolean; message?: string }>('/activate-user', 'POST', identifier);
  }

  /**
   * Archive (deactivate) a user in Awardco
   * @see https://api.awardco.com/api/archive-user
   */
  async archiveUser(identifier: { employeeId?: string; email?: string; username?: string }): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest<{ success: boolean; message?: string }>('/archive-user', 'POST', identifier);
  }

  /**
   * Earn API - Award points automatically for specific activities
   * @see https://api.awardco.com/api/earn
   */
  async earnPoints(request: {
    recipient: string;
    earnProgramId?: number;
    earnProgramName?: string;
    amount: number;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; earnId?: string; message?: string }> {
    return this.makeRequest<{ success: boolean; earnId?: string; message?: string }>('/earn', 'POST', request);
  }

  /**
   * Get user details including balance and profile info
   * @see https://api.awardco.com/api/user
   */
  async getUser(identifier: { employeeId?: string; email?: string; username?: string }): Promise<{
    success: boolean;
    user?: {
      employeeId: string;
      email: string;
      firstName: string;
      lastName: string;
      balance: number;
      status: 'active' | 'inactive' | 'archived';
    };
  }> {
    return this.makeRequest<any>('/user', 'POST', identifier);
  }
}

/**
 * Create an Awardco client instance
 */
export function createAwardcoClient(config: AwardcoConfig): AwardcoClient {
  return new AwardcoClient(config);
}
