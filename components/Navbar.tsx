'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStellar } from '@/hooks/useStellar';
import { Wallet, Activity, History, LayoutDashboard, Home, Award } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { isConnected, address, connectWallet, disconnectWallet, isLoading } = useStellar();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Vendor Portal', href: '/app', icon: Award },
    { name: 'Events Feed', href: '/events', icon: Activity },
    { name: 'Tx History', href: '/transactions', icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <span className="font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Stellar<span className="text-indigo-400">Pay</span>
          </span>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-400'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          {isConnected && address ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end text-xs">
                <span className="font-mono text-zinc-300">
                  {address.slice(0, 6)}...{address.slice(-6)}
                </span>
                <span className="text-emerald-400 font-semibold">Connected</span>
              </div>
              <button
                onClick={disconnectWallet}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 hover:border-red-500/30 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-red-400 hover:bg-red-950/20 transition-all duration-200"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200"
            >
              <Wallet className="h-4 w-4" />
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="border-t border-zinc-800 md:hidden flex justify-around py-3 bg-zinc-950/90">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
