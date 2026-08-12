import React, { useState, useEffect } from 'react';
import { Building2, Plus, CreditCard, CheckCircle2, ShieldCheck, Lock, Sparkles, Eye, EyeOff, ArrowDownLeft } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import UpiPinModal from '../components/UpiPinModal';

const POPULAR_BANKS = [
  { name: 'State Bank of India', color: 'from-blue-600 to-sky-900', code: 'SBIN', ifsc: 'SBIN0001234' },
  { name: 'HDFC Bank', color: 'from-blue-700 to-indigo-900', code: 'HDFC', ifsc: 'HDFC0001234' },
  { name: 'ICICI Bank', color: 'from-amber-600 to-orange-900', code: 'ICIC', ifsc: 'ICIC0001234' },
  { name: 'Axis Bank', color: 'from-pink-700 to-rose-950', code: 'UTIB', ifsc: 'UTIB0001234' },
  { name: 'Kotak Mahindra Bank', color: 'from-red-600 to-red-950', code: 'KKBK', ifsc: 'KKBK0001234' },
  { name: 'Bank of Baroda', color: 'from-orange-500 to-amber-900', code: 'BARB', ifsc: 'BARB0001234' }
];

export default function BankAccountsPage() {
  const { user, showBalance, toggleShowBalance } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Link Bank Form State
  const [bankName, setBankName] = useState(POPULAR_BANKS[0].name);
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState(POPULAR_BANKS[0].ifsc);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [upiHandle, setUpiHandle] = useState('');
  const [upiPin, setUpiPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check Balance State
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [verifiedBalances, setVerifiedBalances] = useState({});

  // Withdraw to Bank State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAccountId, setWithdrawAccountId] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawPinOpen, setIsWithdrawPinOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/bank/accounts');
      if (res.success && res.data) {
        setAccounts(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const openLinkModal = () => {
    setBankName(POPULAR_BANKS[0].name);
    setIfscCode(POPULAR_BANKS[0].ifsc);
    setAccountHolderName(user?.fullName || '');
    setUpiHandle(user?.username ? `${user.username}@finova` : '');
    setAccountNumber(Math.floor(100000000 + Math.random() * 900000000).toString());
    setUpiPin('');
    setErrorMsg('');
    setIsLinkModalOpen(true);
  };

  const handleBankSelect = (selectedName) => {
    setBankName(selectedName);
    const found = POPULAR_BANKS.find(b => b.name === selectedName);
    if (found) {
      setIfscCode(found.ifsc);
    }
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await axiosClient.post('/bank/link', {
        bankName,
        accountNumber,
        ifscCode: ifscCode.toUpperCase().trim(),
        accountHolderName,
        upiId: upiHandle.includes('@') ? upiHandle : `${upiHandle}@finova`,
        upiPin
      });

      if (res.success) {
        setIsLinkModalOpen(false);
        await fetchBankAccounts();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to link bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPrimary = async (accountId) => {
    try {
      const res = await axiosClient.put(`/bank/accounts/${accountId}/primary`);
      if (res.success) {
        await fetchBankAccounts();
      }
    } catch (err) {
      alert(err.message || 'Failed to set primary bank account');
    }
  };

  const handleCheckBalancePin = async (pin) => {
    setCheckingBalance(true);
    try {
      const res = await axiosClient.post('/bank/check-balance', {
        bankAccountId: selectedAccountId,
        upiPin: pin
      });

      if (res.success && res.data) {
        setVerifiedBalances(prev => ({
          ...prev,
          [selectedAccountId]: res.data.balance
        }));
        setIsPinModalOpen(false);
      }
    } catch (err) {
      alert(err.message || 'Incorrect UPI PIN');
    } finally {
      setCheckingBalance(false);
    }
  };

  const handleWithdrawPin = async (pin) => {
    setWithdrawing(true);
    try {
      const res = await axiosClient.post('/wallet/withdraw', {
        bankAccountId: withdrawAccountId,
        amount: parseFloat(withdrawAmount),
        upiPin: pin,
        description: `Wallet withdrawal to bank account`
      });

      if (res.success) {
        setIsWithdrawPinOpen(false);
        setIsWithdrawModalOpen(false);
        setWithdrawAmount('');
        setWithdrawSuccess('Withdrawal successful! Bank balance updated.');
        setTimeout(() => setWithdrawSuccess(''), 4000);
        await fetchBankAccounts();
      }
    } catch (err) {
      alert(err.message || 'Withdrawal failed. Check UPI PIN and wallet balance.');
    } finally {
      setWithdrawing(false);
    }
  };

  const getBankGradient = (name) => {
    const found = POPULAR_BANKS.find(b => name.toLowerCase().includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(name.toLowerCase()));
    return found ? found.color : 'from-slate-800 to-slate-900';
  };

  return (
    <div className="space-y-6">
      {withdrawSuccess && (
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm font-bold">
          ✅ {withdrawSuccess}
        </div>
      )}
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <Building2 className="w-7 h-7 text-teal-400" />
            <span>Linked Bank Accounts & UPI</span>
          </h1>
          <p className="text-xs text-slate-400">Manage your bank accounts, check live balance with UPI PIN, and set primary payment source</p>
        </div>

        <button
          onClick={openLinkModal}
          className="px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 flex items-center space-x-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Link New Bank Account</span>
        </button>
      </div>

      {/* Linked Accounts List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading bank accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Bank Accounts Linked</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Link your bank account to send and receive money instantly using your custom UPI ID</p>
          </div>
          <button
            onClick={openLinkModal}
            className="px-6 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs shadow-lg"
          >
            Link Account Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((acc) => {
            const hasVerifiedBalance = verifiedBalances[acc.id] !== undefined;

            return (
              <div
                key={acc.id}
                className={`relative rounded-3xl p-6 bg-gradient-to-br ${getBankGradient(acc.bankName)} border border-white/10 shadow-2xl space-y-6 overflow-hidden text-white transition hover:scale-[1.01]`}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-300">Bank Account</span>
                    <h3 className="text-lg font-black tracking-wide">{acc.bankName}</h3>
                  </div>

                  {acc.isPrimary ? (
                    <span className="px-3 py-1 rounded-full bg-teal-400 text-slate-950 text-[10px] font-extrabold flex items-center space-x-1 shadow-md">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>PRIMARY</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetPrimary(acc.id)}
                      className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold border border-white/20 transition"
                    >
                      Make Primary
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Account Number</span>
                  <p className="text-xl font-mono tracking-widest font-extrabold">{acc.accountNumberMasked}</p>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-medium">UPI Handle</span>
                      <span className="text-xs font-bold font-mono text-teal-200">{acc.upiId}</span>
                    </div>

                    {hasVerifiedBalance ? (
                      <div className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider block">Live Balance</span>
                          <button
                            onClick={toggleShowBalance}
                            className="p-0.5 text-slate-300 hover:text-white transition"
                            title={showBalance ? "Hide Balance" : "Show Balance"}
                          >
                            {showBalance ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                        <span className="text-xl font-extrabold text-white font-mono">
                          {showBalance
                            ? `₹${Number(verifiedBalances[acc.id]).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            : '₹ ••••••••'}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedAccountId(acc.id);
                          setIsPinModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center space-x-1.5 transition"
                      >
                        <Lock className="w-3.5 h-3.5 text-teal-300" />
                        <span>Check Balance</span>
                      </button>
                    )}
                  </div>

                  {/* Withdraw to Bank button */}
                  <button
                    onClick={() => {
                      setWithdrawAccountId(acc.id);
                      setWithdrawAmount('');
                      setIsWithdrawModalOpen(true);
                    }}
                    className="mt-3 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center justify-center space-x-2 transition"
                  >
                    <ArrowDownLeft className="w-4 h-4 text-teal-300" />
                    <span>Withdraw Wallet → Bank</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Withdraw to Bank Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <ArrowDownLeft className="w-5 h-5 text-teal-400" />
                <span>Withdraw Wallet → Bank</span>
              </h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-400">Transfer funds from your Finova Wallet to your linked bank account. Your UPI PIN is required to authorize.</p>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Withdrawal Amount (₹)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg font-mono font-bold text-teal-400 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[500, 1000, 2000, 5000, 10000, 25000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setWithdrawAmount(val.toString())}
                  className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs rounded-xl transition"
                >
                  ₹{val.toLocaleString()}
                </button>
              ))}
            </div>
            <button
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
              onClick={() => { if (withdrawAmount && parseFloat(withdrawAmount) > 0) setIsWithdrawPinOpen(true); }}
              className="w-full py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm transition shadow-lg flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Authorize Withdrawal</span>
            </button>
          </div>
        </div>
      )}

      {/* Link Bank Account Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-teal-400" />
                <span>Link Bank Account</span>
              </h3>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold leading-relaxed">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Select Bank</label>
                <select
                  value={bankName}
                  onChange={(e) => handleBankSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full name as on bank records"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="9-18 digits"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">IFSC Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SBIN0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">UPI ID Handle</label>
                <input
                  type="text"
                  required
                  placeholder="yourname@finova"
                  value={upiHandle}
                  onChange={(e) => setUpiHandle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Set 4-Digit Secret UPI PIN</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="••••"
                  value={upiPin}
                  onChange={(e) => setUpiPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-center tracking-widest text-teal-400 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-teal-500/20"
              >
                {submitting ? 'Linking Account...' : 'Link Bank & Activate UPI'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Check Balance UPI PIN Modal */}
      <UpiPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Verify UPI PIN"
        subtitle="Enter your 4-digit UPI PIN to view live bank balance"
        loading={checkingBalance}
        onSubmit={handleCheckBalancePin}
      />

      {/* Withdraw UPI PIN Modal */}
      <UpiPinModal
        isOpen={isWithdrawPinOpen}
        onClose={() => setIsWithdrawPinOpen(false)}
        title="Authorize Withdrawal"
        subtitle={`Withdraw ₹${withdrawAmount} from Wallet to Bank`}
        loading={withdrawing}
        onSubmit={handleWithdrawPin}
      />
    </div>
  );
}
