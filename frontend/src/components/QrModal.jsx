import React, { useState, useEffect } from 'react';
import { X, QrCode, Scan, Copy, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axiosClient from '../api/axiosClient';

export default function QrModal({ isOpen, onClose, onSelectRecipient }) {
  const [activeTab, setActiveTab] = useState('my-qr');
  const [qrData, setQrData] = useState(null);
  const [scanInput, setScanInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'my-qr') {
      const fetchQr = async () => {
        setLoading(true);
        try {
          const res = await axiosClient.get('/qr/generate');
          if (res.success) {
            setQrData(res.data);
          }
        } catch (err) {
          setError(err.message || 'Failed to generate QR code');
        } finally {
          setLoading(false);
        }
      };
      fetchQr();
    }
  }, [isOpen, activeTab]);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axiosClient.post('/qr/scan', { qrCodeString: scanInput });
      if (res.success && res.data) {
        onSelectRecipient(res.data.username);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Invalid or unrecognized QR payload');
    } finally {
      setLoading(false);
    }
  };

  const copyQrString = () => {
    if (qrData?.qrCodeString) {
      navigator.clipboard.writeText(qrData.qrCodeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header Tabs */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('my-qr')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'my-qr' ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>My Finova QR</span>
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'scan' ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>Scan QR Payload</span>
            </button>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {activeTab === 'my-qr' ? (
            <div className="space-y-4">
              {loading ? (
                <div className="py-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-500"></div>
                </div>
              ) : qrData ? (
                <>
                  {/* Visual Scannable QR Matrix */}
                  <div className="p-5 bg-white rounded-3xl inline-block shadow-2xl border-4 border-teal-500/30">
                    <QRCodeSVG
                      value={qrData.qrCodeString}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-extrabold text-base">{qrData.fullName}</h4>
                    <p className="text-xs text-teal-400 font-mono">@{qrData.username}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Scan with camera or UPI scanner to pay directly</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400">
                    <span className="truncate max-w-[240px] font-mono text-[10px] text-slate-300">{qrData.qrCodeString}</span>
                    <button
                      onClick={copyQrString}
                      className="text-teal-400 hover:text-teal-300 font-bold flex items-center space-x-1 flex-shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-red-400">{error || 'Unable to load QR'}</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleScanSubmit} className="space-y-4 text-left">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Paste Scanned Finova QR Payload String
                </label>
                <textarea
                  rows={3}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Paste finova://pay?... payload string here"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !scanInput}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg transition disabled:opacity-50 text-sm"
              >
                {loading ? 'Resolving Recipient...' : 'Resolve Recipient & Pay'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
