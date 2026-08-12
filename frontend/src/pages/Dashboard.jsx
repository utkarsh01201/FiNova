import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  PlusCircle, 
  Send, 
  HandCoins, 
  QrCode, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck,
  Building2,
  FileText,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function Dashboard({ onOpenAdd, onOpenSend, onOpenRequest, onOpenQr, onOpenReceipt }) {
  const { user, wallet, refreshWallet, showBalance, toggleShowBalance } = useAuth();
  const [recentTx, setRecentTx] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [primaryBank, setPrimaryBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [txRes, reqRes, bankRes] = await Promise.all([
        axiosClient.get('/transactions?page=0&size=5'),
        axiosClient.get('/requests?type=incoming&status=PENDING&page=0&size=5'),
        axiosClient.get('/bank/accounts')
      ]);

      if (txRes.success && txRes.data) {
        setRecentTx(txRes.data.content || []);
      }
      if (reqRes.success && reqRes.data) {
        setPendingRequests(reqRes.data.content || []);
      }
      if (bankRes.success && bankRes.data && bankRes.data.length > 0) {
        const found = bankRes.data.find(a => a.isPrimary) || bankRes.data[0];
        setPrimaryBank(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAcceptRequest = async (id) => {
    try {
      const res = await axiosClient.put(`/requests/${id}/accept`);
      if (res.success) {
        setToastMsg('Payment completed successfully!');
        await refreshWallet();
        await fetchDashboardData();
        setTimeout(() => setToastMsg(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      const res = await axiosClient.put(`/requests/${id}/reject`);
      if (res.success) {
        setToastMsg('Money request declined.');
        await fetchDashboardData();
        setTimeout(() => setToastMsg(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Failed to reject request');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMsg && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg('')} className="text-teal-400 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Greeting Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {getGreeting()}, <span className="gradient-text">{user?.fullName?.split(' ')[0]}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Finova Pay & UPI Dashboard</p>
        </div>

        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>KYC: <strong className="text-teal-400">{user?.kycStatus || 'VERIFIED'}</strong></span>
        </div>
      </div>

      {/* Hero Financial Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border border-slate-800 p-4 sm:p-8 shadow-2xl space-y-4 sm:space-y-6">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block">Finova Wallet Balance</span>
              <button
                onClick={toggleShowBalance}
                className="p-1 text-slate-400 hover:text-teal-400 transition"
                title={showBalance ? "Hide Balance" : "Show Balance"}
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl sm:text-5xl font-black text-white tracking-tight font-mono">
                {showBalance
                  ? `₹${Number(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                  : '₹ ••••••••'}
              </span>
              <span className="text-sm font-semibold text-slate-400">INR</span>
            </div>
          </div>

          {primaryBank && (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Primary Bank UPI</span>
                <p className="text-xs font-extrabold text-white">{primaryBank.bankName}</p>
                <p className="text-[10px] font-mono text-teal-400">{primaryBank.upiId}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <button
            onClick={onOpenAdd}
            className="py-3.5 px-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-teal-500/20 transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Money</span>
          </button>

          <button
            onClick={onOpenSend}
            className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition border border-slate-700 transform active:scale-95"
          >
            <Send className="w-4 h-4 text-teal-400" />
            <span>Pay / Transfer</span>
          </button>

          <button
            onClick={onOpenRequest}
            className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition border border-slate-700 transform active:scale-95"
          >
            <HandCoins className="w-4 h-4 text-indigo-400" />
            <span>Request Money</span>
          </button>

          <button
            onClick={onOpenQr}
            className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition border border-slate-700 transform active:scale-95"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Scan QR</span>
          </button>
        </div>
      </div>

      {/* Pending Incoming Money Requests */}
      {pendingRequests.length > 0 && (
        <div className="p-6 bg-slate-900/90 border border-indigo-500/30 rounded-3xl space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Clock className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Pending Payment Requests</h3>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">
                    {req.requesterFullName} <span className="text-slate-400 font-normal text-xs">(@{req.requesterUsername})</span>
                  </p>
                  <p className="text-xs text-slate-400">{req.description || 'Payment request'}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-base font-extrabold text-white">₹{req.amount}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl transition"
                    >
                      Pay Now
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 font-semibold text-xs rounded-xl border border-slate-700 transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Ledger Transactions */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-white">Recent Payment Transactions</h3>
          <span className="text-xs text-slate-400">Live Activity Ledger</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading activity...</div>
        ) : recentTx.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">No transactions recorded yet</div>
        ) : (
          <div className="space-y-3">
            {recentTx.map((tx) => {
              const isDebit = tx.senderUsername === user?.username;
              return (
                <div
                  key={tx.id}
                  className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-teal-500/30 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${isDebit ? 'bg-red-500/10 text-red-400' : 'bg-teal-500/10 text-teal-400'}`}>
                      {isDebit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {tx.type === 'ADD_MONEY'
                          ? 'Wallet Deposit'
                          : isDebit
                          ? `To: ${tx.receiverFullName || tx.receiverUsername}`
                          : `From: ${tx.senderFullName || tx.senderUsername}`}
                      </p>
                      <p className="text-xs text-slate-400">{tx.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`text-sm font-extrabold ${isDebit ? 'text-slate-300' : 'text-teal-400'}`}>
                        {isDebit ? '-' : '+'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>

                    <button
                      onClick={() => onOpenReceipt(tx.id)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition"
                      title="View Digital Receipt"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
