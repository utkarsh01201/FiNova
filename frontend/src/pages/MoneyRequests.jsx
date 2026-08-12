import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HandCoins, PlusCircle, Check, X, Clock, AlertCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function MoneyRequests({ onOpenRequest }) {
  const { refreshWallet } = useAuth();
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' or 'outgoing'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/requests?type=${activeTab}&page=0&size=20`);
      if (res.success && res.data) {
        setRequests(res.data.content || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const handleAccept = async (id) => {
    try {
      const res = await axiosClient.put(`/requests/${id}/accept`);
      if (res.success) {
        alert("Request accepted & payment completed successfully!");
        await refreshWallet();
        await fetchRequests();
      }
    } catch (err) {
      alert(err.message || 'Failed to accept request');
    }
  };

  const handleReject = async (id) => {
    try {
      await axiosClient.put(`/requests/${id}/reject`);
      await fetchRequests();
    } catch (err) {
      alert(err.message || 'Failed to reject request');
    }
  };

  const handleCancel = async (id) => {
    try {
      await axiosClient.put(`/requests/${id}/cancel`);
      await fetchRequests();
    } catch (err) {
      alert(err.message || 'Failed to cancel request');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Peer-to-Peer Money Requests</h1>
          <p className="text-xs text-slate-400">Request or pay contacts seamlessly</p>
        </div>

        <button
          onClick={onOpenRequest}
          className="py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center space-x-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Money Request</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'incoming' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Incoming Requests (To Pay)
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'outgoing' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Outgoing Requests (Requested)
        </button>
      </div>

      {/* List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">No {activeTab} money requests found</div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">
                    {activeTab === 'incoming' ? req.requesterFullName : req.payerFullName}
                    <span className="text-slate-400 text-xs font-normal ml-1">
                      (@{activeTab === 'incoming' ? req.requesterUsername : req.payerUsername})
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{req.description}</p>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Created: {new Date(req.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-white block">₹{req.amount}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                      req.status === 'ACCEPTED' ? 'bg-teal-500/10 text-teal-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  {/* Actions */}
                  {req.status === 'PENDING' && (
                    activeTab === 'incoming' ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAccept(req.id)}
                          className="p-2 bg-teal-500 text-slate-950 rounded-xl font-bold hover:bg-teal-400 transition"
                          title="Accept and Pay"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="p-2 bg-slate-800 text-red-400 rounded-xl hover:bg-slate-700 transition"
                          title="Reject Request"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCancel(req.id)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-red-400 text-xs rounded-xl transition"
                      >
                        Cancel Request
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
