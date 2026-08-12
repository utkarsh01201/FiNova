import React, { useState, useEffect } from 'react';
import { Send, Search, Building2, Wallet as WalletIcon, Lock } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import UpiPinModal from './UpiPinModal';
import SetPinModal from './SetPinModal';

export default function SendMoneyModal({ isOpen, onClose, initialRecipient = '', onSuccess }) {
  const { user } = useAuth();
  const [recipient, setRecipient] = useState(initialRecipient);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentSource, setPaymentSource] = useState('WALLET'); // WALLET or BANK_UPI
  const [selectedBankId, setSelectedBankId] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // PIN Modals State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSetPinOpen, setIsSetPinOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRecipient(initialRecipient);
      setAmount('');
      setDescription('');
      setErrorMsg('');
      fetchBankAccounts();
    }
  }, [isOpen, initialRecipient]);

  const fetchBankAccounts = async () => {
    try {
      const res = await axiosClient.get('/bank/accounts');
      if (res.success && res.data && res.data.length > 0) {
        setBankAccounts(res.data);
        const primary = res.data.find(a => a.isPrimary) || res.data[0];
        setSelectedBankId(primary.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchRecipient = async (query) => {
    setRecipient(query);
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await axiosClient.get(`/users/search?q=${encodeURIComponent(query)}`);
      if (res.success && res.data) {
        setSearchResults(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    if (paymentSource === 'WALLET') {
      if (!user?.hasTransactionPin) {
        // User has not created a payment PIN yet
        setIsSetPinOpen(true);
        return;
      }
    } else if (paymentSource === 'BANK_UPI') {
      if (!selectedBankId) {
        setErrorMsg('Please select a linked bank account');
        return;
      }
    }

    // Trigger PIN verification keypad
    setIsPinModalOpen(true);
  };

  const handlePinSubmit = async (pin) => {
    setLoading(true);
    setErrorMsg('');

    try {
      if (paymentSource === 'WALLET') {
        const res = await axiosClient.post('/transactions/send', {
          recipientIdentifier: recipient,
          amount: parseFloat(amount),
          pin,
          description
        });

        if (res.success) {
          setIsPinModalOpen(false);
          onSuccess(res.data);
          onClose();
        }
      } else {
        const res = await axiosClient.post('/bank/upi-send', {
          bankAccountId: selectedBankId,
          recipientUpiOrIdentifier: recipient,
          amount: parseFloat(amount),
          upiPin: pin,
          description
        });

        if (res.success) {
          setIsPinModalOpen(false);
          onSuccess(res.data);
          onClose();
        }
      }
    } catch (err) {
      alert(err.message || 'Payment Failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Send className="w-5 h-5 text-teal-400" />
              <span>Send Payment</span>
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold leading-relaxed">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Recipient Input */}
            <div className="relative">
              <label className="text-xs font-bold text-slate-300 block mb-1">Recipient (UPI ID / Username / Phone)</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter recipient UPI ID, username, or phone"
                  value={recipient}
                  onChange={(e) => handleSearchRecipient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-10 max-h-40 overflow-y-auto divide-y divide-slate-800">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setRecipient(u.username);
                        setSearchResults([]);
                      }}
                      className="p-2.5 hover:bg-slate-800 cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{u.fullName}</p>
                        <p className="text-[10px] text-slate-400">@{u.username} • {u.phoneNumber}</p>
                      </div>
                      <span className="text-[10px] font-bold text-teal-400">Select</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentSource('WALLET')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                    paymentSource === 'WALLET'
                      ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <WalletIcon className="w-4 h-4" />
                  <span>Finova Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentSource('BANK_UPI')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                    paymentSource === 'BANK_UPI'
                      ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Bank UPI</span>
                </button>
              </div>
            </div>

            {/* Bank Account Selection if BANK_UPI */}
            {paymentSource === 'BANK_UPI' && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Select Source Bank</label>
                {bankAccounts.length === 0 ? (
                  <p className="text-xs text-amber-400 font-medium">No bank account linked. Link one under Bank & UPI tab.</p>
                ) : (
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} ({b.accountNumberMasked}) — {b.upiId}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-teal-400 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Description / Note */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Note (Optional)</label>
              <input
                type="text"
                placeholder="What is this payment for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Authorize with PIN'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Set PIN Modal if PIN not created */}
      <SetPinModal
        isOpen={isSetPinOpen}
        onClose={() => setIsSetPinOpen(false)}
        onSuccess={() => {
          setIsSetPinOpen(false);
          setIsPinModalOpen(true);
        }}
      />

      {/* Secret PIN Keypad Modal */}
      <UpiPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Authorize Payment"
        subtitle={`Sending ₹${amount} to ${recipient}`}
        loading={loading}
        onSubmit={handlePinSubmit}
      />
    </>
  );
}
