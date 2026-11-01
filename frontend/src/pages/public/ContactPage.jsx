import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Clock, MessageCircle } from 'lucide-react';
import { getPublicSettings } from '../../api/endpoints';
import { buildWhatsAppUrl } from '../../utils/format';
import Button from '../../components/ui/Button';

export default function ContactPage() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    getPublicSettings()
      .then((res) => setSettings(res?.data || {}))
      .catch(() => {});
  }, []);

  const waUrl = buildWhatsAppUrl(
    settings.whatsapp_number || '',
    'Halo PEPSO PARTS, saya ingin bertanya tentang sparepart Kawasaki Ninja 2-Tak...'
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-xs font-display uppercase tracking-widest font-bold text-brand mb-1">HUBUNGI KAMI</div>
      <h1 className="text-3xl sm:text-4xl font-display font-extrabold uppercase text-ink mb-6">Kontak & Lokasi</h1>

      <div className="space-y-4 mb-8">
        {settings.whatsapp_number && (
          <div className="p-5 border border-neutral-200 bg-white flex gap-4 items-center">
            <div className="w-12 h-12 bg-green-100 flex items-center justify-center flex-shrink-0 rounded-sm">
              <Phone className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-text mb-1">WhatsApp</div>
              <div className="font-bold text-base text-ink">+{settings.whatsapp_number}</div>
              <div className="text-xs text-muted-text mt-0.5">Chat langsung untuk ketersediaan & harga</div>
            </div>
          </div>
        )}

        {settings.address && (
          <div className="p-5 border border-neutral-200 bg-white flex gap-4 items-start">
            <div className="w-12 h-12 bg-orange-100 flex items-center justify-center flex-shrink-0 rounded-sm">
              <MapPin className="w-6 h-6 text-brand" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-text mb-1">Alamat</div>
              <div className="text-sm text-ink">{settings.address}</div>
            </div>
          </div>
        )}

        {settings.opening_hours && (
          <div className="p-5 border border-neutral-200 bg-white flex gap-4 items-start">
            <div className="w-12 h-12 bg-blue-100 flex items-center justify-center flex-shrink-0 rounded-sm">
              <Clock className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-text mb-1">Jam Layanan</div>
              <div className="text-sm text-ink">{settings.opening_hours}</div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 bg-neutral-50 border border-neutral-200 text-center">
        <div className="text-sm text-muted-text mb-1">
          Untuk memesan, konfirmasi harga, atau cek ketersediaan stok:
        </div>
        <div className="text-xs text-muted-text mb-4">
          Pembayaran dan ongkos kirim dikonfirmasi langsung lewat WhatsApp.
        </div>
        <a href={waUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="primary" icon={MessageCircle} size="lg">
            Hubungi via WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}

