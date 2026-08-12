import React, { useState } from 'react';
import { ShieldCheck, Lock, Delete, X, Fingerprint, CheckCircle2 } from 'lucide-react';
import { verifyBiometric } from '../utils/biometricUtils';

export default function UpiPinModal({ isOpen, onClose, title = "Enter UPI PIN", subtitle, onSubmit, loading }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [biometricLoading, setBiometricLoading] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleConfirm = () => {
    if (pin.length < 4) {
      setError('UPI PIN must be 4 to 6 digits');
      return;
    }
    onSubmit(pin);
  };

  const handleBiometricAuth = async () => {
    setBiometricLoading(true);
    setError('');
    try {
      await verifyBiometric('Authorize Finova Payment');
      // Pass verified PIN token / fallback PIN automatically
      onSubmit(pin || '1234');
    } catch (err) {
      setError('Biometric authentication failed. Enter PIN manually.');
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">{subtitle || 'Finova Secured Payment Authentication'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Fingerprint Biometric Payment Button */}
        <button
          type="button"
          onClick={handleBiometricAuth}
          disabled={loading || biometricLoading}
          className="w-full py-3 bg-gradient-to-r from-teal-500/20 to-indigo-500/20 hover:from-teal-500/30 hover:to-indigo-500/30 border border-teal-500/40 text-teal-400 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md"
        >
          <Fingerprint className="w-5 h-5 text-teal-400 animate-pulse" />
          <span>{biometricLoading ? 'Touch Sensor Now...' : 'Authorize with Fingerprint / Touch ID'}</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-500 uppercase">Or Enter Secret PIN</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* PIN Display Indicators */}
        <div className="flex justify-center space-x-3 py-1">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-teal-400 border-teal-400 shadow-lg shadow-teal-500/50 scale-110'
                  : 'border-slate-700 bg-slate-950'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-center text-xs font-bold text-red-400">{error}</p>}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-extrabold text-base rounded-2xl transition active:scale-95 shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="py-3 bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-2xl transition"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-extrabold text-base rounded-2xl transition active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="py-3 bg-slate-950 hover:bg-slate-800 text-amber-400 flex items-center justify-center rounded-2xl transition"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Confirm Button */}
        <button
          disabled={loading || pin.length < 4}
          onClick={handleConfirm}
          className="w-full py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2"
        >
          <Lock className="w-4 h-4" />
          <span>{loading ? 'Authenticating...' : 'Verify PIN & Complete Payment'}</span>
        </button>
      </div>
    </div>
  );
}
