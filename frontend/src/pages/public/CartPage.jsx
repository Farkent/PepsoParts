import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatRupiah } from '../../utils/format';
import Button from '../../components/ui/Button';

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-ink mb-2">
          Keranjang Belanja Kosong
        </h1>
        <p className="text-muted-text text-sm max-w-md mx-auto mb-8">
          Belum ada suku cadang Kawasaki Ninja 2-Tak yang kamu masukkan ke keranjang. Jelajahi katalog kami sekarang!
        </p>
        <Link to="/">
          <Button variant="primary" size="lg" icon={ArrowRight}>
            Jelajahi Katalog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb / Back */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-text hover:text-brand transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Lanjut Belanja
        </Link>
        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:text-red-700 font-semibold underline cursor-pointer"
        >
          Kosongkan Keranjang
        </button>
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-ink mb-6">
        Keranjang Belanja ({totalItems} Item)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const subtotal = item.price * item.quantity;
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-neutral-200 rounded-sm gap-4 hover:border-neutral-300 transition-colors"
              >
                {/* Image & Info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-20 h-20 bg-neutral-100 rounded-sm flex-shrink-0 overflow-hidden border border-neutral-200">
                    {item.primary_image ? (
                      <img
                        src={item.primary_image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                        Foto
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-mono font-semibold text-brand tracking-wider uppercase">
                      {item.code || `ID: ${item.id}`}
                    </span>
                    <h3 className="font-display text-base font-bold text-ink uppercase tracking-wide truncate">
                      <Link to={`/produk/${item.slug || item.id}`} className="hover:text-brand">
                        {item.name}
                      </Link>
                    </h3>
                    <p className="text-sm font-bold text-neutral-900 mt-0.5">
                      {formatRupiah(item.price)}
                    </p>
                    {item.stock <= 3 && item.stock > 0 && (
                      <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                        Tersisa {item.stock} item
                      </p>
                    )}
                  </div>
                </div>

                {/* Controls & Subtotal */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-neutral-300 rounded-sm">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-1.5 text-neutral-600 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Kurangi kuantitas"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 text-xs font-mono font-bold text-ink min-w-[32px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      disabled={item.stock ? item.quantity >= item.stock : false}
                      className="p-1.5 text-neutral-600 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Tambah kuantitas"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[100px]">
                    <span className="block text-xs text-muted-text">Subtotal</span>
                    <span className="font-bold text-ink text-sm sm:text-base">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                    title="Hapus dari keranjang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-6 sticky top-24">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-ink pb-4 border-b border-neutral-200">
              Ringkasan Pesanan
            </h2>

            <div className="py-4 space-y-2 text-sm border-b border-neutral-200">
              <div className="flex justify-between text-muted-text">
                <span>Total Barang</span>
                <span className="font-medium text-ink">{totalItems} item</span>
              </div>
              <div className="flex justify-between text-muted-text">
                <span>Subtotal</span>
                <span className="font-medium text-ink">{formatRupiah(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-muted-text text-xs italic">
                <span>Ongkos Kirim</span>
                <span>Dihitung admin via WhatsApp</span>
              </div>
            </div>

            <div className="py-4 flex justify-between items-baseline">
              <span className="font-display font-bold uppercase text-base text-ink">Total</span>
              <span className="font-display font-black text-2xl text-brand">
                {formatRupiah(totalPrice)}
              </span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center"
              icon={ArrowRight}
              onClick={() => navigate('/checkout')}
            >
              Lanjut ke Pembayaran
            </Button>

            <div className="mt-4 p-3 bg-white border border-neutral-200 rounded-sm text-xs text-muted-text leading-relaxed">
              <p className="font-bold text-ink mb-1">🛵 Informasi Pemesanan</p>
              Setelah mengisi form checkout, pesananmu akan diteruskan langsung ke WhatsApp owner PEPSO PARTS untuk konfirmasi ketersediaan & ongkir.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
