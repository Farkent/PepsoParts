import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { createOrder, validateCart } from '../../api/endpoints';
import { formatRupiah } from '../../utils/format';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';

export default function CheckoutPage() {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_whatsapp: '',
    customer_address: '',
    customer_note: '',
    website: '', // Honeypot field
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [stockIssues, setStockIssues] = useState([]);

  // Check cart stock availability on load
  useEffect(() => {
    if (items.length === 0) return;

    let isMounted = true;
    setValidating(true);

    const payload = items.map((i) => ({
      product_id: i.id,
      quantity: i.quantity,
    }));

    validateCart(payload)
      .then((res) => {
        if (!isMounted) return;
        if (res.data && res.data.items) {
          const issues = res.data.items.filter((item) => !item.valid);
          setStockIssues(issues);
        }
      })
      .catch((err) => {
        console.error('Validation error:', err);
      })
      .finally(() => {
        if (isMounted) setValidating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-ink mb-2">
          Keranjang Kosong
        </h1>
        <p className="text-muted-text text-sm mb-6">
          Tidak ada barang untuk di-checkout. Silakan pilih suku cadang terlebih dahulu.
        </p>
        <Link to="/">
          <Button variant="primary">Katalog Suku Cadang</Button>
        </Link>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic client validation
    const errors = {};
    if (!formData.customer_name.trim()) {
      errors.customer_name = 'Nama lengkap wajib diisi.';
    }
    const wa = formData.customer_whatsapp.replace(/\D/g, '');
    if (!wa) {
      errors.customer_whatsapp = 'Nomor WhatsApp wajib diisi.';
    } else if (wa.length < 9 || wa.length > 15) {
      errors.customer_whatsapp = 'Nomor WhatsApp tidak valid (contoh: 081234567890).';
    }
    if (!formData.customer_address.trim()) {
      errors.customer_address = 'Alamat pengiriman wajib diisi lengkap.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        customer_name: formData.customer_name.trim(),
        customer_whatsapp: formData.customer_whatsapp.trim(),
        customer_address: formData.customer_address.trim(),
        customer_note: formData.customer_note.trim(),
        website: formData.website, // Honeypot
        items: items.map((i) => ({
          product_id: i.id,
          quantity: i.quantity,
        })),
      };

      const res = await createOrder(payload);

      if (res.data && res.data.success) {
        success('Pesanan berhasil dibuat!');
        clearCart();
        const { order_code, public_token, whatsapp_url } = res.data.data;

        // Redirect to order tracking page
        navigate(`/pesanan/${order_code}?token=${encodeURIComponent(public_token)}`, {
          state: { isNewOrder: true, whatsappUrl: whatsapp_url },
        });
      } else {
        toastError(res.data?.message || 'Gagal membuat pesanan.');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      const msg = err.response?.data?.message || 'Terjadi kesalahan saat memproses pesanan.';
      toastError(msg);
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          to="/keranjang"
          className="inline-flex items-center gap-2 text-sm text-muted-text hover:text-brand transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Keranjang
        </Link>
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-ink mb-6">
        Konfirmasi Pemesanan
      </h1>

      {/* Stock warning banner if any item is out of stock */}
      {stockIssues.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-sm flex items-start gap-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold">Perhatian Ketersediaan Stok</p>
            <p className="text-xs mt-0.5">
              Beberapa barang di keranjang mengalami perubahan ketersediaan. Silakan periksa kembali keranjang Anda.
            </p>
            <ul className="list-disc list-inside mt-2 text-xs space-y-0.5">
              {stockIssues.map((issue) => (
                <li key={issue.product_id}>{issue.error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Pelanggan */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-sm p-6 space-y-5">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-ink pb-3 border-b border-neutral-200">
              Data Penerima & Pengiriman
            </h2>

            {/* Honeypot field (hidden from real users) */}
            <div style={{ display: 'none' }}>
              <label htmlFor="website">Website (Leave blank)</label>
              <input
                type="text"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Nama Lengkap */}
            <div>
              <Input
                label="Nama Lengkap *"
                name="customer_name"
                placeholder="Contoh: Budi Prasetyo"
                value={formData.customer_name}
                onChange={handleChange}
                error={fieldErrors.customer_name}
                required
              />
            </div>

            {/* Nomor WhatsApp */}
            <div>
              <Input
                label="Nomor WhatsApp (Aktif) *"
                name="customer_whatsapp"
                placeholder="Contoh: 081234567890"
                value={formData.customer_whatsapp}
                onChange={handleChange}
                error={fieldErrors.customer_whatsapp}
                required
              />
              <p className="text-[11px] text-muted-text mt-1">
                Admin akan menghubungi nomor ini untuk konfirmasi stok, ongkos kirim, dan metode pembayaran.
              </p>
            </div>

            {/* Alamat Pengiriman */}
            <div>
              <Textarea
                label="Alamat Pengiriman Lengkap *"
                name="customer_address"
                rows={3}
                placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Kode Pos"
                value={formData.customer_address}
                onChange={handleChange}
                error={fieldErrors.customer_address}
                required
              />
            </div>

            {/* Catatan Tambahan */}
            <div>
              <Textarea
                label="Catatan Tambahan (Opsional)"
                name="customer_note"
                rows={2}
                placeholder="Contoh: Titip di pos satpam atau pastikan baut pengikat lengkap ya gan"
                value={formData.customer_note}
                onChange={handleChange}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting || validating}
                disabled={stockIssues.length > 0}
                className="w-full justify-center"
              >
                Buat Pesanan Sekarang ({formatRupiah(totalPrice)})
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-text justify-center pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Transaksi aman & langsung terhubung dengan owner PEPSO PARTS.</span>
            </div>
          </form>
        </div>

        {/* Ringkasan Barang di Sebelah Kanan */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-5 sticky top-24">
            <h3 className="font-display text-base font-bold uppercase tracking-wide text-ink pb-3 border-b border-neutral-200">
              Daftar Barang ({totalItems})
            </h3>

            <div className="divide-y divide-neutral-200 max-h-80 overflow-y-auto py-2">
              {items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">{item.name}</p>
                    <p className="text-muted-text">
                      {item.quantity} x {formatRupiah(item.price)}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-ink whitespace-nowrap">
                    {formatRupiah(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-neutral-200 space-y-2 text-sm">
              <div className="flex justify-between font-bold text-ink pt-1 border-t border-neutral-300">
                <span>Total Belanja</span>
                <span className="font-display text-xl text-brand">{formatRupiah(totalPrice)}</span>
              </div>
              <p className="text-[11px] text-muted-text italic">
                * Belum termasuk ongkos kirim ekspedisi (J&T, JNE, SiCepat, dll).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
