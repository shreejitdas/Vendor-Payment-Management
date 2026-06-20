'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Coins, Layers } from 'lucide-react';

export default function Home() {
  const stats = [
    { label: 'Network status', value: 'Testnet Active' },
    { label: 'Payment processing', value: '< 5 seconds' },
    { label: 'Smart contract layer', value: 'Soroban WASM' },
  ];

  const features = [
    {
      title: 'Decentralized Trust',
      description: 'Vendor registry and invoices are immutably stored in the contract state, preventing payment manipulation.',
      icon: ShieldCheck,
    },
    {
      title: 'Instant Settlements',
      description: 'Routing payment invoices directly transfers XLM/token balances into the vendor\'s wallet within seconds.',
      icon: Zap,
    },
    {
      title: 'Stellar Assets Integration',
      description: 'Enables invoice settlement using native Stellar XLM and SEP-41 compliant tokens.',
      icon: Coins,
    },
    {
      title: 'Audit & Event Streams',
      description: 'Real-time blockchain events guarantee transparency by keeping an active ledger log of all contract actions.',
      icon: Layers,
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-3xl text-center py-12">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
            Soroban Smart Contract Powering Payments
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            Vendor Payment <span className="text-indigo-500">Management</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Register corporate vendors, issue decentralized invoices, and execute secure automated settlements directly on the Stellar Testnet.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              Enter App Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
            >
              Verify Wallet <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm"
          >
            <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Architected for Speed & Trust</h2>
          <p className="text-sm text-zinc-400">
            Leveraging Stellar\'s fast consensus mechanism and Soroban\'s advanced WebAssembly virtual machine.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-zinc-700/50 p-6 transition-all duration-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contract info card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Deployed Contract Address</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Verify operations, view events, or inspect contract code on-chain.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="font-mono text-xs rounded bg-zinc-950 border border-zinc-850 px-2 py-1.5 text-indigo-400 font-semibold select-all break-all">
                CCZ7V5MMCOAYACWPWW6QPCWSVMHQHUQWAQ4YMGC3MJEVIKLVOKPIOVYM
              </span>
            </div>
          </div>
          <Link
            href="https://stellar.expert/explorer/testnet/contract/CCZ7V5MMCOAYACWPWW6QPCWSVMHQHUQWAQ4YMGC3MJEVIKLVOKPIOVYM"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-zinc-700 hover:border-zinc-500 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-all"
          >
            Inspect on Explorer
          </Link>
        </div>
      </div>
    </div>
  );
}
