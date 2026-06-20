import { create } from 'zustand';
import { getXlmBalance } from '@/lib/stellar';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';

interface StellarState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  network: string;
  error: string | null;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
}

export const useStellar = create<StellarState>((set, get) => ({
  isConnected: false,
  address: null,
  balance: '0',
  network: 'Testnet',
  error: null,
  isLoading: false,

  connectWallet: async () => {
    set({ isLoading: true, error: null });
    try {
      // Prompt wallet connection modal statically
      const { address } = await StellarWalletsKit.authModal();
      
      // Fetch balance
      const balance = await getXlmBalance(address);

      set({
        address,
        isConnected: true,
        balance,
        isLoading: false,
        error: null,
      });
    } catch (walletError: any) {
      console.error('Wallet connection error:', walletError);
      let userFriendlyMsg = 'Could not retrieve address from wallet.';
      if (
        walletError?.message?.includes('closed') || 
        walletError?.message?.includes('User closed') || 
        walletError?.message?.includes('user closed')
      ) {
        userFriendlyMsg = 'Wallet connection modal was closed by the user.';
      } else if (
        walletError?.message?.includes('not installed') || 
        walletError?.message?.includes('install')
      ) {
        userFriendlyMsg = 'Selected wallet is not installed. Please install Freighter or Albedo first.';
      } else if (walletError?.message) {
        userFriendlyMsg = walletError.message;
      }
      set({ error: userFriendlyMsg, isLoading: false });
    }
  },

  disconnectWallet: async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (err) {
      console.error('Error during wallet disconnect:', err);
    }
    set({
      isConnected: false,
      address: null,
      balance: '0',
      error: null,
    });
  },

  refreshBalance: async () => {
    const { address } = get();
    if (!address) return;
    try {
      const balance = await getXlmBalance(address);
      set({ balance });
    } catch (err) {
      console.error('Refresh balance failed:', err);
    }
  },

  clearError: () => set({ error: null }),
}));
