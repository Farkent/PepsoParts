/**
 * Format angka ke format Rupiah tanpa desimal: Rp1.250.000
 */
export function formatRupiah(amount) {
  const num = Number(amount) || 0;
  return 'Rp' + num.toLocaleString('id-ID');
}

/**
 * Normalisasi nomor WhatsApp ke format internasional 628xxx
 */
export function normalizeWhatsApp(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('62')) {
    // sudah diawali 62
  } else if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Buat deep-link URL WhatsApp: https://wa.me/<nomor>?text=<pesan>
 */
export function buildWhatsAppUrl(phoneNumber, message = '') {
  const normalized = normalizeWhatsApp(phoneNumber);
  if (!normalized) return '#';
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encodedMsg}`;
}

/**
 * Format tanggal Indonesia: 30 Okt 2026, 14:30 WIB
 */
export function formatDate(dateStr, includeTime = true) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  if (!includeTime) {
    return `${day} ${month} ${year}`;
  }

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
}

