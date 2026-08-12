import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet as WalletIcon, PlusCircle, RefreshCw, Key, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function WalletPage({ onOpenAdd }) {
  const { wallet, refreshWallet, showBalance, toggleShowBalance } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Finova Digital Wallet</h1>
          <p className="text-xs text-slate-400">Manage digital balance & wallet configurations</p>
        </div>
        <button
          onClick={refreshWallet}
          className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition"
          title="Refresh Balance"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Main Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Available Wallet Balance</span>
              <button
                onClick={toggleShowBalance}
                className="p-1 text-slate-400 hover:text-teal-400 transition"
                title={showBalance ? "Hide Balance" : "Show Balance"}
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="px-3 py-1 bg-teal-500/10 text-teal-400 text-xs font-bold rounded-full border border-teal-500/20">
              {wallet?.status || 'ACTIVE'}
            </span>
          </div>

          <div>
            <span className="text-5xl font-black text-white tracking-tight font-mono">
              {showBalance
                ? `₹${Number(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : '₹ ••••••••'}
            </span>
            <span className="text-sm text-slate-400 ml-2 font-bold">{wallet?.currency || 'INR'}</span>
          </div>

          <button
            onClick={onOpenAdd}
            className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-teal-500/20 transition flex items-center justify-center space-x-2 text-sm"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add Funds to Wallet</span>
          </button>
        </div>

        {/* Metadata Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Key className="w-4 h-4 text-teal-400" />
            <span>Security Parameters</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block font-bold">WALLET UUID</span>
              <span className="font-mono text-teal-400 break-all">{wallet?.walletUuid}</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block font-bold">ACCOUNT STANDING</span>
              <span className="font-semibold text-teal-400">{wallet?.status}</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block font-bold font-mono">PROVISIONED DATE</span>
              <span className="text-slate-300">{new Date(wallet?.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
