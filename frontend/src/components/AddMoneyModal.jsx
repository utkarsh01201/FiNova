import React, { useState, useEffect } from 'react';
import { PlusCircle, CreditCard, Building2, ShieldCheck, Wallet as WalletIcon, Lock } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import UpiPinModal from './UpiPinModal';

export default function AddMoneyModal({ isOpen, onClose, onSuccess }) {
  const { refreshWallet } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentOption, setPaymentOption] = useState('BANK_UPI'); // BANK_UPI, CARD, NETBANKING
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setErrorMsg('');
      fetchUserBanks();
    }
  }, [isOpen]);

  const fetchUserBanks = async () => {
    try {
      const res = await axiosClient.get('/bank/accounts');
      if (res.success && res.data && res.data.length > 0) {
        setBankAccounts(res.data);
        const primary = res.data.find(a => a.isPrimary) || res.data[0];
        setSelectedBankId(primary.id);
        setPaymentOption('BANK_UPI');
      } else {
        setPaymentOption('CARD');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickAdd = (val) => {
    setAmount(val.toString());
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    if (paymentOption === 'BANK_UPI') {
      if (!selectedBankId) {
        setErrorMsg('Please select a linked bank account or link one in the Bank & UPI tab.');
        return;
      }
      setIsPinModalOpen(true);
    } else {
      executeDirectDeposit('Card / NetBanking Deposit');
    }
  };

  const executeDirectDeposit = async (sourceDesc) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await axiosClient.post('/wallet/add-money', {
        amount: parseFloat(amount),
        paymentSourceDescription: sourceDesc
      });

      if (res.success) {
        await refreshWallet();
        onSuccess(`Added ₹${amount} to wallet balance via ${sourceDesc}!`);
        setAmount('');
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpiPinSubmit = async (pin) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const bank = bankAccounts.find(b => b.id === Number(selectedBankId));
      const bankNameStr = bank ? bank.bankName : 'Linked Bank';

      // One-step: deposit from bank account with UPI PIN — backend verifies PIN & deducts bank balance atomically
      const res = await axiosClient.post('/wallet/add-money', {
        amount: parseFloat(amount),
        bankAccountId: Number(selectedBankId),
        upiPin: pin,
        paymentSourceDescription: `UPI Top-Up via ${bankNameStr}`
      });

      if (res.success) {
        setIsPinModalOpen(false);
        await refreshWallet();
        onSuccess(`Added ₹${amount} to wallet from ${bankNameStr}!`);
        setAmount('');
        onClose();
      }
    } catch (err) {
      alert(err.message || 'Incorrect UPI PIN or insufficient bank balance');
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
              <PlusCircle className="w-5 h-5 text-teal-400" />
              <span>Add Money to Wallet</span>
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold leading-relaxed">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Enter Amount (₹)</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg font-mono font-bold text-teal-400 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Quick Amount Preset */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Quick Amount Preset</label>
              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2000, 5000, 10000, 25000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAdd(val)}
                    className="py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs rounded-xl transition"
                  >
                    +₹{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Source Options */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">Select Deposit Payment Source</label>
              <div className="space-y-2">
                {/* Option 1: Linked Bank UPI */}
                <div
                  onClick={() => bankAccounts.length > 0 && setPaymentOption('BANK_UPI')}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    paymentOption === 'BANK_UPI'
                      ? 'bg-teal-500/10 border-teal-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Linked Bank Account (UPI)</p>
                      <p className="text-[10px] text-slate-400">Direct instant transfer with UPI PIN</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    checked={paymentOption === 'BANK_UPI'}
                    onChange={() => setPaymentOption('BANK_UPI')}
                    className="accent-teal-500"
                  />
                </div>

                {/* Bank dropdown if UPI selected */}
                {paymentOption === 'BANK_UPI' && (
                  <div className="pl-4 pt-1">
                    {bankAccounts.length === 0 ? (
                      <p className="text-[11px] text-amber-400">No bank account linked. Link one under Bank & UPI tab to enable UPI deposits.</p>
                    ) : (
                      <select
                        value={selectedBankId}
                        onChange={(e) => setSelectedBankId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
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

                {/* Option 2: Debit / Credit Card */}
                <div
                  onClick={() => setPaymentOption('CARD')}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    paymentOption === 'CARD'
                      ? 'bg-teal-500/10 border-teal-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Debit / Credit Card</p>
                      <p className="text-[10px] text-slate-400">Visa, Mastercard, RuPay Cards</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    checked={paymentOption === 'CARD'}
                    onChange={() => setPaymentOption('CARD')}
                    className="accent-teal-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !amount}
              className="w-full py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{loading ? 'Processing Deposit...' : paymentOption === 'BANK_UPI' ? 'Proceed with UPI PIN' : 'Add Funds Now'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Secret UPI PIN Keypad Modal */}
      <UpiPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Authorize UPI Wallet Deposit"
        subtitle={`Top-Up ₹${amount} from Linked Bank`}
        loading={loading}
        onSubmit={handleUpiPinSubmit}
      />
    </>
  );
}
