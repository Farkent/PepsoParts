import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useToast } from '../context/ToastContext';
import { unifiedLogin, customerRegister } from '../api/endpoints';
import { LockKeyhole, Mail, Phone, UserRound } from 'lucide-react';

export default function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { isAuthenticated: isAdmin, loading: adminLoading, setAdminSession } = useAuth();
  const { customer, loading: customerLoading, setCustomerSession } = useCustomerAuth();
  const { error: showError, success } = useToast();

  // Mode: 'login' (default) | 'register'
  const [mode, setMode] = useState(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );

  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Loading guard ──
  if (adminLoading || customerLoading) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="text-xs font-display font-bold text-white/60 uppercase tracking-widest">
          Memuat...
        </div>
      </div>
    );
  }

  // ── Redirect if already authenticated ──
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (customer) return <Navigate to="/" replace />;

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setFieldErrors({});
    setSearchParams(nextMode === 'register' ? { mode: 'register' } : {});
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  // ── Submit Login Tunggal (Admin & User) ──
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    try {
      const res = await unifiedLogin(loginEmail.trim(), loginPassword);

      if (res?.data?.role === 'admin') {
        setAdminSession(res.data.admin, res.data.csrf_token);
        success('Login berhasil. Selamat datang, Admin!');
        navigate('/admin', { replace: true });
      } else if (res?.data?.role === 'customer') {
        setCustomerSession(res.data.customer, res.data.csrf_token);
        success('Login berhasil. Selamat datang!');
        navigate('/', { replace: true });
      } else {
        throw new Error('Respon login tidak dikenali.');
      }
    } catch (err) {
      if (err.fields && Object.keys(err.fields).length > 0) {
        setFieldErrors(err.fields);
      } else {
        showError(err.message || 'Email atau kata sandi tidak cocok.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submit Pendaftaran Pelanggan Baru ──
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!registerForm.name.trim()) errors.name = 'Nama wajib diisi.';
    if (!registerForm.whatsapp.trim()) errors.whatsapp = 'Nomor WhatsApp wajib diisi.';
    if (registerForm.password.length < 8) errors.password = 'Kata sandi minimal 8 karakter.';
    if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = 'Konfirmasi kata sandi tidak sama.';
    }
    if (!registerForm.email.trim()) errors.email = 'Email wajib diisi.';

    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        whatsapp: registerForm.whatsapp.trim(),
        password: registerForm.password,
      };
      const res = await customerRegister(payload);
      if (res?.data?.customer) {
        setCustomerSession(res.data.customer, res.data.csrf_token);
      }
      success('Akun berhasil dibuat. Selamat datang!');
      navigate('/', { replace: true });
    } catch (err) {
      if (err.fields && Object.keys(err.fields).length > 0) {
        setFieldErrors(err.fields);
      } else {
        showError(err.message || 'Pendaftaran gagal. Silakan coba lagi.');
      }
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
            Portal Masuk Akun
          </p>
        </div>

        {/* ── Tab Switcher: Masuk vs Buat Akun ── */}
        <div className="grid grid-cols-2 border-b border-neutral-200">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-3.5 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${
              mode === 'login'
                ? 'border-brand text-brand bg-orange-50/60'
                : 'border-transparent text-muted-text hover:text-ink'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-3.5 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${
              mode === 'register'
                ? 'border-brand text-brand bg-orange-50/60'
                : 'border-transparent text-muted-text hover:text-ink'
            }`}
          >
            Buat Akun
          </button>
        </div>

        {/* ── Content Area ── */}
        <div className="p-6 sm:p-8">
          {mode === 'login' ? (
            /* ════════ SATU FORM LOGIN UNTUK SEMUA (ADMIN & USER) ════════ */
            <>
              <div className="text-center mb-6">
                <h1 className="font-display text-2xl font-extrabold uppercase text-ink">
                  Masuk Akun
                </h1>
                <p className="text-xs text-muted-text mt-1.5 leading-relaxed">
                  Gunakan email dan kata sandi Anda untuk masuk ke sistem.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  icon={Mail}
                  placeholder="nama@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  error={fieldErrors.email}
                />

                <Input
                  label="Kata Sandi"
                  type="password"
                  autoComplete="current-password"
                  required
                  icon={LockKeyhole}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  error={fieldErrors.password}
                />

                <Button type="submit" variant="primary" fullWidth loading={submitting}>
                  Masuk
                </Button>
              </form>

              <div className="mt-6 text-center text-xs text-muted-text border-t border-neutral-100 pt-4">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-bold text-brand hover:underline"
                >
                  Daftar di sini
                </button>
              </div>
            </>
          ) : (
            /* ════════ FORM PENDAFTARAN PELANGGAN ════════ */
            <>
              <div className="text-center mb-6">
                <h1 className="font-display text-2xl font-extrabold uppercase text-ink">
                  Buat Akun Baru
                </h1>
                <p className="text-xs text-muted-text mt-1.5 leading-relaxed">
                  Daftar untuk mulai memesan sparepart Ninja 2-Tak favorit Anda.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <Input
                  label="Nama Lengkap"
                  name="name"
                  autoComplete="name"
                  required
                  icon={UserRound}
                  placeholder="Nama Lengkap"
                  value={registerForm.name}
                  onChange={handleRegisterChange}
                  error={fieldErrors.name}
                />

                <Input
                  label="Nomor WhatsApp"
                  name="whatsapp"
                  type="tel"
                  autoComplete="tel"
                  required
                  icon={Phone}
                  placeholder="08xxxxxxxxxx"
                  value={registerForm.whatsapp}
                  onChange={handleRegisterChange}
                  error={fieldErrors.whatsapp}
                />

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  icon={Mail}
                  placeholder="nama@email.com"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  error={fieldErrors.email}
                />

                <Input
                  label="Kata Sandi"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  icon={LockKeyhole}
                  placeholder="Minimal 8 karakter"
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  error={fieldErrors.password}
                />

                <Input
                  label="Ulangi Kata Sandi"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  icon={LockKeyhole}
                  placeholder="Ulangi kata sandi"
                  value={registerForm.confirmPassword}
                  onChange={handleRegisterChange}
                  error={fieldErrors.confirmPassword}
                />

                <Button type="submit" variant="primary" fullWidth loading={submitting}>
                  Daftar Sekarang
                </Button>
              </form>

              <div className="mt-6 text-center text-xs text-muted-text border-t border-neutral-100 pt-4">
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-brand hover:underline"
                >
                  Masuk di sini
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-neutral-100 px-6 sm:px-8 py-4 flex items-center justify-between bg-neutral-50/50">
          <Link to="/" className="text-xs text-muted-text hover:text-ink transition-colors">
            ← Kembali ke Katalog
          </Link>
          <span className="text-[11px] text-muted-text">PEPSO PARTS · SeptClouds</span>
        </div>
      </div>
    </div>
  );
}
