import { useEffect, useState } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import { rpcServer, CONTRACT_ID } from '@/lib/stellar';

export interface DecodedEvent {
  id: string;
  type: string; // 'register', 'create', 'approve', 'reject', 'pay'
  timestamp: number;
  walletAddress: string;
  details: string;
}

export function useEvents(pollIntervalMs = 5000) {
  const [events, setEvents] = useState<DecodedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timeoutId: NodeJS.Timeout;
    let lastPolledLedger: number | null = null;

    const poll = async () => {
      try {
        const latestLedgerResponse = await rpcServer.getLatestLedger();
        const latestLedger = latestLedgerResponse.sequence;

        // Start polling from 5000 ledgers back if we don't have a start ledger
        const startLedger = lastPolledLedger ? lastPolledLedger : Math.max(1, latestLedger - 5000);

        const response = await rpcServer.getEvents({
          startLedger,
          filters: [
            {
              type: 'contract',
              contractIds: [CONTRACT_ID],
            },
          ],
          limit: 50,
        });

        if (!active) return;

        // Parse and decode events
        const decodedEvents: DecodedEvent[] = response.events.map((evt) => {
          let eventType = 'unknown';
          let details = 'Action performed';
          let walletAddress = '';

          try {
            // Decode topics
            const topics = evt.topic.map((t) => StellarSdk.scValToNative(t));
            const val = StellarSdk.scValToNative(evt.value);

            if (topics[0] === 'vendor' && topics[1] === 'register') {
              eventType = 'register';
              const [vendorAddr, vendorName] = val;
              walletAddress = vendorAddr;
              details = `Vendor Registered: "${vendorName}"`;
            } else if (topics[0] === 'invoice') {
              const action = topics[1];
              eventType = action;
              if (action === 'create') {
                const [invId, vendorAddr, amount, token] = val;
                walletAddress = vendorAddr;
                details = `Invoice #${invId} created by vendor for ${(amount / 10000000).toFixed(2)} XLM`;
              } else if (action === 'approve') {
                const invId = val;
                details = `Invoice #${invId} approved by Admin`;
              } else if (action === 'reject') {
                const invId = val;
                details = `Invoice #${invId} rejected by Admin`;
              } else if (action === 'pay') {
                const [invId, payerAddr] = val;
                walletAddress = payerAddr;
                details = `Invoice #${invId} paid by payer`;
              }
            }
          } catch (decodeErr) {
            console.error('Error decoding event:', decodeErr);
          }

          return {
            id: evt.id,
            type: eventType,
            timestamp: Date.now(), // Approximate as RPC doesn't guarantee exact block timestamp in event response
            walletAddress,
            details,
          };
        });

        if (decodedEvents.length > 0) {
          setEvents((prev) => {
            // Filter duplicates
            const existingIds = new Set(prev.map((e) => e.id));
            const newEvents = decodedEvents.filter((e) => !existingIds.has(e.id));
            return [...newEvents, ...prev].slice(0, 100); // limit to 100
          });
        }

        lastPolledLedger = latestLedger;
        setError(null);
      } catch (err: any) {
        console.error('Error polling events:', err);
        setError(err.message || 'Failed to poll events');
      } finally {
        if (active) {
          setIsLoading(false);
          timeoutId = setTimeout(poll, pollIntervalMs);
        }
      }
    };

    poll();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [pollIntervalMs]);

  return { events, isLoading, error };
}
