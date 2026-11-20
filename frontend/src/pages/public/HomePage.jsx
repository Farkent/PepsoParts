import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, RefreshCw, Sparkles, Bot, ArrowRight } from 'lucide-react';
import ProductCard from '../../components/catalog/ProductCard';
import FilterSheet from '../../components/catalog/FilterSheet';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import { getProducts, getCategories, getMotorTypes } from '../../api/endpoints';
import { useDebounce } from '../../hooks/useDebounce';
import { useMotor } from '../../context/MotorContext';

const ALL_CATEGORIES = { id: 0, name: 'Semua', slug: '' };

export default function HomePage() {
  const { selectedMotor, motorTypes } = useMotor();
  const [searchParams, setSearchParams] = useSearchParams();

  // Inisialisasi state dari URL params
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    category:     searchParams.get('kategori') || '',
    motor_type:   searchParams.get('motor') || '',
    condition:    searchParams.get('kondisi') || '',
    availability: searchParams.get('status') || '',
    sort:         searchParams.get('urut') || 'default',
  });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const isFirstRender = useRef(true);

  // Muat kategori sekali
  useEffect(() => {
    getCategories()
      .then((res) => setCategories([ALL_CATEGORIES, ...(res?.data || [])]))
      .catch(() => setCategories([ALL_CATEGORIES]));
  }, []);

  // Hitung jumlah filter aktif untuk badge
  const activeFilterCount = [
    filters.motor_type, filters.condition, filters.availability,
  ].filter(Boolean).length;

  // Sinkronisasi state ke URL params
  const syncUrl = useCallback((q, f) => {
    const params = {};
    if (q) params.q = q;
    if (f.category) params.kategori = f.category;
    if (f.motor_type) params.motor = f.motor_type;
    if (f.condition) params.kondisi = f.condition;
    if (f.availability) params.status = f.availability;
    if (f.sort && f.sort !== 'default') params.urut = f.sort;
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Fetch produk
  const fetchProducts = useCallback(async (currentPage = 1, append = false) => {
    if (currentPage === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const params = {
        q:            debouncedQuery,
        category:     filters.category,
        motor_type:   filters.motor_type,
        condition:    filters.condition,
        availability: filters.availability,
        sort:         filters.sort,
        page:         currentPage,
        per_page:     12,
      };
      const res = await getProducts(params);
      const data = res?.data || [];
      const meta = res?.meta || {};

      if (append) {
        setProducts((prev) => [...prev, ...data]);
      } else {
        setProducts(data);
      }
      setTotal(meta.total || 0);
    } catch (err) {
      setError(err.message || 'Gagal memuat produk.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedQuery, filters]);

  // Setiap filter/query berubah: reset ke halaman 1
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchProducts(1);
    } else {
      setPage(1);
      fetchProducts(1);
    }
    syncUrl(debouncedQuery, filters);
  }, [debouncedQuery, filters.category, filters.motor_type, filters.condition, filters.availability, filters.sort]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  };

  const hasMore = products.length < total;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Eyebrow & Judul Hero */}
      <div className="mb-6">
        <div className="text-xs font-display uppercase tracking-[0.2em] font-bold text-brand mb-1">
          KATALOG PART
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold uppercase font-display text-ink tracking-tight">
          CARI PART YANG TEPAT
        </h1>
        <p className="text-xs sm:text-sm text-muted-text mt-1">
          Gunakan kode produk saat menghubungi kami agar tidak tertukar.
        </p>
      </div>

      {/* ─── AI ASSISTANT SHOWCASE BANNER ─── */}
      <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-ink via-[#1c1d22] to-ink text-white rounded-sm border border-neutral-800 shadow-md relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brand/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand/20 border border-brand/40 text-brand text-[11px] font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-brand" />
              <span>Ditenagai AI Google Gemini 1.5 Flash</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold uppercase text-white tracking-wide">
              Tanya Mas Wahyu AI — Konsultan Suku Cadang & Mesin Ninja 2-Tak
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Bingung kecocokan part, cara rawat Super KIPS, atau setelan karbu? Asisten AI kami dilatih khusus dengan pengetahuan mendalam mekanik Ninja 150 (R, RR, SS) dan data stok live toko.
            </p>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-neutral-400 mr-1">Coba tanya:</span>
              {[
                'Blok Seher Ninja RR 1855',
                'Cara rawat Super KIPS biar ga macet',
                'Rekomendasi oli samping harian',
                'Perbedaan blok 1855 vs 1878',
              ].map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('pepso:open-chat', { detail: { prompt: promptText } }));
                  }}
                  className="px-2.5 py-1 text-[11px] bg-neutral-800/80 hover:bg-brand/20 hover:text-brand border border-neutral-700 hover:border-brand/40 rounded-full transition-all text-neutral-200"
                >
                  ⚡ {promptText}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('pepso:open-chat', { detail: { prompt: '' } }));
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand hover:bg-brand-dark text-white font-display font-bold uppercase tracking-wider text-xs sm:text-sm rounded-sm transition-all shadow-md hover:scale-105"
            >
              <Bot className="w-4 h-4" />
              <span>Mulai Konsultasi AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar with AI Semantic Tag */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari sparepart (bisa pakai istilah slang seperti 'seher', 'karbu', 'knalpot')..."
          className="w-full pl-10 pr-44 sm:pr-52 py-3 text-base border border-neutral-300 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand rounded-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-brand px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider border border-amber-500/20">
            <Sparkles className="w-2.5 h-2.5 text-brand animate-pulse" />
            AI Search
          </span>
          {!loading && (
            <span className="text-xs text-muted-text font-medium border-l border-neutral-200 pl-2">
              {total} produk
            </span>
          )}
        </div>
      </div>

      {/* Chip Kategori + Tombol Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilters((prev) => ({ ...prev, category: cat.slug }))}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold font-display uppercase tracking-wider rounded-sm border transition-all ${
              filters.category === cat.slug
                ? 'bg-ink text-white border-ink'
                : 'bg-white text-neutral-600 border-neutral-300 hover:border-brand hover:text-brand'
            }`}
          >
            {cat.name}
          </button>
        ))}

        {/* Tombol Filter Lanjutan */}
        <button
          onClick={() => setFilterSheetOpen(true)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-display uppercase tracking-wider rounded-sm border transition-all ${
            activeFilterCount > 0
              ? 'bg-brand text-white border-brand'
              : 'bg-white text-neutral-600 border-neutral-300 hover:border-brand hover:text-brand'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 bg-white text-brand rounded-full text-[10px] font-extrabold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Grid Produk */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <div className="text-red-600 font-bold mb-4">{error}</div>
          <Button variant="outline" onClick={() => fetchProducts(1)} icon={RefreshCw}>
            Coba Lagi
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">🔍</div>
          <div className="font-display font-bold text-xl text-ink uppercase mb-2">
            Produk Tidak Ditemukan
          </div>
          <p className="text-sm text-muted-text mb-4">
            Coba kata kunci lain, atau reset filter pencarian.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setQuery('');
              setFilters({ category: '', motor_type: '', condition: '', availability: '', sort: 'default' });
            }}
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                myMotorSlug={selectedMotor?.slug}
              />
            ))}
          </div>

          {/* Muat Lebih Banyak */}
          {hasMore && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                loading={loadingMore}
                className="min-w-[200px]"
              >
                Muat Lebih Banyak ({products.length} / {total})
              </Button>
            </div>
          )}
        </>
      )}

      {/* Bottom Sheet Filter (Mobile) */}
      {filterSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:justify-center lg:items-end">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setFilterSheetOpen(false)}
          />
          <div className="relative z-10 bg-white lg:w-80 lg:h-full w-full max-h-[90vh] lg:max-h-full flex flex-col shadow-2xl rounded-t-2xl lg:rounded-none">
            <FilterSheet
              filters={filters}
              setFilters={setFilters}
              motorTypes={motorTypes}
              onClose={() => setFilterSheetOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
