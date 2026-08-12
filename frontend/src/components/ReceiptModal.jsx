import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle, ShieldAlert, Download, FileText } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function ReceiptModal({ isOpen, onClose, transactionId }) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && transactionId) {
      const fetchReceipt = async () => {
        setLoading(true);
        setError('');
        try {
          const res = await axiosClient.get(`/transactions/${transactionId}/receipt`);
          if (res.success) {
            setReceipt(res.data);
          }
        } catch (err) {
          setError(err.message || 'Failed to generate receipt');
        } finally {
          setLoading(false);
        }
      };
      fetchReceipt();
    }
  }, [isOpen, transactionId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Bar */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
            <FileText className="w-4 h-4" />
            <span>Digital Payment Receipt</span>
          </div>
          <div className="flex items-center space-x-2">
            {receipt && (
              <button
                onClick={handlePrint}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs text-center">
              {error}
            </div>
          ) : receipt ? (
            <div id="printable-receipt" className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-wide">
                    FIN<span className="text-teal-400">OVA</span>
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Ref: {receipt.transactionReference}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 font-bold text-xs rounded-full inline-flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{receipt.status}</span>
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">{new Date(receipt.timestamp).toLocaleString()}</p>
                </div>
              </div>

              {/* Amount Display */}
              <div className="text-center py-4 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Transferred Amount</span>
                <span className="text-3xl font-extrabold text-white gradient-text">
                  ₹{Number(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-500 block mt-1">{receipt.type}</span>
              </div>

              {/* Sender & Receiver Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Sender</span>
                  <p className="font-bold text-white mt-1">{receipt.senderName}</p>
                  <p className="text-slate-400 text-[10px]">@{receipt.senderUsername}</p>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Receiver</span>
                  <p className="font-bold text-white mt-1">{receipt.receiverName}</p>
                  <p className="text-slate-400 text-[10px]">@{receipt.receiverUsername}</p>
                </div>
              </div>

              {/* Description */}
              {receipt.description && (
                <div className="text-xs text-slate-300">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Note</span>
                  <p className="p-2.5 bg-slate-900/30 rounded-lg border border-slate-800/50 italic">{receipt.description}</p>
                </div>
              )}

              {/* Official Verification Seal */}
              <div className="pt-4 border-t border-slate-800/80 text-[10px] text-teal-400 bg-teal-500/5 p-3 rounded-xl border border-teal-500/20 flex items-center space-x-2 font-semibold">
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-teal-400" />
                <span>{receipt.disclaimer || "Official Finova Instant Payment Receipt. Encrypted & Verified."}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
