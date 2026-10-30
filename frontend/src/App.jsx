import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import HomePage from './pages/public/HomePage';
import NotFoundPage from './pages/public/NotFoundPage';

// Lazy loading untuk rute admin dan sekunder
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const LoginPage = lazy(() => import('./pages/admin/LoginPage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-display font-bold text-ink">
          MEMUAT...
        </div>
      }
    >
      <Routes>
        {/* Rute Publik */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tentang" element={<HomePage />} />
          <Route path="/kontak" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Login Admin */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Rute Admin (Dilindungi Auth) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="produk" element={<DashboardPage />} />
          <Route path="stok" element={<DashboardPage />} />
          <Route path="kategori" element={<DashboardPage />} />
          <Route path="tipe-motor" element={<DashboardPage />} />
          <Route path="pesanan" element={<DashboardPage />} />
          <Route path="laporan" element={<DashboardPage />} />
          <Route path="pengaturan" element={<DashboardPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

