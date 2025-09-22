import { ethers } from 'ethers';

export interface CryptoPayment {
  id: string;
  userId: string;
  propertyId: string;
  amount: string;
  currency: 'ETH' | 'USDC' | 'USDT';
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  createdAt: number;
  confirmedAt?: number;
}

export interface PaymentRequest {
  userId: string;
  propertyId: string;
  amount: string;
  currency: 'ETH' | 'USDC' | 'USDT';
  recipientAddress: string;
  description?: string;
}

export class CryptoPaymentService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    // Initialize with Ethereum mainnet or testnet
    this.provider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'
    );
  }

  /**
   * Create a payment request for rent
   */
  static createPaymentRequest(params: PaymentRequest): {
    paymentId: string;
    qrCode: string;
    paymentAddress: string;
    amount: string;
    currency: string;
  } {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // For demo purposes - in production, generate unique addresses
    const paymentAddress = params.recipientAddress;

    // Create payment URL for QR code
    const paymentUrl = this.generatePaymentUrl(params);

    return {
      paymentId,
      qrCode: paymentUrl,
      paymentAddress,
      amount: params.amount,
      currency: params.currency
    };
  }

  /**
   * Generate payment URL for wallet apps
   */
  private static generatePaymentUrl(params: PaymentRequest): string {
    const baseUrl = 'ethereum:';
    const amount = ethers.parseEther(params.amount).toString();

    switch (params.currency) {
      case 'ETH':
        return `${baseUrl}${params.recipientAddress}?value=${amount}`;
      case 'USDC':
        // USDC contract address on Ethereum mainnet
        const usdcContract = '0xA0b86a33E6441009b9e8e22e07b2D27a5B4f7b34';
        return `${baseUrl}${usdcContract}/transfer?address=${params.recipientAddress}&uint256=${params.amount}`;
      case 'USDT':
        // USDT contract address on Ethereum mainnet
        const usdtContract = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
        return `${baseUrl}${usdtContract}/transfer?address=${params.recipientAddress}&uint256=${params.amount}`;
      default:
        return `${baseUrl}${params.recipientAddress}?value=${amount}`;
    }
  }

  /**
   * Verify a cryptocurrency transaction
   */
  async verifyTransaction(txHash: string): Promise<{
    isValid: boolean;
    amount?: string;
    from?: string;
    to?: string;
    blockNumber?: number;
    gasUsed?: string;
    status?: string;
  }> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!tx || !receipt) {
        return { isValid: false };
      }

      return {
        isValid: receipt.status === 1,
        amount: tx.value.toString(),
        from: tx.from,
        to: tx.to,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'confirmed' : 'failed'
      };
    } catch (error) {
      console.error('Transaction verification error:', error);
      return { isValid: false };
    }
  }

  /**
   * Get current gas price for transaction estimation
   */
  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.provider.getFeeData();
      return gasPrice.gasPrice?.toString() || '0';
    } catch (error) {
      console.error('Gas price fetch error:', error);
      return '0';
    }
  }

  /**
   * Estimate transaction cost
   */
  async estimateTransactionCost(
    to: string,
    amount: string,
    currency: 'ETH' | 'USDC' | 'USDT'
  ): Promise<{
    gasLimit: string;
    gasPrice: string;
    estimatedCost: string;
  }> {
    try {
      const gasPrice = await this.getGasPrice();
      let gasLimit: bigint;

      if (currency === 'ETH') {
        // Simple ETH transfer
        gasLimit = BigInt(21000);
      } else {
        // ERC20 token transfer (more gas required)
        gasLimit = BigInt(65000);
      }

      const estimatedCost = (gasLimit * BigInt(gasPrice)).toString();

      return {
        gasLimit: gasLimit.toString(),
        gasPrice,
        estimatedCost: ethers.formatEther(estimatedCost)
      };
    } catch (error) {
      console.error('Gas estimation error:', error);
      return {
        gasLimit: '21000',
        gasPrice: '0',
        estimatedCost: '0'
      };
    }
  }

  /**
   * Get supported cryptocurrencies with current prices
   */
  static getSupportedCurrencies(): Array<{
    symbol: string;
    name: string;
    icon: string;
    network: string;
    decimals: number;
  }> {
    return [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        icon: '⟠',
        network: 'Ethereum',
        decimals: 18
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        icon: '$',
        network: 'Ethereum',
        decimals: 6
      },
      {
        symbol: 'USDT',
        name: 'Tether',
        icon: '$',
        network: 'Ethereum',
        decimals: 6
      }
    ];
  }

  /**
   * Convert fiat amount to crypto amount (mock implementation)
   */
  static async convertFiatToCrypto(
    fiatAmount: number,
    currency: 'ETH' | 'USDC' | 'USDT'
  ): Promise<string> {
    // Mock conversion rates - in production, use real API
    const mockRates = {
      ETH: 2500, // $2500 per ETH
      USDC: 1, // $1 per USDC
      USDT: 1 // $1 per USDT
    };

    const rate = mockRates[currency];
    const cryptoAmount = fiatAmount / rate;

    return cryptoAmount.toFixed(currency === 'ETH' ? 8 : 6);
  }
}

export default CryptoPaymentService;