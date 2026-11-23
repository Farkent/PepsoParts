import React, { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useToast } from '../context/ToastContext';
import { LockKeyhole, Mail, Phone, Shield, UserRound } from 'lucide-react';

export default function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { login: adminLogin, isAuthenticated: isAdmin, loading: adminLoading } = useAuth();
  const { login: customerLogin, register: customerRegister, customer, loading: customerLoading } = useCustomerAuth();
  const { error: showError, success } = useToast();

  // Main tab: 'customer' | 'admin'
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'admin' ? 'admin' : 'customer'
  );

  // Customer sub-mode: 'login' | 'register'
  const [mode, setMode] = useState(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );

  const [submitting, setSubmitting] = useState(false);

  // Customer form state
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loginFailed, setLoginFailed] = useState(false);

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // ── Loading guard ──
  if (adminLoading || customerLoading) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="text-xs font-display font-bold text-white/60 uppercase tracking-widest">Memuat...</div>
      </div>
    );
  }

  // ── Redirect if already authenticated ──
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (customer) return <Navigate to="/akun" replace />;

  // ── Tab / Mode switching ──
  const switchTab = (tab) => {
    setActiveTab(tab);
    setFieldErrors({});
    setLoginFailed(false);
    setMode('login');
    setSearchParams(tab === 'admin' ? { tab: 'admin' } : {});
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setFieldErrors({});
    setLoginFailed(false);
    const params = {};
    if (activeTab === 'admin') params.tab = 'admin';
    if (nextMode === 'register') params.mode = 'register';
    setSearchParams(params);
  };

  // ── Customer form handler ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (mode === 'register') {
      if (!form.name.trim()) errors.name = 'Nama wajib diisi.';
      if (!form.whatsapp.trim()) errors.whatsapp = 'Nomor WhatsApp wajib diisi.';
      if (form.password.length < 8) errors.password = 'Kata sandi minimal 8 karakter.';
      if (form.password !== form.confirmPassword) errors.confirmPassword = 'Konfirmasi kata sandi tidak sama.';
    }
    if (!form.email.trim()) errors.email = 'Email wajib diisi.';
    if (!form.password) errors.password = 'Kata sandi wajib diisi.';
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setLoginFailed(false);
    try {
      const payload = { email: form.email.trim(), password: form.password };
      if (mode === 'register') {
        payload.name = form.name.trim();
        payload.whatsapp = form.whatsapp.trim();
        await customerRegister(payload);
        success('Akun berhasil dibuat. Selamat datang!');
      } else {
        await customerLogin(payload);
        success('Berhasil masuk ke akun pelanggan.');
      }
      navigate('/akun', { replace: true });
    } catch (err) {
      if (err.fields && Object.keys(err.fields).length > 0) {
        setFieldErrors(err.fields);
      } else {
        showError(err.message || 'Tidak dapat memproses akun.');
        if (mode === 'login') setLoginFailed(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Admin form handler ──
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminLogin(adminEmail, adminPassword);
      success('Login berhasil. Selamat datang, Admin!');
      navigate('/admin', { replace: true });
    } catch (err) {
      showError(err.message || 'Email atau password salah.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center p-4">
      <div className="bg-white max-w-md w-full border border-neutral-300 shadow-2xl rounded-sm overflow-hidden">

        {/* ── Header ── */}
        <div className="text-center pt-8 pb-5 px-8 border-b border-neutral-100">
          <div className="inline-block mb-3">
            <Logo size="lg" to="/" />
          </div>
          <p className="text-xs font-display font-bold uppercase tracking-widest text-muted-text mt-1">
            Masuk ke Akun Anda
          </p>
        </div>

        {/* ── Main Tabs ── */}
        <div className="grid grid-cols-2 border-b border-neutral-200">
          <button
            type="button"
            onClick={() => switchTab('customer')}
            className={`flex items-center justify-center gap-2 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'customer'
                ? 'border-brand text-brand bg-orange-50/60'
                : 'border-transparent text-muted-text hover:text-ink'
            }`}
          >
            <UserRound className="w-4 h-4" />
            Pelanggan
          </button>
          <button
            type="button"
            onClick={() => switchTab('admin')}
            className={`flex items-center justify-center gap-2 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'admin'
                ? 'border-brand text-brand bg-orange-50/60'
                : 'border-transparent text-muted-text hover:text-ink'
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin
          </button>
        </div>

        {/* ── Content Area ── */}
        <div className="p-6 sm:p-8">

          {/* ════════ CUSTOMER PANEL ════════ */}
          {activeTab === 'customer' && (
            <>
              <div className="text-center mb-5">
                <h1 className="font-display text-xl font-extrabold uppercase">
                  {mode === 'register' ? 'Buat Akun' : 'Masuk Akun'}
                </h1>
                <p className="text-xs text-muted-text mt-1.5">
                  {mode === 'register'
                    ? 'Pelanggan baru? Daftar gratis, lalu langsung memesan.'
                    : 'Sudah punya akun? Masuk dengan email dan kata sandi.'}
                </p>
              </div>

              {/* Customer Sub-tabs */}
              <div className="grid grid-cols-2 border border-neutral-200 mb-5">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`py-2.5 text-xs font-bold uppercase transition-colors ${
                    mode === 'login' ? 'bg-brand text-white' : 'text-muted-text hover:text-ink'
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`py-2.5 text-xs font-bold uppercase transition-colors ${
                    mode === 'register' ? 'bg-brand text-white' : 'text-muted-text hover:text-ink'
                  }`}
                >
                  Buat Akun
                </button>
              </div>

              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                {mode === 'register' && (
                  <>
                    <Input
                      label="Nama Lengkap" name="name" autoComplete="name" required icon={UserRound}
                      value={form.name} onChange={handleChange} error={fieldErrors.name}
                    />
                    <Input
                      label="Nomor WhatsApp" name="whatsapp" type="tel" autoComplete="tel"
                      required icon={Phone} placeholder="08xxxxxxxxxx"
                      value={form.whatsapp} onChange={handleChange} error={fieldErrors.whatsapp}
                    />
                  </>
                )}
                <Input
                  label="Email" name="email" type="email" autoComplete="email" required icon={Mail}
                  value={form.email} onChange={handleChange} error={fieldErrors.email}
                />
                <Input
                  label="Kata Sandi" name="password" type="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required icon={LockKeyhole}
                  value={form.password} onChange={handleChange} error={fieldErrors.password}
                />
                {mode === 'register' && (
                  <Input
                    label="Ulangi Kata Sandi" name="confirmPassword" type="password"
                    autoComplete="new-password" required icon={LockKeyhole}
                    value={form.confirmPassword} onChange={handleChange}
                    error={fieldErrors.confirmPassword}
                  />
                )}
                <Button type="submit" variant="primary" fullWidth loading={submitting}>
                  {mode === 'register' ? 'Daftar Sekarang' : 'Masuk'}
                </Button>
              </form>

              {mode === 'login' && loginFailed && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-sm text-xs text-ink">
                  <p className="font-bold mb-1">Belum punya akun?</p>
                  <p className="text-muted-text">
                    Kalau ini pertama kalinya kamu memesan di sini, buat akun dulu. Cukup sekali saja.
                  </p>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="mt-2 font-bold text-brand underline"
                  >
                    Buat akun sekarang
                  </button>
                </div>
              )}

              <p className="text-center text-sm text-ink mt-5">
                {mode === 'register' ? (
                  <>
                    Sudah punya akun?{' '}
                    <button type="button" onClick={() => switchMode('login')} className="font-bold text-brand underline">
                      Masuk di sini
                    </button>
                  </>
                ) : (
                  <>
                    Belum punya akun?{' '}
                    <button type="button" onClick={() => switchMode('register')} className="font-bold text-brand underline">
                      Daftar di sini
                    </button>
                  </>
                )}
              </p>

              <p className="text-center text-xs text-muted-text mt-3">
                Katalog tetap bisa dilihat tanpa akun. Akun diperlukan untuk membuat pesanan.
              </p>
            </>
          )}

          {/* ════════ ADMIN PANEL ════════ */}
          {activeTab === 'admin' && (
            <>
              <div className="text-center mb-5">
                <h1 className="font-display text-xl font-extrabold uppercase">Portal Admin</h1>
                <p className="text-xs text-muted-text mt-1.5">
                  Akses terbatas untuk pengelola toko.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-sm mb-5">
                <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Area khusus pemilik dan admin. Pastikan kamu memiliki kredensial yang tepat.
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <Input
                  label="Email Admin" type="email" required icon={Mail}
                  placeholder="admin@pepsoparts.com"
                  value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                />
                <Input
                  label="Kata Sandi" type="password" required icon={LockKeyhole}
                  placeholder="••••••••"
                  value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                />
                <Button type="submit" variant="primary" fullWidth loading={submitting}>
                  Masuk ke Admin
                </Button>
              </form>
            </>
          )}
        </div>

        {/* ── Page Footer ── */}
        <div className="border-t border-neutral-100 px-6 sm:px-8 py-4 flex items-center justify-between bg-neutral-50/50">
          <Link to="/" className="text-xs text-muted-text hover:text-ink transition-colors">
            ← Kembali ke Beranda
          </Link>
          <span className="text-[11px] text-muted-text">PEPSO PARTS · SeptClouds</span>
        </div>
      </div>
    </div>
  );
}
