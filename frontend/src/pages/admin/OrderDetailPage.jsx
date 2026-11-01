import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle,
  XCircle,
  Truck,
  Save,
  Clock,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import {
  adminGetOrder,
  adminPatchOrderStatus,
  adminPatchOrderNote,
} from '../../api/endpoints';
import { formatRupiah, formatDate } from '../../utils/format';
import { StatusBadge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import Skeleton from '../../components/ui/Skeleton';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await adminGetOrder(id);
      if (res.data && res.data.success) {
        setOrder(res.data.data);
        setNote(res.data.data.admin_note || '');
      } else {
        toastError('Pesanan tidak ditemukan.');
        navigate('/admin/pesanan');
      }
    } catch (err) {
      console.error('Fetch order detail error:', err);
      toastError('Gagal memuat rincian pesanan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    const confirmMsg =
      newStatus === 'cancelled'
        ? 'Apakah Anda yakin ingin MEMBATALKAN pesanan ini? Stok barang akan dikembalikan ke katalog jika sebelumnya pesanan sudah dikonfirmasi.'
        : `Ubah status pesanan menjadi "${newStatus}"?`;

    if (!window.confirm(confirmMsg)) return;

    setUpdatingStatus(true);
    try {
      const res = await adminPatchOrderStatus(id, newStatus);
      if (res.data && res.data.success) {
        success('Status pesanan berhasil diperbarui.');
        fetchOrder();
      } else {
        toastError(res.data?.message || 'Gagal mengubah status.');
      }
    } catch (err) {
      console.error('Update status error:', err);
      toastError(err.response?.data?.message || 'Gagal mengubah status pesanan.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const res = await adminPatchOrderNote(id, note);
      if (res.data && res.data.success) {
        success('Catatan admin berhasil disimpan.');
      } else {
        toastError('Gagal menyimpan catatan.');
      }
    } catch (err) {
      console.error('Save note error:', err);
      toastError('Gagal menyimpan catatan admin.');
    } finally {
      setSavingNote(false);
    }
  };

  const getCustomerWhatsAppUrl = () => {
    if (!order) return '#';
    const wa = order.customer_whatsapp.replace(/\D/g, '');
    const msg =
      `Halo Kak *${order.customer_name}*, terima kasih telah memesan di PEPSO PARTS!\n\n` +
      `Pesanan: *${order.order_code}*\n` +
      `Total: *${formatRupiah(order.total_amount)}*\n\n` +
      `Apakah ada yang perlu kami konfirmasikan mengenai alamat dan ekspedisi pengiriman?`;
    return `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/pesanan"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-text hover:text-brand"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Pesanan
        </Link>
        <span className="font-mono text-xs text-muted-text">
          ID DB: #{order.id} | Dibuat: {formatDate(order.created_at)}
        </span>
      </div>

      {/* Main Header Card */}
      <div className="bg-white border border-neutral-200 rounded-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase text-muted-text font-bold">Kode Pesanan</span>
          <h1 className="font-mono text-2xl md:text-3xl font-extrabold text-ink tracking-wider mt-0.5">
            {order.order_code}
          </h1>
          <p className="text-xs text-muted-text mt-1">
            Pelanggan: <strong className="text-ink">{order.customer_name}</strong> ({order.customer_whatsapp})
          </p>
        </div>

        {/* Status & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="mr-2">
            <StatusBadge status={order.status} />
          </div>

          {order.status === 'new' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle}
                loading={updatingStatus}
                onClick={() => handleStatusChange('confirmed')}
              >
                Konfirmasi
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={XCircle}
                disabled={updatingStatus}
                onClick={() => handleStatusChange('cancelled')}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                Batalkan
              </Button>
            </>
          )}

          {order.status === 'confirmed' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={Truck}
                loading={updatingStatus}
                onClick={() => handleStatusChange('completed')}
              >
                Tandai Selesai
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={XCircle}
                disabled={updatingStatus}
                onClick={() => handleStatusChange('cancelled')}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                Batalkan
              </Button>
            </>
          )}

          <a
            href={getCustomerWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Chat WhatsApp
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer & Shipping Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-sm p-5 space-y-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink border-b border-neutral-200 pb-2">
              Informasi Pelanggan
            </h3>
            <div className="text-xs space-y-2 text-neutral-700">
              <div>
                <span className="text-muted-text block">Nama Lengkap</span>
                <span className="font-bold text-ink">{order.customer_name}</span>
              </div>
              <div>
                <span className="text-muted-text block">Nomor WhatsApp</span>
                <span className="font-mono font-bold text-ink">{order.customer_whatsapp}</span>
              </div>
              <div>
                <span className="text-muted-text block">Alamat Pengiriman</span>
                <p className="mt-1 whitespace-pre-line text-neutral-800 leading-relaxed bg-neutral-50 p-2.5 rounded-sm border border-neutral-200">
                  {order.customer_address}
                </p>
              </div>
              {order.customer_note && (
                <div>
                  <span className="text-muted-text block">Catatan Pelanggan</span>
                  <p className="mt-1 italic text-neutral-800 bg-neutral-50 p-2.5 rounded-sm border border-neutral-200">
                    "{order.customer_note}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Note Section */}
          <div className="bg-white border border-neutral-200 rounded-sm p-5 space-y-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink border-b border-neutral-200 pb-2">
              Catatan Internal Admin / Resi
            </h3>
            <p className="text-[11px] text-muted-text">
              Catatan ini dapat dilihat oleh pelanggan di halaman pelacakan pesanan mereka (misal: nomor resi pengiriman J&T).
            </p>
            <Textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: No Resi J&T: JT8891029312. Paket sudah dipacking kayu."
              className="text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              icon={Save}
              loading={savingNote}
              onClick={handleSaveNote}
              className="w-full justify-center"
            >
              Simpan Catatan
            </Button>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="md:col-span-2">
          <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink">
                Barang yang Dipesan
              </h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 font-display uppercase tracking-wider text-neutral-600">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Produk</th>
                  <th className="py-2.5 px-4 font-bold text-right">Harga Satuan</th>
                  <th className="py-2.5 px-4 font-bold text-center">Jumlah</th>
                  <th className="py-2.5 px-4 font-bold text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(order.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-ink">{item.product_name}</p>
                      <p className="text-[11px] font-mono text-muted-text">ID: #{item.product_id}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatRupiah(item.unit_price)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-ink">
                      {formatRupiah(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-neutral-50 border-t border-neutral-200 font-bold">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right uppercase font-display text-sm text-ink">
                    Total Pesanan
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-base text-brand">
                    {formatRupiah(order.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
