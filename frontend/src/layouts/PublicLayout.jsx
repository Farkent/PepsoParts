import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X, Shield, Bike } from 'lucide-react';
import Logo from '../components/ui/Logo';
import { useCart } from '../context/CartContext';
import { useMotor } from '../context/MotorContext';
import Button from '../components/ui/Button';
import FloatingChat from '../components/chat/FloatingChat';

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [motorModalOpen, setMotorModalOpen] = useState(false);
  const { totalItems } = useCart();
  const { selectedMotor, motorTypes, selectMotor } = useMotor();
  const location = useLocation();

  const navLinks = [
    { label: 'Katalog', path: '/' },
    { label: 'Tentang', path: '/tentang' },
    { label: 'Kontak', path: '/kontak' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-ink">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Motor Selector */}
          <div className="flex items-center gap-6">
            <Logo size="md" />

            {/* Selector Motor Saya (Desktop) */}
            <button
              onClick={() => setMotorModalOpen(true)}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 text-xs border border-neutral-300 hover:border-brand rounded-sm bg-neutral-50 transition-colors"
            >
              <Bike className="w-3.5 h-3.5 text-brand" />
              <span className="text-muted-text">Motor Saya:</span>
              <span className="font-bold text-ink">
                {selectedMotor ? selectedMotor.name : 'Pilih Motor'}
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`font-display text-sm uppercase tracking-wider font-bold transition-colors ${
                    isActive ? 'text-brand' : 'text-ink hover:text-brand'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Tombol Keranjang */}
            <Link
              to="/keranjang"
              className="relative p-2 text-ink hover:text-brand transition-colors focus:outline-none"
              aria-label="Keranjang Belanja"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* Tombol ADMIN (Outline) */}
            <Link to="/admin/login" className="hidden sm:inline-block">
              <Button variant="outline" size="sm" icon={Shield}>
                Admin
              </Button>
            </Link>

            {/* Hamburger Button (Mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-ink hover:text-brand focus:outline-none"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-4">
            {/* Motor Saya di Mobile */}
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
              <div className="text-xs text-muted-text uppercase font-bold mb-1.5 flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-brand" />
                Motor Saya
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {selectedMotor ? selectedMotor.name : 'Belum dipilih'}
                </span>
                <button
                  onClick={() => {
                    setMotorModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-brand font-bold uppercase underline"
                >
                  Ganti
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 font-display text-base uppercase tracking-wider font-bold rounded-sm ${
                      isActive ? 'bg-brand text-white' : 'text-ink hover:bg-neutral-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 font-display text-base uppercase tracking-wider font-bold text-neutral-600 hover:text-brand border border-neutral-200 rounded-sm flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-brand" />
                Portal Admin
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-300 border-t border-neutral-800 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-neutral-800">
            <div>
              <Logo size="md" isDark={true} />
              <p className="mt-4 text-xs text-neutral-400 leading-relaxed max-w-sm">
                Spesialis sparepart bekas copotan original Kawasaki Ninja 2-Tak (Ninja R, Ninja RR, Ninja SS).
                Kejujuran kondisi, garansi fisik sesuai deskripsi.
              </p>
            </div>
            <div>
              <h4 className="font-display uppercase tracking-wider font-bold text-white mb-3">Tautan Cepat</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/" className="hover:text-brand">Katalog Sparepart</Link></li>
                <li><Link to="/tentang" className="hover:text-brand">Tentang PEPSO PARTS</Link></li>
                <li><Link to="/kontak" className="hover:text-brand">Hubungi Kami & Lokasi</Link></li>
                <li><Link to="/admin/login" className="hover:text-brand">Login Admin</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display uppercase tracking-wider font-bold text-white mb-3">Pemesanan & Bantuan</h4>
              <p className="text-xs text-neutral-400 leading-relaxed mb-2">
                Punya pertanyaan ketersediaan atau kecocokan part? Gunakan fitur chat asisten atau hubungi langsung via WhatsApp.
              </p>
              <div className="text-xs text-neutral-400">
                <span className="font-bold text-white">Jam Layanan:</span> 08:30 - 17:00 WIB
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
            <span>© {new Date().getFullYear()} PEPSO PARTS · dibuat oleh SeptClouds</span>
            <span>Kawasaki Ninja 2-Stroke Specialist</span>
          </div>
        </div>
      </footer>

      {/* Modal Pemilihan Motor Saya */}
      {motorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full border border-neutral-300 p-6 shadow-xl rounded-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-brand" />
                <h3 className="font-display font-bold uppercase text-lg text-ink">Pilih Motor Anda</h3>
              </div>
              <button onClick={() => setMotorModalOpen(false)} className="text-neutral-400 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted-text mt-3 mb-4 leading-relaxed">
              Pilihan tipe motor memudahkan sistem menampilkan kecocokan suku cadang secara akurat pada katalog dan halaman detail.
            </p>

            <div className="space-y-2">
              {motorTypes.map((motor) => {
                const isSelected = selectedMotor?.id === motor.id;
                return (
                  <button
                    key={motor.id}
                    onClick={() => {
                      selectMotor(motor);
                      setMotorModalOpen(false);
                    }}
                    className={`w-full text-left p-3 border rounded-sm transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-brand bg-orange-50 text-brand font-bold'
                        : 'border-neutral-200 hover:border-neutral-400 text-ink'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold">{motor.name}</div>
                      <div className="text-[11px] text-muted-text">{motor.notes || `Tahun ${motor.year_from || '1996'} - ${motor.year_to || '2015'}`}</div>
                    </div>
                    {isSelected && <span className="text-xs uppercase font-bold text-brand">Aktif</span>}
                  </button>
                );
              })}

              {selectedMotor && (
                <button
                  onClick={() => {
                    selectMotor(null);
                    setMotorModalOpen(false);
                  }}
                  className="w-full mt-2 py-2 text-xs text-neutral-500 hover:text-red-600 underline font-semibold text-center"
                >
                  Reset / Hapus Pilihan Motor
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Chat Assistant */}
      <FloatingChat />
    </div>
  );
}

