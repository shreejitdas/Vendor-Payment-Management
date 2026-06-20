'use client';

import { useEvents } from '@/hooks/useEvents';
import { useStellar } from '@/hooks/useStellar';
import { Terminal, Award, FileText, CheckCircle2, XCircle, DollarSign, Loader2 } from 'lucide-react';

export default function EventsFeed() {
  const { isConnected } = useStellar();
  const { events, isLoading, error } = useEvents(5000); // Poll every 5s

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'register':
        return <Award className="h-4.5 w-4.5 text-indigo-400" />;
      case 'create':
        return <FileText className="h-4.5 w-4.5 text-amber-400" />;
      case 'approve':
        return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />;
      case 'reject':
        return <XCircle className="h-4.5 w-4.5 text-rose-400" />;
      case 'pay':
        return <DollarSign className="h-4.5 w-4.5 text-emerald-400" />;
      default:
        return <Terminal className="h-4.5 w-4.5 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Contract Events Feed</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time ledger events pulled directly from our Vendor Payment Soroban smart contract.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Live Polling Active
        </div>
      </div>

      {!isConnected ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-12 text-center space-y-4">
          <Terminal className="h-12 w-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Wallet Connection Required</h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Connect your wallet to enable real-time event streaming from the Stellar blockchain.
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-800 bg-rose-950/20 p-6 text-sm text-rose-200">
          <span className="font-semibold block">Event Sync Error:</span>
          <p className="mt-1 text-xs opacity-90">{error}</p>
        </div>
      ) : isLoading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
          <span className="text-xs text-zinc-400 block font-medium">Syncing contract events...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center space-y-2 border border-dashed border-zinc-800 rounded-lg">
          <Terminal className="h-8 w-8 text-zinc-700 mx-auto" />
          <h4 className="text-sm font-semibold text-zinc-300">No Events Found</h4>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Interact with the contract (e.g. register a vendor, create an invoice) to trigger and log ledger events.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 overflow-hidden divide-y divide-zinc-850">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="p-4 flex items-start gap-4 hover:bg-zinc-900/30 transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                {getEventIcon(evt.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{evt.details}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="font-mono text-[10px] bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-850">
                    ID: {evt.id.slice(0, 8)}...
                  </span>
                  {evt.walletAddress && (
                    <span className="font-mono text-[10px]">
                      Caller: {evt.walletAddress.slice(0, 6)}...{evt.walletAddress.slice(-6)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
