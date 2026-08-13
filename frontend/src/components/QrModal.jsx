import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, Scan, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import axiosClient from '../api/axiosClient';

export default function QrModal({ isOpen, onClose, onSelectRecipient }) {
  const [activeTab, setActiveTab] = useState('my-qr');
  const [qrData, setQrData] = useState(null);
  const [scanInput, setScanInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const scannerRef = useRef(null);
  const scannerStartedRef = useRef(false);

  // Generate user's QR
  useEffect(() => {
    if (isOpen && activeTab === 'my-qr') {
      const fetchQr = async () => {
        setLoading(true);
        setError('');

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

  // Start camera scanner
  useEffect(() => {
    if (!isOpen || activeTab !== 'scan') {
      return;
    }

    const startScanner = async () => {
      try {
        // Prevent duplicate scanner instances
        if (scannerStartedRef.current) return;

        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            console.log('QR detected:', decodedText);

            setScanInput(decodedText);

            // Stop camera after successful scan
            try {
              await scanner.stop();
              scanner.clear();
              scannerStartedRef.current = false;
            } catch (e) {
              console.log('Scanner stop error:', e);
            }

            // Automatically resolve the QR
            await resolveQr(decodedText);
          },
          () => {
            // Ignore normal scanning failures
          }
        );

        scannerStartedRef.current = true;
      } catch (err) {
        console.error('Camera error:', err);
        setError(
          'Unable to access camera. Please allow camera permission and try again.'
        );
      }
    };

    startScanner();

    return () => {
      const stopScanner = async () => {
        if (scannerRef.current && scannerStartedRef.current) {
          try {
            await scannerRef.current.stop();
            scannerRef.current.clear();
          } catch (e) {
            console.log('Scanner cleanup:', e);
          }

          scannerRef.current = null;
          scannerStartedRef.current = false;
        }
      };

      stopScanner();
    };
  }, [isOpen, activeTab]);

  // Resolve QR payload
  const resolveQr = async (qrCodeString) => {
    setLoading(true);
    setError('');

    try {
      const res = await axiosClient.post('/qr/scan', {
        qrCodeString: qrCodeString,
      });

      if (res.success && res.data) {
        onSelectRecipient(res.data.username);
        onClose();
      } else {
        setError(res.message || 'Invalid QR code');
      }
    } catch (err) {
      setError(err.message || 'Invalid or unrecognized QR payload');
    } finally {
      setLoading(false);
    }
  };

  // Manual submit
  const handleScanSubmit = async (e) => {
    e.preventDefault();

    if (!scanInput) return;

    await resolveQr(scanInput);
  };

  const copyQrString = () => {
    if (qrData?.qrCodeString) {
      navigator.clipboard.writeText(qrData.qrCodeString);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  const handleClose = async () => {
    if (scannerRef.current && scannerStartedRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.log('Scanner cleanup:', e);
      }

      scannerRef.current = null;
      scannerStartedRef.current = false;
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">

          <div className="flex space-x-2">

            <button
              onClick={() => {
                setActiveTab('my-qr');
                setError('');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'my-qr'
                  ? 'bg-teal-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>My Finova QR</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('scan');
                setError('');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'scan'
                  ? 'bg-teal-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>Scan QR</span>
            </button>

          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
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
                  <div className="p-5 bg-white rounded-3xl inline-block shadow-2xl border-4 border-teal-500/30">

                    <QRCodeSVG
                      value={qrData.qrCodeString}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />

                  </div>

                  <div>
                    <h4 className="text-white font-extrabold text-base">
                      {qrData.fullName}
                    </h4>

                    <p className="text-xs text-teal-400 font-mono">
                      @{qrData.username}
                    </p>

                    <p className="text-[11px] text-slate-400 mt-1">
                      Scan this QR to pay directly
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400">

                    <span className="truncate max-w-[240px] font-mono text-[10px] text-slate-300">
                      {qrData.qrCodeString}
                    </span>

                    <button
                      onClick={copyQrString}
                      className="text-teal-400 hover:text-teal-300 font-bold flex items-center space-x-1"
                    >
                      <Copy className="w-3.5 h-3.5" />

                      <span>
                        {copied ? 'Copied!' : 'Copy'}
                      </span>

                    </button>

                  </div>

                </>

              ) : (

                <p className="text-xs text-red-400">
                  {error || 'Unable to load QR'}
                </p>

              )}

            </div>

          ) : (

            <div className="space-y-4">

              {/* CAMERA */}
              <div
                id="qr-reader"
                className="w-full overflow-hidden rounded-2xl border border-slate-700"
              ></div>

              {loading && (
                <p className="text-xs text-teal-400">
                  Resolving QR...
                </p>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold">
                  {error}
                </div>
              )}

              <div className="text-xs text-slate-400">
                Point your camera at a FINOVA QR code
              </div>

              {/* Manual fallback */}
              <form
                onSubmit={handleScanSubmit}
                className="space-y-3 text-left"
              >

                <label className="block text-xs font-semibold text-slate-400">
                  Or paste QR payload manually
                </label>

                <textarea
                  rows={2}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="finova://pay?..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                />

                <button
                  type="submit"
                  disabled={loading || !scanInput}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-extrabold rounded-xl disabled:opacity-50 text-sm"
                >
                  {loading ? 'Resolving...' : 'Resolve QR'}
                </button>

              </form>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}
