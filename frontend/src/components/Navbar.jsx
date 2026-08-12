import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, ShieldCheck, LogOut, Wallet, Eye, EyeOff, Fingerprint } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function Navbar({ onOpenNotifications, onLockApp }) {
  const { user, wallet, logout, showBalance, toggleShowBalance } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await axiosClient.get('/notifications/unread-count');
        if (res.success) {
          setUnreadCount(res.data || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Brand & Security Badge */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shadow-lg shadow-teal-500/20">
            F
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
            FIN<span className="gradient-text">OVA</span> <span className="text-[10px] sm:text-xs text-teal-400 font-mono hidden sm:inline">PAY & UPI</span>
          </span>
        </Link>
        
        <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>256-Bit Encrypted UPI System</span>
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Wallet Balance Badge with 1-Click Eye Toggle */}
        {wallet && (
          <div className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <Wallet className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-slate-400">Wallet:</span>
            <span className="text-sm font-bold text-teal-400 font-mono">
              {showBalance
                ? `₹${Number(wallet.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : '₹ ••••••••'}
            </span>
            <button
              onClick={toggleShowBalance}
              className="p-1 text-slate-400 hover:text-teal-400 transition"
              title={showBalance ? "Hide Balance" : "Show Balance"}
            >
              {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Biometric Fingerprint Lock Button */}
        <button
          onClick={onLockApp}
          className="p-2 sm:p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 transition flex items-center space-x-1"
          title="Lock App with Fingerprint"
        >
          <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
          <span className="text-[10px] font-bold hidden sm:inline">Lock</span>
        </button>

        {/* Notifications Icon */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-teal-500 text-slate-950 text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile Info */}
        <div className="flex items-center space-x-2 sm:space-x-3 pl-2 border-l border-slate-800">
          <Link to="/profile" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-sm group-hover:border-teal-400 transition">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-white group-hover:text-teal-400 transition">{user?.fullName}</p>
              <p className="text-[10px] text-slate-400">@{user?.username}</p>
            </div>
          </Link>

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
            title="Logout"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
