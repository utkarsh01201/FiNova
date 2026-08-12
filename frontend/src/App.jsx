import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileBottomNav from './components/MobileBottomNav';
import AppLockOverlay from './components/AppLockOverlay';
import { ProtectedRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WalletPage from './pages/Wallet';
import BankAccountsPage from './pages/BankAccountsPage';
import Transactions from './pages/Transactions';
import MoneyRequests from './pages/MoneyRequests';
import Profile from './pages/Profile';
import ContactUs from './pages/ContactUs';
import AdminDashboard from './pages/AdminDashboard';
import GamesPage from './pages/GamesPage';

import AddMoneyModal from './components/AddMoneyModal';
import SendMoneyModal from './components/SendMoneyModal';
import RequestMoneyModal from './components/RequestMoneyModal';
import QrModal from './components/QrModal';
import ReceiptModal from './components/ReceiptModal';
import NotificationDrawer from './components/NotificationDrawer';

function AppLayout() {
  const { user } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false);
  
  const [initialRecipient, setInitialRecipient] = useState('');
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleOpenReceipt = (txId) => {
    setSelectedTxId(txId);
    setIsReceiptOpen(true);
  };

  const handleQrRecipientResolved = (username) => {
    setInitialRecipient(username);
    setIsSendOpen(true);
  };

  const handleSendSuccess = (txData) => {
    setToastMsg(`Payment completed successfully to @${txData.receiverUsername || txData.recipientIdentifier || 'recipient'}!`);
    if (txData.id) {
      handleOpenReceipt(txData.id);
    }
    setTimeout(() => setToastMsg(''), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      {/* Biometric Fingerprint App Lock Screen */}
      <AppLockOverlay
        isLocked={isAppLocked}
        onUnlock={() => setIsAppLocked(false)}
      />

      <Navbar
        onOpenNotifications={() => setIsNotifOpen(true)}
        onLockApp={() => setIsAppLocked(true)}
      />

      {toastMsg && (
        <div className="bg-teal-500 text-slate-950 px-6 py-2.5 font-bold text-xs flex justify-between items-center shadow-lg animate-bounce">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg('')} className="font-extrabold hover:underline">✕</button>
        </div>
      )}

      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-6">
        <Sidebar onOpenQr={() => setIsQrOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={
                <Dashboard 
                  onOpenAdd={() => setIsAddOpen(true)}
                  onOpenSend={() => { setInitialRecipient(''); setIsSendOpen(true); }}
                  onOpenRequest={() => setIsRequestOpen(true)}
                  onOpenQr={() => setIsQrOpen(true)}
                  onOpenReceipt={handleOpenReceipt}
                />
              } />

              <Route path="/wallet" element={<WalletPage onOpenAdd={() => setIsAddOpen(true)} />} />

              <Route path="/bank" element={<BankAccountsPage />} />
              
              <Route path="/transactions" element={<Transactions onOpenReceipt={handleOpenReceipt} />} />

              <Route path="/requests" element={<MoneyRequests onOpenRequest={() => setIsRequestOpen(true)} />} />

              <Route path="/profile" element={<Profile />} />

              <Route path="/contact" element={<ContactUs />} />

              <Route path="/games" element={<GamesPage />} />
            </Route>

            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Phone Navigation Bar */}
      <MobileBottomNav onOpenQr={() => setIsQrOpen(true)} />

      {/* Global Interactive Modals */}
      <AddMoneyModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSuccess={(msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 4000); }} 
      />

      <SendMoneyModal 
        isOpen={isSendOpen} 
        onClose={() => setIsSendOpen(false)} 
        initialRecipient={initialRecipient}
        onSuccess={handleSendSuccess} 
      />

      <RequestMoneyModal 
        isOpen={isRequestOpen} 
        onClose={() => setIsRequestOpen(false)} 
        onSuccess={(msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 4000); }} 
      />

      <QrModal 
        isOpen={isQrOpen} 
        onClose={() => setIsQrOpen(false)} 
        onSelectRecipient={handleQrRecipientResolved} 
      />

      <ReceiptModal 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
        transactionId={selectedTxId} 
      />

      <NotificationDrawer 
        isOpen={isNotifOpen} 
        onClose={() => setIsNotifOpen(false)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
