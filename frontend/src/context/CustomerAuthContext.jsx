import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { setCsrfToken } from '../api/client';
import { customerLogin, customerLogout, customerMe, customerRegister } from '../api/endpoints';

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await customerMe();
      setCustomer(res?.data?.customer || null);
      if (res?.data?.csrf_token) setCsrfToken(res.data.csrf_token);
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const acceptSession = (res) => {
    if (!res?.data?.customer) throw new Error('Autentikasi pelanggan gagal.');
    setCustomer(res.data.customer);
    if (res.data.csrf_token) setCsrfToken(res.data.csrf_token);
    return res.data.customer;
  };

  const login = async (data) => acceptSession(await customerLogin(data));
  const register = async (data) => acceptSession(await customerRegister(data));

  const logout = async () => {
    await customerLogout();
    setCustomer(null);
  };

  const setCustomerSession = (customerData, csrfToken) => {
    setCustomer(customerData);
    if (csrfToken) setCsrfToken(csrfToken);
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, login, register, logout, checkAuth, setCustomerSession }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
