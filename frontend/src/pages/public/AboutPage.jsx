import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Clock, ExternalLink, Facebook, ShoppingBag } from 'lucide-react';
import { getPublicSettings } from '../../api/endpoints';
import { buildWhatsAppUrl } from '../../utils/format';

export default function AboutPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicSettings()
      .then((res) => { setSettings(res?.data || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const waUrl = buildWhatsAppUrl(settings.whatsapp_number || '', 'Halo PEPSO PARTS, saya ingin bertanya...');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-xs font-display uppercase tracking-widest font-bold text-brand mb-1">TENTANG KAMI</div>
      <h1 className="text-3xl sm:text-4xl font-display font-extrabold uppercase text-ink mb-6">
        {settings.store_name || 'PEPSO PARTS'}
      </h1>

      {settings.about_text && (
        <p className="text-base text-neutral-700 leading-relaxed mb-8 whitespace-pre-line">
          {settings.about_text}
        </p>
      )}

      <div className="space-y-4">
        {settings.whatsapp_number && (
          <InfoRow icon={<Phone className="w-4 h-4 text-brand" />} label="WhatsApp">
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-brand font-bold hover:underline">
              +{settings.whatsapp_number}
            </a>
          </InfoRow>
        )}
        {settings.address && (
          <InfoRow icon={<MapPin className="w-4 h-4 text-brand" />} label="Alamat">
            {settings.address}
          </InfoRow>
        )}
        {settings.opening_hours && (
          <InfoRow icon={<Clock className="w-4 h-4 text-brand" />} label="Jam Layanan">
            {settings.opening_hours}
          </InfoRow>
        )}
        {settings.facebook_url && (
          <InfoRow icon={<Facebook className="w-4 h-4 text-brand" />} label="Facebook Marketplace">
            <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline flex items-center gap-1">
              Lihat toko kami <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </InfoRow>
        )}
        {settings.shopee_url && (
          <InfoRow icon={<ShoppingBag className="w-4 h-4 text-brand" />} label="Shopee">
            <a href={settings.shopee_url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline flex items-center gap-1">
              Kunjungi toko Shopee <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </InfoRow>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex gap-3 p-4 border border-neutral-200 rounded-sm bg-white">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-muted-text mb-0.5">{label}</div>
        <div className="text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}

