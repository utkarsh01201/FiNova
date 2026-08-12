import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, User, AlertCircle, ShieldAlert, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'USER' or 'ADMIN'
  const [isAdminMode, setIsAdminMode] = useState(location.pathname === '/admin-login');

  const [usernameOrEmailOrPhone, setUsernameOrEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsAdminMode(location.pathname === '/admin-login');
    setError('');
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(usernameOrEmailOrPhone, password);
      const user = res.data?.user;

      if (isAdminMode) {
        // Enforce Admin Role
        const isAdmin = user?.roles?.includes('ROLE_ADMIN');
        if (!isAdmin) {
          logout();
          setError(`Access Denied: Account '@${user?.username || 'user'}' does not possess Finova System Administrator privileges.`);
          return;
        }
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden select-none">
      {/* Background Ambient Glow */}
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
        isAdminMode ? 'bg-amber-500/10' : 'bg-teal-500/10'
      }`} />
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
        isAdminMode ? 'bg-red-500/15' : 'bg-indigo-500/10'
      }`} />

      <div className={`w-full max-w-md bg-slate-900/90 backdrop-blur-xl border rounded-3xl p-5 sm:p-8 shadow-2xl z-10 transition-all duration-300 ${
        isAdminMode ? 'border-amber-500/40 shadow-amber-500/10' : 'border-slate-800 shadow-teal-500/10'
      }`}>
        
        {/* Dual Portal Switch Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl mb-8">
          <button
            type="button"
            onClick={() => { setIsAdminMode(false); navigate('/login'); }}
            className={`py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-2 ${
              !isAdminMode
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>User Payment Portal</span>
          </button>

          <button
            type="button"
            onClick={() => { setIsAdminMode(true); navigate('/admin-login'); }}
            className={`py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-2 ${
              isAdminMode
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Admin Console</span>
          </button>
        </div>

        {/* Portal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-xl transition-all ${
            isAdminMode
              ? 'bg-gradient-to-tr from-amber-500 to-red-600 shadow-amber-500/30'
              : 'bg-gradient-to-tr from-teal-500 to-indigo-600 shadow-teal-500/20'
          }`}>
            {isAdminMode ? <KeyRound className="w-7 h-7 text-slate-950" /> : 'F'}
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {isAdminMode ? 'Finova Security Admin Console' : 'Sign In to Finova Pay'}
          </h1>
          <p className="text-xs text-slate-400">
            {isAdminMode
              ? 'System Administrator Authentication & Compliance Gate'
              : 'Manage your digital wallet & instant UPI payments'}
          </p>
        </div>

        {/* Admin Security Banner */}
        {isAdminMode && (
          <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 text-[11px] font-bold flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>Restricted Access: System Audit Logging Active</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold flex items-start space-x-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              {isAdminMode ? 'Administrator ID / Email' : 'Username, Email, or Phone'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={usernameOrEmailOrPhone}
                onChange={(e) => setUsernameOrEmailOrPhone(e.target.value)}
                required
                placeholder={isAdminMode ? "Enter admin ID or email" : "Enter username, email, or phone"}
                className={`w-full pl-10 pr-4 py-3 bg-slate-950 border rounded-xl text-white text-sm focus:outline-none transition ${
                  isAdminMode ? 'border-slate-800 focus:border-amber-500' : 'border-slate-800 focus:border-teal-500'
                }`}
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              {isAdminMode ? 'Administrator Passcode' : 'Password'}
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 bg-slate-950 border rounded-xl text-white text-sm focus:outline-none transition ${
                  isAdminMode ? 'border-slate-800 focus:border-amber-500' : 'border-slate-800 focus:border-teal-500'
                }`}
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 text-slate-950 font-extrabold rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm ${
              isAdminMode
                ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/25'
                : 'bg-teal-500 hover:bg-teal-400 shadow-teal-500/25'
            }`}
          >
            <LogIn className="w-5 h-5" />
            <span>{loading ? 'Authenticating...' : isAdminMode ? 'Authorize Admin Access' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-800/80">
          {!isAdminMode ? (
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-teal-400 font-bold hover:underline">
                Create Account
              </Link>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Need assistance?{' '}
              <Link to="/contact" className="text-amber-400 font-bold hover:underline">
                Contact Security Officer
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
