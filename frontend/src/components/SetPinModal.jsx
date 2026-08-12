import React, { useState } from 'react';
import { Lock, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function SetPinModal({ isOpen, onClose, onSuccess }) {
  const { refreshProfile } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setErrorMsg('PINs do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await axiosClient.post('/users/pin', { pin });
      if (res.success) {
        await refreshProfile();
        onSuccess('Secret Payment PIN configured successfully!');
        setPin('');
        setConfirmPin('');
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to set PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Payment PIN</h3>
              <p className="text-[11px] text-slate-400">Mandatory for all wallet & UPI payments</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Set 4-Digit Secret PIN</label>
            <input
              type="password"
              required
              maxLength={6}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg text-center tracking-widest text-teal-400 font-mono focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Confirm Secret PIN</label>
            <input
              type="password"
              required
              maxLength={6}
              placeholder="••••"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg text-center tracking-widest text-teal-400 font-mono focus:outline-none focus:border-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || pin.length < 4 || confirmPin.length < 4}
            className="w-full py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Saving PIN...' : 'Save & Activate PIN'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
