/**
 * Coinbase Commerce Integration
 *
 * This handles the "receiving end" problem for property managers.
 * Residents pay in crypto → Coinbase converts → PM receives USD
 *
 * Flow:
 * 1. Create a charge for the rent amount
 * 2. Resident pays in crypto (ETH, USDC, USDT, etc.)
 * 3. Coinbase converts to USD and deposits to PM's bank
 * 4. HomeU collects $5 fee separately
 */

interface CreateChargeParams {
  renterId: string;
  propertyId: string;
  propertyManagerId: string;
  rentAmount: number;
  homeuFee: number;
  month: string;
  description?: string;
}

interface CoinbaseCharge {
  id: string;
  code: string;
  name: string;
  description: string;
  hosted_url: string;
  created_at: string;
  expires_at: string;
  confirmed_at?: string;
  pricing: {
    local: { amount: string; currency: string };
    ethereum?: { amount: string; currency: string };
    usdc?: { amount: string; currency: string };
    polygon?: { amount: string; currency: string };
  };
  addresses: {
    ethereum?: string;
    usdc?: string;
    polygon?: string;
  };
  timeline: Array<{
    status: string;
    time: string;
  }>;
  metadata: Record<string, string>;
}

interface ChargeResponse {
  success: boolean;
  charge?: CoinbaseCharge;
  error?: string;
}

export class CoinbaseCommerceService {
  private apiKey: string;
  private baseUrl = 'https://api.commerce.coinbase.com';

  constructor() {
    this.apiKey = process.env.COINBASE_COMMERCE_API_KEY || '';
  }

  /**
   * Create a charge for rent payment
   * The total will include rent + HomeU fee
   */
  async createRentCharge(params: CreateChargeParams): Promise<ChargeResponse> {
    const totalAmount = params.rentAmount + params.homeuFee;

    // For demo/development without API key
    if (!this.apiKey || this.apiKey === 'demo') {
      return this.createMockCharge(params, totalAmount);
    }

    try {
      const response = await fetch(`${this.baseUrl}/charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CC-Api-Key': this.apiKey,
          'X-CC-Version': '2018-03-22',
        },
        body: JSON.stringify({
          name: `Rent Payment - ${params.month}`,
          description: params.description || `Rent payment for ${params.month} via HomeU`,
          pricing_type: 'fixed_price',
          local_price: {
            amount: totalAmount.toFixed(2),
            currency: 'USD',
          },
          metadata: {
            renterId: params.renterId,
            propertyId: params.propertyId,
            propertyManagerId: params.propertyManagerId,
            rentAmount: params.rentAmount.toString(),
            homeuFee: params.homeuFee.toString(),
            month: params.month,
          },
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/rent?payment=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/rent?payment=cancelled`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Failed to create charge' };
      }

      const data = await response.json();
      return { success: true, charge: data.data };
    } catch (error) {
      console.error('Coinbase Commerce error:', error);
      return { success: false, error: 'Failed to connect to payment provider' };
    }
  }

  /**
   * Get charge status
   */
  async getCharge(chargeId: string): Promise<ChargeResponse> {
    if (!this.apiKey || this.apiKey === 'demo') {
      return { success: false, error: 'Demo mode - no real charges' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/charges/${chargeId}`, {
        headers: {
          'X-CC-Api-Key': this.apiKey,
          'X-CC-Version': '2018-03-22',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      const data = await response.json();
      return { success: true, charge: data.data };
    } catch (error) {
      console.error('Coinbase Commerce error:', error);
      return { success: false, error: 'Failed to fetch charge' };
    }
  }

  /**
   * Mock charge for demo/development
   */
  private createMockCharge(params: CreateChargeParams, totalAmount: number): ChargeResponse {
    const chargeId = `charge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const code = chargeId.toUpperCase().substring(0, 8);

    const now = new Date();
    const expires = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

    return {
      success: true,
      charge: {
        id: chargeId,
        code,
        name: `Rent Payment - ${params.month}`,
        description: params.description || `Rent payment for ${params.month} via HomeU`,
        hosted_url: `https://commerce.coinbase.com/charges/${code}`,
        created_at: now.toISOString(),
        expires_at: expires.toISOString(),
        pricing: {
          local: { amount: totalAmount.toFixed(2), currency: 'USD' },
          ethereum: { amount: (totalAmount / 2500).toFixed(8), currency: 'ETH' },
          usdc: { amount: totalAmount.toFixed(2), currency: 'USDC' },
        },
        addresses: {
          ethereum: '0x742d35Cc6634C0532925a3b844Bc9e7595f86789',
          usdc: '0x742d35Cc6634C0532925a3b844Bc9e7595f86789',
        },
        timeline: [
          { status: 'NEW', time: now.toISOString() },
        ],
        metadata: {
          renterId: params.renterId,
          propertyId: params.propertyId,
          propertyManagerId: params.propertyManagerId,
          rentAmount: params.rentAmount.toString(),
          homeuFee: params.homeuFee.toString(),
          month: params.month,
        },
      },
    };
  }
}

/**
 * Webhook handler types for Coinbase Commerce events
 */
export interface CoinbaseWebhookEvent {
  id: string;
  type: 'charge:created' | 'charge:confirmed' | 'charge:failed' | 'charge:pending';
  api_version: string;
  created_at: string;
  data: CoinbaseCharge;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export default CoinbaseCommerceService;
