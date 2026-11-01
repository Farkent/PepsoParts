import React, { useState, useEffect } from 'react';
import { Save, Lock, Store, Phone, MapPin, Clock, Facebook, ShoppingBag } from 'lucide-react';
import {
  adminGetSettings,
  adminUpdateSettings,
  adminChangePassword,
} from '../../api/endpoints';
import Button from '../../components/ui/Button';
import Input, { Textarea } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';

export default function SettingsPage() {
  const { success, error: toastError } = useToast();
  const [settings, setSettings] = useState({
    store_name: '',
    whatsapp_number: '',
    about_text: '',
    address: '',
    opening_hours: '',
    facebook_url: '',
    shopee_url: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    adminGetSettings()
      .then((res) => {
        setSettings((prev) => ({ ...prev, ...(res?.data || {}) }));
      })
      .catch((err) => {
        toastError(err.message || 'Gagal memuat pengaturan.');
      })
      .finally(() => setLoading(false));
  }, [toastError]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await adminUpdateSettings(settings);
      success('Pengaturan profil toko berhasil disimpan.');
    } catch (err) {
      toastError(err.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toastError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }
    setSavingPassword(true);
    try {
      await adminChangePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      success('Kata sandi admin berhasil diperbarui.');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toastError(err.message || 'Gagal mengubah kata sandi.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-muted-text font-display uppercase tracking-wider">
        Memuat pengaturan toko...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl pb-12">
      {/* Title */}
      <div>
        <div className="text-xs font-display uppercase tracking-widest font-bold text-brand">
          KONFIGURASI SISTEM
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-ink">
          Pengaturan Toko
        </h1>
        <p className="text-xs text-muted-text mt-0.5">
          Kelola profil toko publik, kontak WhatsApp, jam buka, dan keamanan akun pemilik.
        </p>
      </div>

      {/* Bagian 1: Profil Toko & Kontak */}
      <form onSubmit={handleSaveSettings} className="bg-white border border-neutral-200 rounded-sm p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
          <Store className="w-5 h-5 text-brand" />
          <h2 className="font-display font-bold uppercase text-base text-ink">
            Informasi Toko & Kontak
          </h2>
        </div>

        <Input
          label="Nama Toko"
          required
          value={settings.store_name}
          onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
        />

        <Input
          label="Nomor WhatsApp Pemilik"
          required
          icon={Phone}
          placeholder="Contoh: 6281234567890 (format angka)"
          helperText="Nomor ini digunakan untuk menerima pemesanan otomatis dari website."
          value={settings.whatsapp_number}
          onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
        />

        <Textarea
          label="Profil Singkat Toko"
          rows={3}
          value={settings.about_text}
          onChange={(e) => setSettings({ ...settings, about_text: e.target.value })}
          helperText="Tampil pada halaman 'Tentang Kami' dan footer katalog."
        />

        <Input
          label="Alamat Toko / Bengkel"
          icon={MapPin}
          placeholder="Jl. Sukarno Hatta No. 99, Malang, Jawa Timur"
          value={settings.address}
          onChange={(e) => setSettings({ ...settings, address: e.target.value })}
        />

        <Input
          label="Jam Layanan / Operasional"
          icon={Clock}
          placeholder="Senin - Sabtu: 08:30 - 17:00 WIB"
          value={settings.opening_hours}
          onChange={(e) => setSettings({ ...settings, opening_hours: e.target.value })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Input
            label="Tautan Facebook Marketplace"
            icon={Facebook}
            placeholder="https://facebook.com/..."
            value={settings.facebook_url}
            onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
          />

          <Input
            label="Tautan Shopee"
            icon={ShoppingBag}
            placeholder="https://shopee.co.id/..."
            value={settings.shopee_url}
            onChange={(e) => setSettings({ ...settings, shopee_url: e.target.value })}
          />
        </div>

        <div className="pt-3 border-t border-neutral-100 flex justify-end">
          <Button type="submit" variant="primary" icon={Save} loading={savingSettings}>
            Simpan Pengaturan
          </Button>
        </div>
      </form>

      {/* Bagian 2: Ganti Kata Sandi */}
      <form onSubmit={handleChangePassword} className="bg-white border border-neutral-200 rounded-sm p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
          <Lock className="w-5 h-5 text-brand" />
          <h2 className="font-display font-bold uppercase text-base text-ink">
            Ganti Kata Sandi Admin
          </h2>
        </div>

        <Input
          label="Kata Sandi Saat Ini"
          type="password"
          required
          placeholder="••••••••"
          value={passwordData.current_password}
          onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Kata Sandi Baru"
            type="password"
            required
            minLength={8}
            placeholder="Minimal 8 karakter"
            value={passwordData.new_password}
            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
          />

          <Input
            label="Konfirmasi Kata Sandi Baru"
            type="password"
            required
            minLength={8}
            placeholder="Ulangi kata sandi baru"
            value={passwordData.confirm_password}
            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
          />
        </div>

        <div className="pt-3 border-t border-neutral-100 flex justify-end">
          <Button type="submit" variant="secondary" icon={Save} loading={savingPassword}>
            Perbarui Kata Sandi
          </Button>
        </div>
      </form>
    </div>
  );
}

