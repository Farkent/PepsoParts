import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import HomePage from './pages/public/HomePage';
import NotFoundPage from './pages/public/NotFoundPage';

// Lazy-load rute publik
const ProductDetailPage = lazy(() => import('./pages/public/ProductDetailPage'));
const AboutPage         = lazy(() => import('./pages/public/AboutPage'));
const ContactPage       = lazy(() => import('./pages/public/ContactPage'));
const CartPage          = lazy(() => import('./pages/public/CartPage'));
const CheckoutPage      = lazy(() => import('./pages/public/CheckoutPage'));
const OrderTrackingPage = lazy(() => import('./pages/public/OrderTrackingPage'));

// Lazy-load rute admin
const AdminLayout       = lazy(() => import('./layouts/AdminLayout'));
const LoginPage         = lazy(() => import('./pages/admin/LoginPage'));
const DashboardPage     = lazy(() => import('./pages/admin/DashboardPage'));
const ProductsPage      = lazy(() => import('./pages/admin/ProductsPage'));
const ProductFormPage   = lazy(() => import('./pages/admin/ProductFormPage'));
const StockPage         = lazy(() => import('./pages/admin/StockPage'));
const CategoriesPage    = lazy(() => import('./pages/admin/CategoriesPage'));
const MotorTypesPage    = lazy(() => import('./pages/admin/MotorTypesPage'));
const OrdersPage        = lazy(() => import('./pages/admin/OrdersPage'));
const OrderDetailPage   = lazy(() => import('./pages/admin/OrderDetailPage'));
const ReportsPage       = lazy(() => import('./pages/admin/ReportsPage'));
const SettingsPage      = lazy(() => import('./pages/admin/SettingsPage'));

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
          <Route path="/keranjang" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/pesanan/:code" element={<OrderTrackingPage />} />
          <Route path="*"       element={<NotFoundPage />} />
        </Route>

        {/* ── Login Admin (standalone) ── */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* ── Rute Admin (dilindungi AdminLayout) ── */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="produk" element={<ProductsPage />} />
          <Route path="produk/tambah" element={<ProductFormPage />} />
          <Route path="produk/edit/:id" element={<ProductFormPage />} />
          <Route path="stok" element={<StockPage />} />
          <Route path="kategori" element={<CategoriesPage />} />
          <Route path="tipe-motor" element={<MotorTypesPage />} />
          <Route path="pesanan" element={<OrdersPage />} />
          <Route path="pesanan/:id" element={<OrderDetailPage />} />
          <Route path="laporan" element={<ReportsPage />} />
          <Route path="pengaturan" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
