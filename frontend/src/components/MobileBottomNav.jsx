import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Building2, User, QrCode, Gamepad2 } from 'lucide-react';

export default function MobileBottomNav({ onOpenQr }) {
  const navItems = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Bank', path: '/bank', icon: Building2 },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 flex items-center justify-around shadow-2xl">
      {/* Home Tab */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center space-y-1 transition ${
            isActive ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </NavLink>

      {/* Wallet Tab */}
      <NavLink
        to="/wallet"
        className={({ isActive }) =>
          `flex flex-col items-center space-y-1 transition ${
            isActive ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <Wallet className="w-5 h-5" />
        <span className="text-[10px]">Wallet</span>
      </NavLink>

      {/* Central Glowing Floating Scan & Pay Button */}
      <button
        onClick={onOpenQr}
        className="-mt-6 p-3.5 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 text-white font-extrabold shadow-xl shadow-teal-500/30 border-4 border-slate-950 transition transform active:scale-95 flex flex-col items-center justify-center"
      >
        <QrCode className="w-6 h-6" />
      </button>

      {/* Bank Tab */}
      <NavLink
        to="/bank"
        className={({ isActive }) =>
          `flex flex-col items-center space-y-1 transition ${
            isActive ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <Building2 className="w-5 h-5" />
        <span className="text-[10px]">Bank</span>
      </NavLink>

      {/* Games Tab */}
      <NavLink
        to="/games"
        className={({ isActive }) =>
          `flex flex-col items-center space-y-1 transition ${
            isActive ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-purple-300'
          }`
        }
      >
        <Gamepad2 className="w-5 h-5" />
        <span className="text-[10px]">🎰 Game</span>
      </NavLink>
    </div>
  );
}
