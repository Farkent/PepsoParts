import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import HomePage from './pages/public/HomePage';
import NotFoundPage from './pages/public/NotFoundPage';

// Lazy-load rute yang tidak kritis di awal
const ProductDetailPage = lazy(() => import('./pages/public/ProductDetailPage'));
const AboutPage         = lazy(() => import('./pages/public/AboutPage'));
const ContactPage       = lazy(() => import('./pages/public/ContactPage'));

// Admin - semua lazy-load
const AdminLayout    = lazy(() => import('./layouts/AdminLayout'));
const LoginPage      = lazy(() => import('./pages/admin/LoginPage'));
const DashboardPage  = lazy(() => import('./pages/admin/DashboardPage'));

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-xs font-display font-bold text-muted-text uppercase tracking-widest">
        Memuat...
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Rute Publik ── */}
        <Route element={<PublicLayout />}>
          <Route path="/"       element={<HomePage />} />
          <Route path="/tentang" element={<AboutPage />} />
          <Route path="/kontak"  element={<ContactPage />} />
          <Route path="/produk/:slug" element={<ProductDetailPage />} />
          <Route path="*"       element={<NotFoundPage />} />
        </Route>

        {/* ── Login Admin (standalone, tanpa layout publik) ── */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* ── Rute Admin (dilindungi AuthMiddleware di AdminLayout) ── */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index             element={<DashboardPage />} />
          <Route path="produk"     element={<DashboardPage />} />
          <Route path="stok"       element={<DashboardPage />} />
          <Route path="kategori"   element={<DashboardPage />} />
          <Route path="tipe-motor" element={<DashboardPage />} />
          <Route path="pesanan"    element={<DashboardPage />} />
          <Route path="laporan"    element={<DashboardPage />} />
          <Route path="pengaturan" element={<DashboardPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
