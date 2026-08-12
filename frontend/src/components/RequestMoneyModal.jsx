import React, { useState } from 'react';
import { X, HandCoins, AlertCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function RequestMoneyModal({ isOpen, onClose, onSuccess }) {
  const [payer, setPayer] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axiosClient.post('/requests', {
        payerIdentifier: payer,
        amount: parseFloat(amount),
        description
      });
      if (res.success) {
        onSuccess(res.message || 'Payment request sent successfully!');
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to create payment request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-teal-500/10 to-indigo-500/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl">
              <HandCoins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Request Money</h3>
              <p className="text-xs text-slate-400">Send a payment request to a contact</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Payer (UPI ID, Username, or Phone)</label>
            <input
              type="text"
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
              required
              placeholder="Enter payer UPI ID, username, or phone"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Requested Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-lg focus:outline-none focus:border-teal-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Note (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this request for?"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !payer || !amount}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-teal-500/20 transition disabled:opacity-50 text-sm"
          >
            {loading ? 'Sending Request...' : `Send Request for ₹${amount || '0'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
