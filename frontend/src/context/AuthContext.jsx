import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('finova_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('finova_token') || null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false); // Hidden by default for privacy

  const fetchWallet = async () => {
    if (!token) return;
    try {
      const res = await axiosClient.get('/wallet');
      if (res.success) {
        setWallet(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch wallet balance", err);
    }
  };

  const fetchCurrentUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await axiosClient.get('/auth/me');
      if (res.success) {
        setUser(res.data);
        localStorage.setItem('finova_user', JSON.stringify(res.data));
        await fetchWallet();
      }
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (usernameOrEmailOrPhone, password) => {
    const res = await axiosClient.post('/auth/login', { usernameOrEmailOrPhone, password });
    if (res.success && res.data) {
      const { accessToken, user: userData } = res.data;
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('finova_token', accessToken);
      localStorage.setItem('finova_user', JSON.stringify(userData));
      await fetchWallet();
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (registerData) => {
    const res = await axiosClient.post('/auth/register', registerData);
    if (res.success && res.data) {
      const { accessToken, user: userData } = res.data;
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('finova_token', accessToken);
      localStorage.setItem('finova_user', JSON.stringify(userData));
      await fetchWallet();
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setWallet(null);
    localStorage.removeItem('finova_token');
    localStorage.removeItem('finova_user');
  };

  const toggleShowBalance = () => {
    setShowBalance(prev => !prev);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      wallet,
      loading,
      login,
      register,
      logout,
      refreshWallet: fetchWallet,
      refreshProfile: fetchCurrentUser,
      showBalance,
      toggleShowBalance
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
