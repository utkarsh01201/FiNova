import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldCheck, CheckCircle2, KeyRound } from 'lucide-react';
import { verifyBiometric } from '../utils/biometricUtils';

export default function AppLockOverlay({ isLocked, onUnlock }) {
  const [authenticating, setAuthenticating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isLocked) return null;

  const handleFingerprintTouch = async () => {
    setAuthenticating(true);
    setErrorMsg('');

    try {
      await verifyBiometric('Unlock Finova App');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAuthenticating(false);
        onUnlock();
      }, 700);
    } catch (err) {
      setErrorMsg('Fingerprint not recognized. Touch sensor again.');
      setAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-8 text-center animate-fade-in select-none">
      {/* Top Brand */}
      <div className="pt-8 space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-teal-500/30 mx-auto">
          F
        </div>
        <h2 className="text-2xl font-black text-white tracking-wide">FIN<span className="gradient-text">OVA</span></h2>
        <p className="text-xs text-slate-400 font-medium">Secured with Biometric Fingerprint Lock</p>
      </div>

      {/* Center Interactive Fingerprint Sensor */}
      <div className="space-y-6 flex flex-col items-center">
        <div
          onClick={handleFingerprintTouch}
          className={`relative p-8 rounded-full border-2 transition transform active:scale-95 cursor-pointer shadow-2xl ${
            success
              ? 'bg-teal-500/20 border-teal-400 text-teal-400 shadow-teal-500/40'
              : authenticating
              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 animate-pulse'
              : 'bg-slate-900 border-teal-500/40 text-teal-400 hover:border-teal-400 shadow-teal-500/20'
          }`}
        >
          <div className="absolute inset-0 rounded-full bg-teal-500/10 animate-ping pointer-events-none opacity-40" />

          {success ? (
            <CheckCircle2 className="w-20 h-20 text-teal-400 animate-bounce" />
          ) : (
            <Fingerprint className="w-20 h-20 text-teal-400" />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-white">
            {success ? 'Fingerprint Matched!' : authenticating ? 'Scanning Biometrics...' : 'Touch Fingerprint Sensor'}
          </p>
          <p className="text-xs text-slate-400 max-w-xs">
            {success ? 'Unlocking Finova...' : 'Tap sensor above to unlock your wallet application'}
          </p>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 font-bold bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Bottom Passcode Fallback */}
      <div className="pb-6 space-y-4">
        <button
          onClick={handleFingerprintTouch}
          className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-teal-400 hover:bg-slate-800 transition flex items-center space-x-2 shadow-lg mx-auto"
        >
          <Fingerprint className="w-4 h-4" />
          <span>Use Phone Biometrics / Touch ID</span>
        </button>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 font-semibold">
          <ShieldCheck className="w-4 h-4 text-teal-500" />
          <span>Hardware Level Security Active</span>
        </div>
      </div>
    </div>
  );
}
