import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="text-6xl font-display font-extrabold text-brand mb-2">404</div>
      <h2 className="text-2xl font-display uppercase font-bold text-ink mb-2">
        Halaman Tidak Ditemukan
      </h2>
      <p className="text-xs text-muted-text mb-6">
        Sparepart atau halaman yang Anda cari mungkin telah dipindahkan atau kode produk tidak cocok.
      </p>
      <Link to="/">
        <Button variant="primary">Kembali ke Katalog</Button>
      </Link>
    </div>
  );
}

