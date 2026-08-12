import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Wallet, 
  Building2,
  ArrowLeftRight, 
  HandCoins, 
  User, 
  ShieldCheck,
  QrCode,
  MessageSquare,
  Gamepad2
} from 'lucide-react';

export default function Sidebar({ onOpenQr }) {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Finova Wallet', path: '/wallet', icon: Wallet },
    { name: 'Bank & UPI', path: '/bank', icon: Building2 },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Money Requests', path: '/requests', icon: HandCoins },
    { name: 'Profile & KYC', path: '/profile', icon: User },
    { name: 'Contact Us', path: '/contact', icon: MessageSquare },
  ];

  const gameItem = { name: '🎰 Lucky Spin Game', path: '/games', icon: Gamepad2 };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-61px)]">
      <div className="space-y-6">
        {/* Quick QR Payment Scan Button */}
        <button
          onClick={onOpenQr}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 transition transform active:scale-95"
        >
          <QrCode className="w-5 h-5" />
          <span>Scan / Show QR</span>
        </button>

        {/* Navigation Links */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Games Section */}
        <div className="pt-2 border-t border-slate-800/80">
          <p className="px-3 text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-2">🎮 Games & Rewards</p>
          <NavLink
            to={gameItem.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-transparent'
              }`
            }
          >
            <gameItem.icon className="w-5 h-5" />
            <span>{gameItem.name}</span>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold border border-yellow-500/30">WIN ₹</span>
          </NavLink>
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <div className="space-y-1 pt-4 border-t border-slate-800/80">
            <p className="px-3 text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-2">Administration</p>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-slate-900'
                }`
              }
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Admin Console</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 text-center">
        <p className="text-[11px] font-semibold text-slate-400">Finova Pay & UPI v2.0</p>
        <p className="text-[10px] text-teal-400 mt-0.5 font-bold">Secure Payments Platform</p>
      </div>
    </aside>
  );
}
