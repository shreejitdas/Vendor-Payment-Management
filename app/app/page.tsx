'use client';

import { useEffect, useState } from 'react';
import { useStellar } from '@/hooks/useStellar';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/useToast';
import {
  prepareContractCall,
  signAndSubmitTransaction,
  rpcServer,
  horizonServer,
  CONTRACT_ID,
  NETWORK_PASSPHRASE,
  HORIZON_URL,
} from '@/lib/stellar';
import * as StellarSdk from '@stellar/stellar-sdk';
import { Award, FileText, CheckCircle2, XCircle, Clock, Send, HelpCircle, Loader2 } from 'lucide-react';

interface InvoiceData {
  id: number;
  vendor: string;
  amount: number;
  token: string;
  description: string;
  dueDate: number;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
}

interface VendorData {
  address: string;
  name: string;
  isActive: boolean;
}

export default function VendorPortal() {
  const { isConnected, address, balance, refreshBalance } = useStellar();
  const { addTransaction, updateTransactionStatus } = useTransactions();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Forms State
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const [payerAddress, setPayerAddress] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDesc, setInvDesc] = useState('');
  const [invDueDate, setInvDueDate] = useState('');
  const [createInvLoading, setCreateInvLoading] = useState(false);

  // Live Data State
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Native testnet token address
  const nativeTokenAddress = 'CAS3J7CYGL4TR65ZP5T2HNTC76HGPN3J2I6ZPPB75PH3WJDUBG6762A3'; // Wrapped XLM standard on testnet

  // Fetch admin and contract state
  const checkAdminStatus = async () => {
    if (!address) {
      setIsAdmin(false);
      setCheckingAdmin(false);
      return;
    }
    try {
      // Build simulation transaction source account
      const txSource = await horizonServer.loadAccount(address);
      const contract = new StellarSdk.Contract(CONTRACT_ID);

      const tx = new StellarSdk.TransactionBuilder(txSource, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call('get_admin'))
        .setTimeout(30)
        .build();

      const sim = await rpcServer.simulateTransaction(tx);
      if (!StellarSdk.rpc.Api.isSimulationError(sim) && sim.result?.retval) {
        const adminVal = StellarSdk.scValToNative(sim.result.retval);
        setIsAdmin(adminVal === address);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const fetchContractData = async () => {
    if (!isConnected || !address) return;
    setDataLoading(true);
    try {
      const txSource = await horizonServer.loadAccount(address);
      const contract = new StellarSdk.Contract(CONTRACT_ID);

      // Query invoice count
      const txCount = new StellarSdk.TransactionBuilder(txSource, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call('get_invoice_count'))
        .setTimeout(30)
        .build();

      const simCount = await rpcServer.simulateTransaction(txCount);
      if (!StellarSdk.rpc.Api.isSimulationError(simCount) && simCount.result?.retval) {
        const count = Number(StellarSdk.scValToNative(simCount.result.retval));
        
        const fetchedInvoices: InvoiceData[] = [];
        for (let i = 1; i <= count; i++) {
          const txInv = new StellarSdk.TransactionBuilder(txSource, {
            fee: '100',
            networkPassphrase: NETWORK_PASSPHRASE,
          })
            .addOperation(contract.call('get_invoice', StellarSdk.nativeToScVal(i, { type: 'u64' })))
            .setTimeout(30)
            .build();

          const simInv = await rpcServer.simulateTransaction(txInv);
          if (!StellarSdk.rpc.Api.isSimulationError(simInv) && simInv.result?.retval) {
            const inv = StellarSdk.scValToNative(simInv.result.retval);
            if (inv) {
              const statusMap = ['Pending', 'Approved', 'Paid', 'Rejected'] as const;
              fetchedInvoices.push({
                id: Number(inv.id),
                vendor: inv.vendor,
                amount: Number(inv.amount),
                token: inv.token,
                description: inv.description,
                dueDate: Number(inv.due_date),
                status: statusMap[Number(inv.status)],
              });
            }
          }
        }
        setInvoices(fetchedInvoices);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      toast('Fetch Failed', 'Could not sync invoice states from the ledger.', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
    fetchContractData();
  }, [isConnected, address]);

  // Actions
  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorAddress || !vendorName || !address) return;
    setRegLoading(true);

    try {
      const args = [
        StellarSdk.nativeToScVal(new StellarSdk.Address(vendorAddress)),
        StellarSdk.nativeToScVal(vendorName, { type: 'string' }),
      ];

      const tx = await prepareContractCall(address, 'register_vendor', args);

      toast('Pending Transaction', 'Signing vendor registration request...', 'info');
      const { hash } = await signAndSubmitTransaction(tx, 'Freighter');
      addTransaction(hash, 'Vendor Registration');
      
      toast('Success', `Vendor "${vendorName}" successfully registered on-chain!`, 'success');
      updateTransactionStatus(hash, 'SUCCESS');
      setVendorAddress('');
      setVendorName('');
      fetchContractData();
    } catch (err: any) {
      console.error(err);
      toast('Transaction Failed', err.message || 'Vendor registration failed.', 'error');
    } finally {
      setRegLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invAmount || !invDesc || !address) return;
    setCreateInvLoading(true);

    try {
      const amountNative = Math.round(parseFloat(invAmount) * 10000000); // 7 decimals for XLM/Stellar Asset
      const dueDateVal = invDueDate ? Math.floor(new Date(invDueDate).getTime() / 1000) : 0;

      const args = [
        StellarSdk.nativeToScVal(new StellarSdk.Address(address)), // Vendor
        StellarSdk.nativeToScVal(amountNative, { type: 'i128' }),
        StellarSdk.nativeToScVal(new StellarSdk.Address(nativeTokenAddress)), // Token
        StellarSdk.nativeToScVal(invDesc, { type: 'string' }),
        StellarSdk.nativeToScVal(dueDateVal, { type: 'u64' }),
      ];

      const tx = await prepareContractCall(address, 'create_invoice', args);

      toast('Pending Transaction', 'Signing invoice creation request...', 'info');
      const { hash } = await signAndSubmitTransaction(tx, 'Freighter');
      addTransaction(hash, 'Create Invoice');
      
      toast('Success', 'Invoice successfully registered and pending approval!', 'success');
      updateTransactionStatus(hash, 'SUCCESS');
      setInvAmount('');
      setInvDesc('');
      setInvDueDate('');
      fetchContractData();
    } catch (err: any) {
      console.error(err);
      toast('Transaction Failed', err.message || 'Invoice creation failed.', 'error');
    } finally {
      setCreateInvLoading(false);
    }
  };

  const handleApproveInvoice = async (invoiceId: number) => {
    if (!address) return;
    setActionLoadingId(invoiceId);

    try {
      const args = [StellarSdk.nativeToScVal(invoiceId, { type: 'u64' })];
      const tx = await prepareContractCall(address, 'approve_invoice', args);

      toast('Signing', 'Signing approval transaction...', 'info');
      const { hash } = await signAndSubmitTransaction(tx, 'Freighter');
      addTransaction(hash, `Approve Invoice #${invoiceId}`);

      toast('Approved', `Invoice #${invoiceId} approved successfully!`, 'success');
      updateTransactionStatus(hash, 'SUCCESS');
      fetchContractData();
    } catch (err: any) {
      console.error(err);
      toast('Approval Failed', err.message || 'Invoice approval failed.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectInvoice = async (invoiceId: number) => {
    if (!address) return;
    setActionLoadingId(invoiceId);

    try {
      const args = [StellarSdk.nativeToScVal(invoiceId, { type: 'u64' })];
      const tx = await prepareContractCall(address, 'reject_invoice', args);

      toast('Signing', 'Signing rejection transaction...', 'info');
      const { hash } = await signAndSubmitTransaction(tx, 'Freighter');
      addTransaction(hash, `Reject Invoice #${invoiceId}`);

      toast('Rejected', `Invoice #${invoiceId} rejected.`, 'success');
      updateTransactionStatus(hash, 'SUCCESS');
      fetchContractData();
    } catch (err: any) {
      console.error(err);
      toast('Rejection Failed', err.message || 'Invoice rejection failed.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePayInvoice = async (invoice: InvoiceData) => {
    if (!address) return;
    setActionLoadingId(invoice.id);

    try {
      // Check user balance first
      const xlmBal = parseFloat(balance);
      if (xlmBal < invoice.amount / 10000000) {
        throw new Error('Insufficient balance to complete the payment.');
      }

      const args = [
        StellarSdk.nativeToScVal(invoice.id, { type: 'u64' }),
        StellarSdk.nativeToScVal(new StellarSdk.Address(address)), // Payer
      ];

      const tx = await prepareContractCall(address, 'pay_invoice', args);

      toast('Signing', 'Signing payment authorization...', 'info');
      const { hash } = await signAndSubmitTransaction(tx, 'Freighter');
      addTransaction(hash, `Pay Invoice #${invoice.id}`);

      toast('Payment Settled', `Invoice #${invoice.id} settled successfully!`, 'success');
      updateTransactionStatus(hash, 'SUCCESS');
      refreshBalance();
      fetchContractData();
    } catch (err: any) {
      console.error(err);
      toast('Payment Failed', err.message || 'Invoice payment failed.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Render components
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Vendor Management Portal</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Draft payment requests, manage registered vendor profiles, and authorize invoice settlements.
        </p>
      </div>

      {!isConnected ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-12 text-center max-w-xl mx-auto space-y-4">
          <HelpCircle className="h-12 w-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Wallet Not Connected</h3>
          <p className="text-xs text-zinc-400">
            Please connect your Stellar testnet wallet using the button in the navigation header to load the application forms and invoice tables.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Side Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Vendor Registration Form (Admin-only) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-400" />
                Register Vendor Profile
              </h2>
              <p className="text-xs text-zinc-400">
                {isAdmin ? 'Add a new corporate vendor profile on-chain.' : 'Only the administrator/owner can register vendor profiles.'}
              </p>

              <form onSubmit={handleRegisterVendor} className="space-y-3">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Vendor Address</label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin || regLoading}
                    value={vendorAddress}
                    onChange={(e) => setVendorAddress(e.target.value)}
                    placeholder="G..."
                    className="w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-150 placeholder-zinc-600 focus:outline-none focus:border-indigo-650 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Vendor Name</label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin || regLoading}
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    className="w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-150 placeholder-zinc-600 focus:outline-none focus:border-indigo-650 disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!isAdmin || regLoading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {regLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Register Vendor'}
                </button>
              </form>
            </div>

            {/* Create Invoice Form (Vendor-only) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                Draft Payment Invoice
              </h2>
              <p className="text-xs text-zinc-400">
                Submit a payment request invoice. The account signing must be a registered active vendor.
              </p>

              <form onSubmit={handleCreateInvoice} className="space-y-3">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Amount (XLM)</label>
                  <input
                    type="number"
                    step="0.0000001"
                    required
                    disabled={createInvLoading}
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-150 placeholder-zinc-600 focus:outline-none focus:border-indigo-650"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    required
                    disabled={createInvLoading}
                    value={invDesc}
                    onChange={(e) => setInvDesc(e.target.value)}
                    placeholder="e.g. June Office Supplies"
                    className="w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-150 placeholder-zinc-600 focus:outline-none focus:border-indigo-650"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Due Date</label>
                  <input
                    type="date"
                    disabled={createInvLoading}
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-150 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={createInvLoading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-55 flex items-center justify-center gap-1.5"
                >
                  {createInvLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create Invoice'}
                </button>
              </form>
            </div>
          </div>

          {/* Invoices List Panel */}
          <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Payment Requests</h2>
              <span className="text-[10px] font-bold rounded-full bg-zinc-800 px-2 py-1 text-zinc-400">
                {invoices.length} Invoices
              </span>
            </div>

            {dataLoading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
                <span className="text-xs text-zinc-400 block font-medium">Syncing contract ledger...</span>
              </div>
            ) : invoices.length === 0 ? (
              <div className="py-20 text-center space-y-2 border border-dashed border-zinc-800 rounded-lg">
                <FileText className="h-8 w-8 text-zinc-700 mx-auto" />
                <h4 className="text-sm font-semibold text-zinc-300">No Invoices Available</h4>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Registered active vendors can generate invoices using the panel forms.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">ID</th>
                      <th className="py-3 px-2">Description</th>
                      <th className="py-3 px-2">Vendor</th>
                      <th className="py-3 px-2 text-right">Amount</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 text-xs">
                    {invoices.map((inv) => {
                      const isPending = inv.status === 'Pending';
                      const isApproved = inv.status === 'Approved';
                      const isPaid = inv.status === 'Paid';
                      const isRejected = inv.status === 'Rejected';

                      return (
                        <tr key={inv.id} className="hover:bg-zinc-900/30 transition-colors">
                          <td className="py-3 px-2 font-mono text-zinc-400 font-bold">#{inv.id}</td>
                          <td className="py-3 px-2 font-medium text-white">{inv.description}</td>
                          <td className="py-3 px-2 font-mono text-zinc-500 text-[10px]">
                            {inv.vendor.slice(0, 4)}...{inv.vendor.slice(-4)}
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-zinc-150">
                            {(inv.amount / 10000000).toFixed(2)} XLM
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPaid
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30'
                                  : isApproved
                                  ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/30'
                                  : isRejected
                                  ? 'bg-rose-950 text-rose-400 border border-rose-900/30'
                                  : 'bg-amber-950 text-amber-400 border border-amber-900/30'
                              }`}
                            >
                              {isPaid && <CheckCircle2 className="h-3 w-3" />}
                              {isApproved && <Send className="h-3 w-3" />}
                              {isRejected && <XCircle className="h-3 w-3" />}
                              {isPending && <Clock className="h-3 w-3" />}
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex justify-end gap-1.5">
                              {/* Admin Actions */}
                              {isPending && isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleApproveInvoice(inv.id)}
                                    disabled={actionLoadingId !== null}
                                    className="px-2 py-1 rounded bg-indigo-650 hover:bg-indigo-550 text-[10px] font-semibold text-white transition-all disabled:opacity-40"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectInvoice(inv.id)}
                                    disabled={actionLoadingId !== null}
                                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-red-950/20 hover:text-red-400 hover:border hover:border-red-900/30 text-[10px] font-semibold text-zinc-300 transition-all disabled:opacity-40"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {/* Payer Action */}
                              {isApproved && (
                                <button
                                  onClick={() => handlePayInvoice(inv)}
                                  disabled={actionLoadingId !== null}
                                  className="px-2 py-1 rounded bg-emerald-650 hover:bg-emerald-550 text-[10px] font-semibold text-white transition-all disabled:opacity-40 flex items-center gap-1"
                                >
                                  {actionLoadingId === inv.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    'Pay'
                                  )}
                                </button>
                              )}

                              {!isPending && !isApproved && (
                                <span className="text-[10px] text-zinc-650 font-bold uppercase tracking-wider">Settled</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
