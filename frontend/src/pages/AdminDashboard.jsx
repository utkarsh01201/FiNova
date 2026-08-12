import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, ArrowLeftRight, AlertTriangle, CheckCircle, Ban } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, usersRes] = await Promise.all([
        axiosClient.get('/admin/analytics'),
        axiosClient.get('/admin/users?page=0&size=20')
      ]);

      if (analyticsRes.success) {
        setAnalytics(analyticsRes.data);
      }
      if (usersRes.success && usersRes.data) {
        setUsersList(usersRes.data.content || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await axiosClient.put(`/admin/users/${userId}/status?status=${newStatus}`);
      if (res.success) {
        await fetchAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            <span>Admin Management Console</span>
          </h1>
          <p className="text-xs text-slate-400">System oversight, user account controls, and fraud metrics</p>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
          <div className="flex justify-between items-center text-teal-400">
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Users</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{analytics?.totalUsers || 0}</p>
          <span className="text-[10px] text-slate-400">{analytics?.activeUsers || 0} Active Accounts</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
          <div className="flex justify-between items-center text-indigo-400">
            <ArrowLeftRight className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Virtual Money Moved</span>
          </div>
          <p className="text-2xl font-extrabold text-white">
            ₹{Number(analytics?.totalVirtualMoneyTransferred || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">{analytics?.totalTransactions || 0} Total Transactions</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
          <div className="flex justify-between items-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Fraud Risk Alerts</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{analytics?.highRiskFraudAlerts || 0}</p>
          <span className="text-[10px] text-slate-400">High Risk ML Detections</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
          <div className="flex justify-between items-center text-red-400">
            <Ban className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Blocked Transactions</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{analytics?.blockedTransactions || 0}</p>
          <span className="text-[10px] text-slate-400">Security Rule Enforcements</span>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Registered User Directory</h3>

        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading user accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email / Phone</th>
                  <th className="p-3">KYC Status</th>
                  <th className="p-3">Account Standing</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <p className="font-bold text-white">{u.fullName}</p>
                      <p className="text-[10px] text-slate-400">@{u.username}</p>
                    </td>
                    <td className="p-3">
                      <p>{u.email}</p>
                      <p className="text-[10px] text-slate-500">{u.phoneNumber}</p>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-bold text-[10px]">
                        {u.kycStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        u.status === 'ACTIVE' ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`px-3 py-1 rounded-xl font-bold text-xs transition ${
                          u.status === 'ACTIVE'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                            : 'bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
