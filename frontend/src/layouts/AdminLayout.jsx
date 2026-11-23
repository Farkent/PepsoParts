import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  FolderTree,
  Bike,
  ShoppingCart,
  FileBarChart,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  UserCheck,
  Users,
} from 'lucide-react';
import Logo from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { adminGetOrderNotifications } from '../api/endpoints';
import { useToast } from '../context/ToastContext';

export default function AdminLayout() {
  const { admin, logout, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { success } = useToast();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [orderNotificationCount, setOrderNotificationCount] = useState(0);
  const lastCustomerReceivedCount = useRef(null);

  // Poll pesanan baru dan konfirmasi penerimaan pelanggan tiap 10 detik.
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchOrderCount = () => {
      adminGetOrderNotifications()
        .then((res) => {
          if (res?.data?.count !== undefined) {
            setOrderNotificationCount(Number(res.data.count) || 0);
          }
          const receivedCount = Number(res?.data?.customer_received) || 0;
          if (lastCustomerReceivedCount.current !== null && receivedCount > lastCustomerReceivedCount.current) {
            const newReceivedCount = receivedCount - lastCustomerReceivedCount.current;
            success(
              newReceivedCount === 1
                ? 'Pelanggan mengonfirmasi bahwa pesanan telah diterima.'
                : `${newReceivedCount} pelanggan mengonfirmasi pesanan telah diterima.`
            );
          }
          lastCustomerReceivedCount.current = receivedCount;
        })
        .catch(() => {});
    };

    fetchOrderCount();
    const interval = setInterval(fetchOrderCount, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, location.pathname, success]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center text-white font-display text-lg tracking-wider">
        MEMUAT SESI ADMIN...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Kelola Produk', path: '/admin/produk', icon: Package },
    { label: 'Kelola Stok', path: '/admin/stok', icon: Layers },
    { label: 'Kategori', path: '/admin/kategori', icon: FolderTree },
    { label: 'Tipe Motor', path: '/admin/tipe-motor', icon: Bike },
    { label: 'Pesanan', path: '/admin/pesanan', icon: ShoppingCart, badge: orderNotificationCount > 0 ? orderNotificationCount : null },
    { label: 'Kelola Pengguna', path: '/admin/pengguna', icon: Users },
    { label: 'Laporan', path: '/admin/laporan', icon: FileBarChart },
    { label: 'Pengaturan', path: '/admin/pengaturan', icon: Settings },
  ];

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sesi admin?')) {
      await logout();
      navigate('/login');
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-sidebar text-white p-4 select-none">
      <div>
        {/* Brand Header */}
        <div className="pb-6 mb-4 border-b border-sidebar-divider">
          <Logo size="md" isDark={true} to="/admin" />
        </div>

        {/* User Chip */}
        <div className="bg-sidebar-user p-2.5 rounded-sm border border-sidebar-divider mb-6 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center font-bold text-xs">
            AP
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate">{admin?.name || 'Admin PEPSO'}</div>
            <div className="text-[10px] text-neutral-400">Pemilik bisnis</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileDrawerOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 text-xs font-bold font-display uppercase tracking-wider rounded-sm transition-colors ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-neutral-300 hover:bg-sidebar-active hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand-dark text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="pt-4 border-t border-sidebar-divider space-y-2">
        <Link
          to="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 text-xs font-display uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Lihat Katalog Publik</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-display uppercase tracking-wider text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-sm transition-colors text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>

        <div className="text-[10px] text-neutral-500 pt-2 px-3">
          PEPSO Admin v1.0 oleh SeptClouds
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-muted-bg text-ink">
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-sidebar-divider">
        <div className="fixed top-0 bottom-0 w-64">
          {sidebarContent}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-neutral-200 h-14 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-1.5 text-neutral-600 hover:text-ink focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-text">
              PEPSO PARTS · PORTAL ADMIN
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Sistem Aktif</span>
            </div>
            <Link
              to="/"
              target="_blank"
              className="text-xs font-display uppercase font-bold text-brand hover:text-brand-dark flex items-center gap-1"
            >
              Katalog <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </div>
  );
}

