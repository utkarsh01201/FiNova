import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, ShieldCheck, Lock, CheckCircle2, Camera, Upload, AlertCircle, FileCheck } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  // KYC Modal State
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [photoPreview, setPhotoPreview] = useState(user?.kycDocumentUrl || '');
  const [kycLoading, setKycLoading] = useState(false);
  const [kycErr, setKycErr] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    try {
      const res = await axiosClient.put('/users/me', { fullName, phoneNumber });
      if (res.success) {
        await refreshProfile();
        setProfileMsg('Profile details updated successfully!');
      }
    } catch (err) {
      setProfileErr(err.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassErr('');
    try {
      const res = await axiosClient.put('/auth/change-password', { oldPassword, newPassword });
      if (res.success) {
        setPassMsg('Password changed successfully!');
        setOldPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setPassErr(err.message || 'Failed to change password');
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    setKycLoading(true);
    setKycErr('');

    const panUpper = panNumber.toUpperCase().trim();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panUpper)) {
      setKycErr('Invalid PAN Card structure! Must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).');
      setKycLoading(false);
      return;
    }

    const aadhaarClean = aadhaarNumber.trim();
    const aadhaarRegex = /^[0-9]{12}$|^[0-9]{16}$/;
    if (!aadhaarRegex.test(aadhaarClean)) {
      setKycErr('Aadhaar must be a 12-digit Aadhaar number or 16-digit Virtual ID.');
      setKycLoading(false);
      return;
    }

    try {
      const res = await axiosClient.post('/users/kyc/verify', {
        aadhaarNumber: aadhaarClean,
        panNumber: panUpper,
        livePhotoData: photoPreview || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      });

      if (res.success) {
        await refreshProfile();
        setIsKycModalOpen(false);
        setProfileMsg('Aadhaar & PAN Verification Approved!');
      }
    } catch (err) {
      setKycErr(err.message || 'KYC submission failed');
    } finally {
      setKycLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Account Profile & Security</h1>
        <p className="text-xs text-slate-400">Manage user identity, Aadhaar & PAN verification, and security credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            {user?.kycDocumentUrl ? (
              <img src={user.kycDocumentUrl} alt="Photo" className="w-20 h-20 rounded-full object-cover border-2 border-teal-400 shadow-xl" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{user?.fullName}</h3>
            <p className="text-xs text-slate-400">@{user?.username}</p>
          </div>

          <div className="pt-2">
            <span className={`px-3.5 py-1.5 text-xs font-bold rounded-full border inline-flex items-center space-x-1.5 ${
              user?.kycStatus === 'VERIFIED'
                ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <ShieldCheck className="w-4 h-4" />
              <span>KYC: {user?.kycStatus || 'PENDING'}</span>
            </span>
          </div>

          {user?.kycStatus === 'VERIFIED' ? (
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">VERIFIED AADHAAR</span>
                <span className="font-mono text-teal-400 font-bold">{user.aadhaarMasked || '••••••••1234'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">VERIFIED PAN</span>
                <span className="font-mono text-teal-400 font-bold">{user.panMasked || '•••••1234F'}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsKycModalOpen(true)}
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition"
            >
              Verify Aadhaar & PAN KYC
            </button>
          )}
        </div>

        {/* Profile Update Form */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white">Personal Information</h3>

          {profileMsg && <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs rounded-xl font-bold">{profileMsg}</div>}
          {profileErr && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-bold">{profileErr}</div>}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address (Primary)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800/60 rounded-xl text-slate-400 text-sm cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition"
            >
              Save Profile Updates
            </button>
          </form>

          {/* Change Password Form */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-teal-400" />
              <span>Change Security Password</span>
            </h3>

            {passMsg && <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs rounded-xl font-bold">{passMsg}</div>}
            {passErr && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-bold">{passErr}</div>}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mandatory Aadhaar & PAN KYC Verification Modal */}
      {isKycModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-teal-400" />
                <span>Submit Official KYC Documents</span>
              </h3>
              <button onClick={() => setIsKycModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {kycErr && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold leading-relaxed">
                {kycErr}
              </div>
            )}

            <form onSubmit={handleKycSubmit} className="space-y-4">
              {/* Aadhaar Input */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Aadhaar Number <span className="text-teal-400">(Mandatory 12 Digits)</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  placeholder="e.g. 123456789012"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* PAN Input with official Structure */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  PAN Card Number <span className="text-teal-400">(Govt Structure: ABCDE1234F)</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-500 block mt-1">Structure: 5 Letters + 4 Digits + 1 Letter</span>
              </div>

              {/* Photograph Upload */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Live Identity Photograph</label>
                <div className="flex items-center space-x-4">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-teal-500" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}

                  <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-teal-400" />
                    <span>Upload Snapshot</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={kycLoading}
                className="w-full py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm transition shadow-lg shadow-teal-500/20"
              >
                {kycLoading ? 'Verifying Documents...' : 'Submit & Verify KYC'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
