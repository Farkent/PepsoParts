import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  Package,
  XCircle,
  MessageCircle,
  ArrowLeft,
  Copy,
  Check,
  MapPin,
  FileText,
} from 'lucide-react';
import { getOrderByCode, getPublicSettings } from '../../api/endpoints';
import { formatRupiah, formatDate } from '../../utils/format';
import { StatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';

export default function OrderTrackingPage() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getPublicSettings()
      .then((res) => setSettings(res.data?.data || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!code || !token) {
      setError('Tautan pelacakan pesanan tidak lengkap atau token tidak valid.');
      setLoading(false);
      return;
    }

    setLoading(true);
    getOrderByCode(code, token)
      .then((res) => {
        if (res.data && res.data.data) {
          setOrder(res.data.data);
        } else {
          setError('Pesanan tidak ditemukan.');
        }
      })
      .catch((err) => {
        console.error('Fetch order error:', err);
        setError(err.response?.data?.message || 'Gagal memuat detail pesanan.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code, token]);

  const copyOrderCode = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.order_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppChatUrl = () => {
    if (!order) return '#';
    const phone = settings?.whatsapp_number?.replace(/\D/g, '') || '628123456789';
    const msg = `Halo PEPSO PARTS! Mau cek status pesanan saya dengan kode: *${order.order_code}* a.n *${order.customer_name}*. Terima kasih!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <XCircle className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-ink mb-2">
          Pesanan Tidak Ditemukan
        </h1>
        <p className="text-muted-text text-sm mb-6 max-w-md mx-auto">
          {error || 'Silakan periksa kembali tautan pesanan Anda atau hubungi admin.'}
        </p>
        <Link to="/">
          <Button variant="primary">Kembali ke Beranda</Button>
        </Link>
      </div>
    );
  }

  const steps = [
    { key: 'new', label: 'Pesanan Dibuat', icon: Clock },
    { key: 'confirmed', label: 'Dikonfirmasi', icon: Package },
    { key: 'completed', label: 'Selesai', icon: CheckCircle },
  ];

  const currentStepIndex =
    order.status === 'cancelled'
      ? -1
      : order.status === 'completed'
      ? 2
      : order.status === 'confirmed'
      ? 1
      : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner for newly placed orders */}
      {location.state?.isNewOrder && (
        <div className="mb-8 p-5 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-900">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-wide">
                Pesanan Berhasil Dikirim!
              </h2>
              <p className="text-sm mt-1 text-emerald-800 leading-relaxed">
                Terima kasih telah memesan di PEPSO PARTS. Kode pesanan Anda adalah{' '}
                <strong className="font-mono">{order.order_code}</strong>. Simpan tautan halaman ini untuk memantau status pesanan Anda.
              </p>
              {location.state?.whatsappUrl && (
                <div className="mt-3">
                  <a
                    href={location.state.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Konfirmasi Sekarang ke WhatsApp Admin
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white border border-neutral-200 rounded-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <span className="text-xs text-muted-text uppercase font-semibold">Kode Pesanan</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xl sm:text-2xl font-extrabold text-ink tracking-wider">
                {order.order_code}
              </span>
              <button
                onClick={copyOrderCode}
                className="p-1.5 text-neutral-400 hover:text-brand transition-colors rounded-sm"
                title="Salin Kode"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-text mt-1">
              Tanggal: {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <span className="text-xs text-muted-text">Status Pesanan:</span>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Status Tracker */}
        {order.status === 'cancelled' ? (
          <div className="mt-6 p-4 bg-neutral-100 border border-neutral-200 rounded-sm flex items-center gap-3 text-neutral-700">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm font-medium">Pesanan ini telah dibatalkan.</span>
          </div>
        ) : (
          <div className="mt-6 pt-2">
            <div className="grid grid-cols-3 gap-2 text-center relative">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors mb-2 ${
                        isDone
                          ? 'bg-brand text-white'
                          : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                      } ${isCurrent ? 'ring-4 ring-orange-100' : ''}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        isDone ? 'text-ink' : 'text-neutral-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="bg-white border border-neutral-200 rounded-sm p-6 mb-6">
        <h3 className="font-display text-base font-bold uppercase tracking-wide text-ink mb-4 pb-2 border-b border-neutral-200">
          Rincian Barang yang Dipesan
        </h3>

        <div className="divide-y divide-neutral-100">
          {(order.items || []).map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4 text-sm">
              <div>
                <p className="font-bold text-ink">{item.product_name}</p>
                <p className="text-xs text-muted-text mt-0.5">
                  {item.quantity} x {formatRupiah(item.unit_price)}
                </p>
              </div>
              <span className="font-mono font-bold text-ink whitespace-nowrap">
                {formatRupiah(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-neutral-200 flex justify-between items-baseline">
          <span className="font-display font-bold uppercase text-base text-ink">Total Pembayaran</span>
          <span className="font-display font-black text-2xl text-brand">
            {formatRupiah(order.total_amount)}
          </span>
        </div>
      </div>

      {/* Recipient Info & Admin Note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Recipient Details */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-5 space-y-3">
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand" />
            Informasi Pengiriman
          </h4>
          <div className="text-xs space-y-1.5 text-neutral-700">
            <p>
              <strong className="text-ink">Penerima:</strong> {order.customer_name}
            </p>
            <p>
              <strong className="text-ink">WhatsApp:</strong> {order.customer_whatsapp}
            </p>
            <div>
              <strong className="text-ink">Alamat:</strong>
              <p className="mt-0.5 whitespace-pre-line text-neutral-600">{order.customer_address}</p>
            </div>
            {order.customer_note && (
              <div className="pt-1">
                <strong className="text-ink">Catatan Pelanggan:</strong>
                <p className="mt-0.5 italic text-neutral-600">"{order.customer_note}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Admin Note / Status Info */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-5 space-y-3">
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand" />
            Catatan Dari Toko
          </h4>
          <div className="text-xs text-neutral-700">
            {order.admin_note ? (
              <div className="p-3 bg-white border border-neutral-200 rounded-sm whitespace-pre-line text-neutral-800 font-medium">
                {order.admin_note}
              </div>
            ) : (
              <p className="text-muted-text italic">
                Belum ada catatan khusus atau nomor resi dari admin. Admin akan menghubungi Anda melalui WhatsApp jika ada pembaruan pengiriman.
              </p>
            )}
          </div>

          <div className="pt-2">
            <a
              href={getWhatsAppChatUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Tanyakan Pesanan via WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-text hover:text-brand font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Katalog
        </Link>
      </div>
    </div>
  );
}

