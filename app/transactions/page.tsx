'use client';

import { useTransactions } from '@/hooks/useTransactions';
import { useStellar } from '@/hooks/useStellar';
import { History, ExternalLink, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';

export default function TransactionHistory() {
  const { isConnected } = useStellar();
  const { transactions, clearHistory } = useTransactions();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Transaction History</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Monitor and track your contract interactions, hashes, and real-time execution statuses.
          </p>
        </div>
        {transactions.length > 0 && (
          <button
            onClick={clearHistory}
            className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 rounded-lg px-3 py-1.5 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Logs
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-12 text-center space-y-4">
          <History className="h-12 w-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Wallet Connection Required</h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Connect your wallet using the button in the header to view your transaction execution log.
          </p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-20 text-center space-y-2 border border-dashed border-zinc-800 rounded-lg">
          <History className="h-8 w-8 text-zinc-700 mx-auto" />
          <h4 className="text-sm font-semibold text-zinc-300">No Operations Recorded</h4>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Transactions signed and submitted via the Vendor Portal will be listed here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/20">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/30 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Operation</th>
                  <th className="py-3.5 px-4">Tx Hash</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-xs text-zinc-300">
                {transactions.map((tx) => {
                  const isSuccess = tx.status === 'SUCCESS';
                  const isFailed = tx.status === 'FAILED';
                  const isPending = tx.status === 'PENDING';

                  return (
                    <tr key={tx.hash} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="py-4 px-4 font-semibold text-white">{tx.type}</td>
                      <td className="py-4 px-4 font-mono text-[10px] text-zinc-550">
                        {tx.hash.slice(0, 12)}...{tx.hash.slice(-12)}
                      </td>
                      <td className="py-4 px-4 text-zinc-400">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isSuccess
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/20'
                              : isFailed
                              ? 'bg-rose-950 text-rose-400 border border-rose-900/20'
                              : 'bg-indigo-950 text-indigo-400 border border-indigo-900/20 animate-pulse'
                          }`}
                        >
                          {isSuccess && <CheckCircle className="h-3 w-3" />}
                          {isFailed && <XCircle className="h-3 w-3" />}
                          {isPending && <Clock className="h-3 w-3" />}
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-indigo-400 transition-colors font-semibold text-zinc-400"
                        >
                          Details
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
