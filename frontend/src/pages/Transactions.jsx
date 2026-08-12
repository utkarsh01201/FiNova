import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Filter, ArrowUpRight, ArrowDownLeft, FileText, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function Transactions({ onOpenReceipt }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let url = `/transactions?page=${page}&size=10`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await axiosClient.get(url);
      if (res.success && res.data) {
        setTransactions(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Transaction History</h1>
          <p className="text-xs text-slate-400">Complete immutable ledger & receipt records</p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="bg-slate-900 border border-slate-800 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-500 mx-auto"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">No transactions match your filter criteria</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {transactions.map((tx) => {
              const isDebit = tx.senderUsername === user?.username;
              return (
                <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-slate-800/30 transition">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-2xl ${isDebit ? 'bg-red-500/10 text-red-400' : 'bg-teal-500/10 text-teal-400'}`}>
                      {isDebit ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {tx.type === 'ADD_MONEY'
                          ? 'Wallet Top-Up'
                          : isDebit
                          ? `Sent to ${tx.receiverFullName || tx.receiverUsername}`
                          : `Received from ${tx.senderFullName || tx.senderUsername}`}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{tx.description || tx.type}</p>
                      <span className="text-[10px] text-slate-500 font-mono">Ref: {tx.transactionReference}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`text-base font-extrabold ${isDebit ? 'text-slate-200' : 'text-teal-400'}`}>
                        {isDebit ? '-' : '+'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                        {tx.status}
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenReceipt(tx.id)}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 text-teal-400 rounded-xl border border-slate-800 transition"
                      title="Generate Official Receipt"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
            <span className="text-slate-400">Page {page + 1} of {totalPages}</span>
            <div className="flex space-x-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="p-2 bg-slate-900 rounded-lg text-slate-300 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 bg-slate-900 rounded-lg text-slate-300 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
