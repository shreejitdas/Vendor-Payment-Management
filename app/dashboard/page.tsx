'use client';

import { useStellar } from '@/hooks/useStellar';
import { Wallet, Globe, Coins, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function Dashboard() {
  const {
    isConnected,
    address,
    balance,
    network,
    error,
    isLoading,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    clearError,
  } = useStellar();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Wallet Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your Stellar wallet accounts, check balances, and diagnose network settings.
        </p>
      </div>

      {/* Error Callout */}
      {error && (
        <div className="rounded-lg bg-rose-950/40 border border-rose-800 p-4 text-sm text-rose-200 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Wallet Integration Alert:</span> {error}
          </div>
          <button onClick={clearError} className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Wallet Status Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isConnected ? 'bg-emerald-600/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Connection Status</h2>
              <p className="text-xs text-zinc-500">Stellar Ecosystem Wallet</p>
            </div>
          </div>

          {isConnected && address ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-zinc-950 border border-zinc-850 p-4">
                <span className="text-xs text-zinc-500 font-semibold block">Public Key</span>
                <span className="font-mono text-xs text-indigo-400 font-semibold select-all break-all block mt-1">
                  {address}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={disconnectWallet}
                  className="flex-1 rounded-lg border border-zinc-700 hover:border-red-500/30 py-2 text-sm font-semibold text-zinc-300 hover:text-red-400 hover:bg-red-950/10 transition-all"
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Connect your Stellar wallet to interact with registered vendors, draft invoices, and sign transactions.
              </p>
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-semibold text-white shadow-lg transition-all"
              >
                {isLoading ? 'Connecting Wallet...' : 'Connect Wallet'}
              </button>
            </div>
          )}
        </div>

        {/* Network & Balances Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Network & Balance</h2>
                <p className="text-xs text-zinc-500">Stellar Testnet Node</p>
              </div>
            </div>
            {isConnected && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-zinc-950 border border-zinc-850 p-4">
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Network</span>
                <span className="font-semibold text-sm text-white block mt-1">{network}</span>
              </div>
              <div className="rounded-lg bg-zinc-950 border border-zinc-850 p-4">
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Asset</span>
                <span className="font-semibold text-sm text-white block mt-1">XLM (Native)</span>
              </div>
            </div>

            <div className="rounded-lg bg-zinc-950 border border-zinc-850 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 font-semibold block">Available Balance</span>
                <span className="font-bold text-2xl text-white block mt-1">
                  {parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  <span className="text-zinc-500 text-xs font-semibold ml-1.5">XLM</span>
                </span>
              </div>
              <Coins className="h-8 w-8 text-indigo-400/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          Required Stellar Wallets Setup
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Ensure you have a Stellar browser extension wallet installed. We recommend installing the 
          <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-semibold underline mx-1">Freighter Wallet</a> 
          or using 
          <a href="https://albedo.link/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-semibold underline mx-1">Albedo</a>. 
          Make sure your wallet network is set to <strong className="text-zinc-300">Testnet</strong>. If your account is newly created, you can obtain testnet XLM using the Friendbot funder under the developer options in your wallet or using the Stellar Lab.
        </p>
      </div>
    </div>
  );
}
