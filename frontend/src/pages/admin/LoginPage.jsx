import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/ui/Logo';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      success('Login berhasil. Selamat datang, Admin!');
      navigate('/admin', { replace: true });
    } catch (err) {
      error(err.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full p-8 border border-neutral-300 shadow-2xl rounded-sm">
        <div className="text-center mb-6">
          <div className="inline-block mb-3">
            <Logo size="lg" to={null} />
          </div>
          <div className="text-xs font-display font-bold uppercase tracking-widest text-muted-text">
            Portal Pemilik & Inventaris
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Admin"
            type="email"
            required
            icon={Mail}
            placeholder="admin@pepsoparts.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Kata Sandi"
            type="password"
            required
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            Masuk ke Admin
          </Button>
        </form>

        <div className="mt-6 text-center text-[11px] text-muted-text border-t border-neutral-100 pt-4">
          PEPSO PARTS Management System · SeptClouds
        </div>
      </div>
    </div>
  );
}

