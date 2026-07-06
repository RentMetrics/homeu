import { http, createConfig } from 'wagmi';
import { mainnet, polygon, base, sepolia, baseSepolia, polygonAmoy } from 'wagmi/chains';
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo';

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, base, sepolia, baseSepolia, polygonAmoy],
  connectors: [
    metaMask(),
    coinbaseWallet({ appName: 'HomeU' }),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [polygonAmoy.id]: http(),
  },
});

// Chain configuration for the app
export const supportedChains = [
  {
    id: mainnet.id,
    name: 'Ethereum',
    network: 'mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
    gasEstimate: 'High ($5-50)',
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  {
    id: polygon.id,
    name: 'Polygon',
    network: 'polygon',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    isTestnet: false,
    gasEstimate: 'Low ($0.01-0.10)',
    usdcAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    usdtAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
  {
    id: base.id,
    name: 'Base',
    network: 'base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
    gasEstimate: 'Very Low ($0.001-0.01)',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    usdtAddress: null, // Not available on Base
  },
  {
    id: sepolia.id,
    name: 'Sepolia (Testnet)',
    network: 'sepolia',
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    isTestnet: true,
    gasEstimate: 'Free (testnet)',
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    usdtAddress: null,
  },
];

export const getChainById = (chainId: number) => {
  return supportedChains.find(chain => chain.id === chainId);
};

export const getTokenAddress = (chainId: number, token: 'USDC' | 'USDT') => {
  const chain = getChainById(chainId);
  if (!chain) return null;
  return token === 'USDC' ? chain.usdcAddress : chain.usdtAddress;
};
