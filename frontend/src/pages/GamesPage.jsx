import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { ArrowDownLeft, Zap, Trophy, RotateCcw, Coins, TrendingUp, Gift, Star } from 'lucide-react';
import UpiPinModal from '../components/UpiPinModal';

// 8 wheel segments matching backend WHEEL_SEGMENTS order
const SEGMENTS = [
  { label: '2x',      color: '#10b981', textColor: '#fff', emoji: '💰', desc: 'Double Win!' },
  { label: 'LOSE',    color: '#ef4444', textColor: '#fff', emoji: '💀', desc: 'Try Again' },
  { label: '1.5x',   color: '#3b82f6', textColor: '#fff', emoji: '🎯', desc: '1.5x Win!' },
  { label: 'LOSE',   color: '#dc2626', textColor: '#fff', emoji: '😔', desc: 'So Close!' },
  { label: '3x',     color: '#f59e0b', textColor: '#1a1a1a', emoji: '🔥', desc: 'Triple Win!' },
  { label: 'LOSE',   color: '#b91c1c', textColor: '#fff', emoji: '💸', desc: 'Try Again' },
  { label: '🎰 10x', color: '#a855f7', textColor: '#fff', emoji: '👑', desc: 'JACKPOT!!' },
  { label: 'LOSE',   color: '#991b1b', textColor: '#fff', emoji: '🌙', desc: 'Next Time' },
];

const SEGMENT_ANGLE = 360 / SEGMENTS.length; // 45 degrees each

function SpinWheel({ spinning, targetIndex }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [canvasSize, setCanvasSize] = useState(280);
  const animRef = useRef(null);

  // Dynamically size canvas to container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setCanvasSize(Math.min(w - 16, 300));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const drawWheel = (angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;

    ctx.clearRect(0, 0, size, size);

    // Shadow glow
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#10b981';

    SEGMENTS.forEach((seg, i) => {
      const startAngle = (angle + i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
      const endAngle = startAngle + SEGMENT_ANGLE * (Math.PI / 180);

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + (SEGMENT_ANGLE / 2) * (Math.PI / 180));
      ctx.textAlign = 'right';
      ctx.fillStyle = seg.textColor;
      ctx.font = `bold ${size < 280 ? 10 : 12}px 'Inter', sans-serif`;
      ctx.fillText(seg.emoji + ' ' + seg.label, radius - 10, 5);
      ctx.restore();
    });
    ctx.restore();

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center icon text
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎰', center, center + 5);
  };

  useEffect(() => {
    drawWheel(currentAngle);
  }, [currentAngle]);

  useEffect(() => {
    if (!spinning) return;

    // Calculate target rotation: spin 5-8 full rotations + land on targetIndex
    const targetSegmentAngle = 360 - (targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2);
    const totalSpin = 360 * 7 + targetSegmentAngle;
    const duration = 4000;
    const startAngle = currentAngle;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const angle = startAngle + totalSpin * eased;
      setCurrentAngle(angle % 360);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [spinning, targetIndex]);

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-full">
      {/* Pointer triangle */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-teal-400 drop-shadow-lg" />
      </div>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="rounded-full max-w-full"
        style={{ filter: spinning ? 'drop-shadow(0 0 20px #10b981)' : 'drop-shadow(0 0 8px #10b98155)' }}
      />
    </div>
  );
}

export default function GamesPage() {
  const { wallet, refreshWallet } = useAuth();
  const [betAmount, setBetAmount] = useState('50');
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [targetIndex, setTargetIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [isWithdrawPinOpen, setIsWithdrawPinOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [totalWon, setTotalWon] = useState(0);
  const [totalLost, setTotalLost] = useState(0);

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const res = await axiosClient.get('/bank/accounts');
      if (res.success && res.data && res.data.length > 0) {
        setBankAccounts(res.data);
        const primary = res.data.find(a => a.isPrimary) || res.data[0];
        setSelectedBankId(primary.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSpin = async () => {
    if (spinning) return;
    const bet = parseFloat(betAmount);
    if (!bet || bet <= 0) return;
    if (wallet?.balance < bet) {
      setError('Insufficient wallet balance!');
      return;
    }

    setError('');
    setResult(null);
    setSpinning(true);

    try {
      const res = await axiosClient.post('/game/spin', { betAmount: bet });
      if (res.success && res.data) {
        const data = res.data;
        setTargetIndex(data.spinIndex);

        // Wait for animation (4s) then show result
        setTimeout(async () => {
          setSpinning(false);
          setResult(data);
          await refreshWallet();

          setHistory(prev => [data, ...prev].slice(0, 10));
          if (data.outcome === 'WIN') {
            setTotalWon(prev => prev + parseFloat(data.winAmount));
          } else {
            setTotalLost(prev => prev + parseFloat(data.betAmount));
          }
        }, 4200);
      }
    } catch (err) {
      setSpinning(false);
      setError(err.message || 'Failed to spin. Try again.');
    }
  };

  const handleWithdrawPin = async (pin) => {
    setWithdrawing(true);
    try {
      const res = await axiosClient.post('/wallet/withdraw', {
        bankAccountId: selectedBankId,
        amount: parseFloat(withdrawAmount),
        upiPin: pin,
        description: 'Game winnings withdrawal to bank'
      });

      if (res.success) {
        setIsWithdrawPinOpen(false);
        setShowWithdraw(false);
        setWithdrawSuccess(`✅ ₹${withdrawAmount} withdrawn to bank successfully!`);
        await refreshWallet();
        setTimeout(() => setWithdrawSuccess(''), 5000);
      }
    } catch (err) {
      alert(err.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const QUICK_BETS = [10, 25, 50, 100, 250, 500];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center px-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-bold mb-3">
          <Zap className="w-3.5 h-3.5" />
          <span>FINOVA LUCKY SPIN • REAL MONEY GAMES</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white bg-gradient-to-r from-teal-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
          Lucky Spin Arena
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">Spin the wheel, win real money directly to your wallet &amp; bank!</p>
      </div>

      {withdrawSuccess && (
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm font-bold text-center">
          {withdrawSuccess}
        </div>
      )}

      {/* Main grid: Wheel first on mobile, stats below */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Center: Wheel + Bet — shown first on mobile */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {/* Wallet Balance */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-5 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wallet Balance</p>
            <p className="text-2xl font-black text-teal-400 font-mono">
              ₹{wallet?.balance != null ? Number(wallet.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
            </p>
            <button
              onClick={() => { setWithdrawAmount(''); setShowWithdraw(true); }}
              disabled={!wallet?.balance || wallet.balance <= 0 || bankAccounts.length === 0}
              className="w-full py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-bold flex items-center justify-center space-x-2 transition disabled:opacity-40"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Withdraw Winnings to Bank</span>
            </button>
            {bankAccounts.length === 0 && (
              <p className="text-[10px] text-amber-400 text-center">Link a bank account to withdraw winnings</p>
            )}
          </div>

          {/* Session Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Stats</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 flex items-center space-x-1.5"><TrendingUp className="w-3.5 h-3.5 text-teal-400" /><span>Total Won</span></span>
                <span className="text-sm font-bold text-teal-400 font-mono">₹{totalWon.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 flex items-center space-x-1.5"><Coins className="w-3.5 h-3.5 text-red-400" /><span>Total Lost</span></span>
                <span className="text-sm font-bold text-red-400 font-mono">₹{totalLost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-2">
                <span className="text-xs text-slate-400 flex items-center space-x-1.5"><Trophy className="w-3.5 h-3.5 text-yellow-400" /><span>Net P&amp;L</span></span>
                <span className={`text-sm font-bold font-mono ${totalWon - totalLost >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                  {totalWon - totalLost >= 0 ? '+' : ''}₹{(totalWon - totalLost).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Spin History */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Spins</p>
            {history.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-3">Spin to see history here</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className={`flex justify-between items-center p-2 rounded-xl text-xs ${h.outcome === 'WIN' ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'}`}>
                    <span className="font-bold">{h.segment}</span>
                    <span className="font-mono">
                      {h.outcome === 'WIN' ? `+₹${Number(h.winAmount).toFixed(2)}` : `-₹${Number(h.betAmount).toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Left: Stats — shown below wheel on mobile, left sidebar on desktop */}
        <div className="space-y-4 lg:order-first">
          {/* Wheel */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950 border border-slate-700 rounded-3xl p-4 sm:p-6 text-center space-y-4 sm:space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.08),transparent_70%)] pointer-events-none" />

            {/* Odds info */}
            <div className="flex flex-wrap justify-center gap-2 text-[10px]">
              {SEGMENTS.filter(s => s.label !== 'LOSE').map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full font-bold" style={{ background: s.color + '33', color: s.color, border: `1px solid ${s.color}55` }}>
                  {s.emoji} {s.label}
                </span>
              ))}
            </div>

            <div className="flex justify-center">
              <SpinWheel spinning={spinning} targetIndex={targetIndex} />
            </div>

            {/* Result Banner */}
            {result && !spinning && (
              <div className={`p-4 rounded-2xl border animate-pulse ${
                result.outcome === 'WIN'
                  ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                  : 'bg-red-500/15 border-red-500/40 text-red-300'
              }`} style={{ animationIterationCount: 1 }}>
                <p className="text-lg font-black">{result.message}</p>
                {result.outcome === 'WIN' && (
                  <p className="text-xs mt-1 text-slate-300">New Balance: <span className="font-bold text-teal-400">₹{Number(result.newBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></p>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                {error}
              </div>
            )}

            {/* Bet Controls */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Bet Amount (₹)</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 mb-3">
                  {QUICK_BETS.map(val => (
                    <button
                      key={val}
                      onClick={() => setBetAmount(val.toString())}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${betAmount === val.toString() ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max={wallet?.balance || 9999}
                  step="1"
                  value={betAmount}
                  onChange={e => setBetAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-2xl font-mono font-black text-purple-400 text-center focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={handleSpin}
                disabled={spinning || !betAmount || parseFloat(betAmount) <= 0}
                className="w-full py-4 rounded-2xl font-extrabold text-base shadow-2xl transition transform active:scale-95 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: spinning ? '#1e293b' : 'linear-gradient(135deg, #10b981, #8b5cf6, #f59e0b)',
                  color: '#fff',
                  boxShadow: spinning ? 'none' : '0 8px 32px rgba(139,92,246,0.4)'
                }}
              >
                <RotateCcw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
                <span>{spinning ? 'Spinning...' : `🎰 SPIN — Bet ₹${betAmount || 0}`}</span>
              </button>

              <p className="text-[10px] text-slate-500 text-center">
                🔒 Provably fair game • Win up to <strong className="text-yellow-400">10x your bet</strong> • Winnings auto-credited to wallet
              </p>
            </div>
          </div>

          {/* Prize Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
            <div className="flex items-center space-x-2 mb-4">
              <Gift className="w-4 h-4 text-yellow-400" />
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Prize Table &amp; Win Chances</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: '🏆 JACKPOT', mult: '10x', chance: '3%', color: 'purple' },
                { label: '🔥 Triple', mult: '3x', chance: '7%', color: 'amber' },
                { label: '💰 Double', mult: '2x', chance: '20%', color: 'teal' },
                { label: '🎯 Bonus', mult: '1.5x', chance: '15%', color: 'blue' },
              ].map((prize, i) => (
                <div key={i} className={`p-3 rounded-2xl bg-${prize.color}-500/10 border border-${prize.color}-500/20 text-center`}>
                  <p className="text-base font-black text-white">{prize.label}</p>
                  <p className={`text-xl font-black text-${prize.color}-400`}>{prize.mult}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Win chance: <strong>{prize.chance}</strong></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <ArrowDownLeft className="w-5 h-5 text-teal-400" />
                <span>Withdraw Winnings → Bank</span>
              </h3>
              <button onClick={() => setShowWithdraw(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300">
              Wallet Balance: <strong className="text-teal-400 font-mono text-sm">₹{Number(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Destination Bank Account</label>
              <select
                value={selectedBankId}
                onChange={e => setSelectedBankId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
              >
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>{b.bankName} ({b.accountNumberMasked}) — {b.upiId}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Amount to Withdraw (₹)</label>
              <input
                type="number"
                min="1"
                max={wallet?.balance}
                step="0.01"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-2xl font-mono font-bold text-teal-400 text-center focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[100, 500, 1000].map(val => (
                <button key={val} onClick={() => setWithdrawAmount(val.toString())} className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs rounded-xl transition">
                  ₹{val}
                </button>
              ))}
            </div>

            <button
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
              onClick={() => { if (withdrawAmount && parseFloat(withdrawAmount) > 0) setIsWithdrawPinOpen(true); }}
              className="w-full py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm transition shadow-lg flex items-center justify-center space-x-2"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Withdraw to Bank</span>
            </button>
          </div>
        </div>
      )}

      <UpiPinModal
        isOpen={isWithdrawPinOpen}
        onClose={() => setIsWithdrawPinOpen(false)}
        title="Authorize Withdrawal"
        subtitle={`Withdraw ₹${withdrawAmount} to bank`}
        loading={withdrawing}
        onSubmit={handleWithdrawPin}
      />
    </div>
  );
}
