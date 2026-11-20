<?php

declare(strict_types=1);

namespace Pepso\Services\Ai;

use Pepso\Core\Database;
use Pepso\Repositories\ProductRepository;
use Pepso\Services\SearchService;
use PDO;

class MockProvider implements AiProviderInterface
{
    private PDO $db;
    private ProductRepository $productRepo;
    private SearchService $searchService;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->productRepo = new ProductRepository();
        $this->searchService = new SearchService();
    }

    public function chat(string $message, ?string $myMotorSlug = null, array $history = []): array
    {
        $msg = trim($message);
        $msgLower = strtolower($msg);

        // Detect context from conversation history if available
        $contextTopic = $this->detectContextFromHistory($history);
        $effectiveMotor = $myMotorSlug ?: $this->detectMotorFromText($msgLower) ?: ($contextTopic['motor'] ?? null);

        // ─────────────────────────────────────────────────────────────────
        // 1. Sapaan & Keramahan (Greeting & Small Talk)
        // ─────────────────────────────────────────────────────────────────
        if (preg_match('/^(halo|hai|hi|assalamu|pagi|siang|sore|malam|permisi|mas|bang|bro|gan|sam|lur)\b/i', $msgLower) && strlen($msgLower) < 35) {
            $motorGreeting = $effectiveMotor ? " untuk " . $this->formatMotorName($effectiveMotor) : "";
            return [
                'text' => "Halo Bro! Selamat datang di PEPSO PARTS — bengkel spesialis & penyedia sparepart bekas copotan original Kawasaki Ninja 150 2-Tak (Ninja R, RR, SS) milik Mas Wahyu Dwi Adrianto di Sentul, Bogor.\n\nAda kendala mesin, butuh rekomendasi settingan, atau lagi cari sparepart tertentu{$motorGreeting} yang bisa saya bantu hari ini?",
                'suggested_products' => $this->getFeaturedProducts(2, $effectiveMotor),
                'quick_replies' => [
                    'Blok Seher Ninja RR 1855',
                    'Motor brebet di RPM bawah',
                    'Oli mesin jadi putih susu',
                    'Rekomendasi oli samping harian',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        if (preg_match('/\b(terima kasih|makasih|thanks|tengkyu|matur nuwun|mantap|keren|siap|oke|ok|sip|jos)\b/i', $msgLower)) {
            return [
                'text' => "Sama-sama Bro! Senang bisa bantu sesama penghobi Ninja 2-Tak. Kalau sewaktu-waktu butuh part copotan original, konsultasi restorasi, atau servis Super KIPS, jangan ragu kontak Mas Wahyu atau mampir ke bengkel Sentul ya. Gass poll aman dan tetap rawat tunggangan 2-Tak kesayangan!",
                'suggested_products' => [],
                'quick_replies' => [
                    'Lihat Katalog Sparepart Ready',
                    'Lokasi Bengkel Sentul',
                    'Chat WhatsApp Mas Wahyu',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        if (preg_match('/\b(siapa|owner|pemilik|wahyu|pepso|profil|tentang toko)\b/i', $msgLower)) {
            return [
                'text' => "PEPSO PARTS didirikan oleh Mas Wahyu Dwi Adrianto, mekanik dan penghobi kawakan Kawasaki Ninja 150 2-Tak yang berlokasi di kawasan Sentul, Babakan Madang, Kabupaten Bogor.\n\nKami mengkhususkan diri pada penyediaan suku cadang original copotan motor sehat (bukan KW/variasi murahan), restorasi mesin, servis Super KIPS, hingga pengiriman part aman bergaransi fisik ke seluruh Indonesia.",
                'suggested_products' => [],
                'quick_replies' => [
                    'Lokasi Bengkel Sentul',
                    'Hubungi Mas Wahyu via WA',
                    'Lihat Koleksi Sparepart',
                ],
                'fallback_to_whatsapp' => true,
            ];
        }

        // ─────────────────────────────────────────────────────────────────
        // 2. DIAGNOSIS KERUSAKAN & GEJALA MESIN (Troubleshooting)
        // ─────────────────────────────────────────────────────────────────

        // 2.1 Masalah Brebet / Nyendat / Mbrebet di RPM Bawah / Tengah / Atas
        if (preg_match('/\b(brebet|mbrebet|nyendat|nahan|tertahan|ngerebet|tersendat|berat|putaran bawah|putaran atas|rpm bawah|rpm atas)\b/i', $msgLower)) {
            return [
                'text' => "Gejala motor Ninja 2-Tak brebet atau nahan biasanya bersumber dari beberapa hal berikut Bro:\n\n" .
                          "1. *Brebet di RPM Bawah (0 - 4.000 RPM):* Umumnya karena Pilot Jet (PJ) kekenyangan/terlalu besar, setelan angin karbu terlalu rapat (putar ke kiri 1,5 putaran), atau busi sudah kotor berkerak basah.\n" .
                          "2. *Brebet di RPM Tengah (4.000 - 7.000 RPM):* Biasanya klip jarum skep terlalu boros (coba naikkan klip jarum 1 step agar jarum turun), atau lidah membran reed valve sudah renggang/bocor.\n" .
                          "3. *Brebet di RPM Atas (> 7.000 RPM):* Katup Super KIPS macet tidak mau membuka, Main Jet (MJ) kekeringan atau terlalu besar, atau koil/pengapian melemah saat suhu mesin panas.\n\n" .
                          "Saran pertama: coba cek warna elektroda busi dulu Bro. Kami ada stok karbu orisinil, membran, dan part pengapian jika butuh peremajaan!",
                'suggested_products' => $this->findProductsByKeywords(['karburator', 'membran', 'busi']),
                'quick_replies' => [
                    'Settingan Karbu PWK 28',
                    'Cara Cek Membran Rusak',
                    'Konsultasi Settingan ke WA',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        // 2.2 Air Radiator Campur Oli / Oli Jadi Putih Susu (Water Pump Leak)
        if (preg_match('/\b(putih susu|kopi susu|campur air|radiator campur|seal water pump|as water pump|oli mesin putih|radiator tekor|air radiator berkurang)\b/i', $msgLower)) {
            return [
                'text' => "Peringatan Bro! Kalau oli mesin warnanya berubah jadi putih keruh seperti 'kopi susu', itu tanda 100% *air radiator masuk ke ruang crankcase/oli mesin*.\n\n" .
                          "Penyebab utamanya:\n" .
                          "1. *Seal Water Pump Aus / Sobek:* Ini kasus paling sering pada Ninja 150. Seal mekanikal dan seal oli di bak magnet/water pump sudah keras atau jebol.\n" .
                          "2. *As Water Pump Terkikis Karat:* Kalau as kipas pompa airnya baret/terkikis, ganti seal baru pun bakal bocor lagi.\n" .
                          "3. *Paking Head / O-ring Head Silinder Bocor:* Air radiator menyebrang masuk ke ruang silinder.\n\n" .
                          "*Langkah Tindakan:* Jangan dipaksa jalan karena lahar kruk as dan kampas kopling bisa rontok! Segera kuras oli mesin, ganti Seal Water Pump + As Water Pump original, dan cek O-ring head. Di PEPSO PARTS kami siap bantu part copotan dan perbaikannya Bro!",
                'suggested_products' => $this->findProductsByKeywords(['radiator', 'blok', 'silinder']),
                'quick_replies' => [
                    'Chat WhatsApp Mas Wahyu',
                    'Cek Blok & O-ring Head',
                    'Lokasi Bengkel Sentul',
                ],
                'fallback_to_whatsapp' => true,
            ];
        }

        // 2.3 Mesin Overheat / Terlalu Panas / Radiator Mendidih
        if (preg_match('/\b(overheat|panas|mendidih|suhu tinggi|tabung reservoir tumpah|radiator bocor|coolant muncrat)\b/i', $msgLower)) {
            return [
                'text' => "Solusi Mesin Ninja 150 Panas / Overheat ala Mas Wahyu:\n\n" .
                          "• *Cek Sirkulasi Air Radiator:* Buka tutup radiator saat mesin dingin, lalu hidupkan motor. Kalau air berputar dan berombak saat digas, water pump aktif. Kalau diam saja, impeler atau as water pump bermasalah.\n" .
                          "• *Thermostat Macet:* Banyak Ninja 2T copotan thermostat-nya sudah uzur dan macet tertutup, menghambat aliran air ke radiator.\n" .
                          "• *Setelan Karbu Terlalu Irit (Lean):* Campuran bensin yang terlalu kering membuat ruang bakar membara dan mesin cepat panas melebihi batas.\n" .
                          "• *Oli Samping Tekor:* Pastikan debit pompa oli samping lancar, jangan disetel terlalu irit.\n" .
                          "• *Radiator Mampet:* Kisi-kisi radiator kotor atau tersumbat kerak karat.",
                'suggested_products' => $this->findProductsByKeywords(['radiator']),
                'quick_replies' => [
                    'Rekomendasi Air Coolant',
                    'Settingan Karburator',
                    'Tanya Mekanik via WA',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        // 2.4 Kopling Selip / Tenaga Tidak Nyalur
        if (preg_match('/\b(selip|kopling|kampas kopling|per kopling|loyo|tenaga hilang|gas teriak|slip)\b/i', $msgLower)) {
            return [
                'text' => "Penyebab Kopling Ninja 150 Selip (Mesin meraung tapi laju motor lambat):\n\n" .
                          "1. *Kampas Kopling Aus / Gosong:* Ketebalan kampas habis atau permukaannya hangus terbakar gesekan.\n" .
                          "2. *Plat Gesek Kopling Termakan / Melengkung:* Bikin kontak gesek tidak merata.\n" .
                          "3. *Per Kopling Lembek:* Tekanan per menekan kampas berkurang. Solusinya bisa ganti per kopling yang sedikit lebih kaku (spek racing/Ninja ZX) agar gigitannya padat.\n" .
                          "4. *Oli Mesin Tidak Sesuai (JASO MB):* Jangan gunakan oli mesin mobil yang ada aditif friction modifier, wajib pakai oli mesin dengan sertifikasi *JASO MA / MA2* agar kampas tidak licin.",
                'suggested_products' => [],
                'quick_replies' => [
                    'Tanya Part Kopling ke WA',
                    'Rekomendasi Oli Mesin',
                    'Katalog Sparepart Ready',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        // 2.5 Susah Nyala Pagi Hari / Kompresi Bocor
        if (preg_match('/\b(susah hidup|susah nyala|engkol enteng|hilang kompresi|busi basah|gak mau hidup|mogok)\b/i', $msgLower)) {
            return [
                'text' => "Cek 3 Unsur Utama Ninja 2-Tak kalau susah hidup di pagi hari Bro:\n\n" .
                          "1. *Kompresi (Cek Selahan/Kick Starter):* Kalau engkol terasa enteng banget tanpa tahanan, kemungkinan ring seher lengket, paking head bocor, atau liner silinder baret aus.\n" .
                          "2. *Bahan Bakar & Karburator:* Jika busi dibuka dalam keadaan basah kuyup bensin, berarti mesin kebanjiran (karbu bocor/pelampung nyangkut). Tarik cuk karbu secukupnya saja.\n" .
                          "3. *Percikan Pengapian:* Buka busi, tempelkan ke bodi mesin, lalu engkol. Pastikan api busi berwarna biru terang di ujung elektroda. Kalau apinya merah atau tidak ada, cek cop busi, koil, dan CDI.",
                'suggested_products' => $this->findProductsByKeywords(['blok', 'busi', 'karburator']),
                'quick_replies' => [
                    'Cek Blok Silinder & Seher',
                    'Cek Busi yang Bagus',
                    'Konsultasi WA Mas Wahyu',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        // 2.6 Jasa Servis, Pasang Part, Porting, Overhaul di Bengkel Sentul
        if (preg_match('/\b(pasang|jasa|servis|service|tune up|porting|overhaul|belah mesin|bisa pasang|bantu pasang)\b/i', $msgLower)) {
            return [
                'text' => "Bisa banget Bro! Mas Wahyu di bengkel PEPSO PARTS Sentul melayani langsung:\n\n" .
                          "1. *Jasa Pemasangan Part:* Pasang blok silinder, ganti seher, pasang karburator, ganti knalpot, dll.\n" .
                          "2. *Servis Super KIPS:* Pembersihan kerak karbon, setel katup, penggantian seal & as kips.\n" .
                          "3. *Overhaul / Belah Mesin:* Peremajaan lahar kruk as, ganti stang seher, ganti seal mesin total.\n" .
                          "4. *Porting Polish Harian / Touring:* Optimasi lubang transfer & exhaust agar nafas motor makin enteng namun tetap awet buat harian.\n\n" .
                          "Untuk estimasi biaya pasang dan booking waktu di bengkel Sentul, langsung kontak Mas Wahyu via WhatsApp ya Bro!",
                'suggested_products' => $this->getFeaturedProducts(2, $effectiveMotor),
                'quick_replies' => [
                    'Booking Servis via WhatsApp',
                    'Lokasi Bengkel Sentul',
                    'Lihat Suku Cadang Copotan',
                ],
                'fallback_to_whatsapp' => true,
            ];
        }

        // ─────────────────────────────────────────────────────────────────
        // 3. KOMPONEN TEKNIS & REKOMENDASI SPESIFIKASI
        // ─────────────────────────────────────────────────────────────────

        // 3.1 Busi (Spark Plug)
        if (preg_match('/\b(busi|spark plug|b9ecs|br9eix|iridium|denso w27|warna busi)\b/i', $msgLower)) {
            return [
                'text' => "Rekomendasi Busi Terbaik untuk Kawasaki Ninja 150 2-Tak:\n\n" .
                          "• *Standar Pabrik (Harian Aman):* NGK B9ECS atau Denso W27ESR-U. Angka 9 adalah heat range tipe dingin yang cocok menahan panas putaran tinggi Ninja 2T.\n" .
                          "• *Spek Performa / Touring:* NGK Iridium BR9EIX. Pengapian lebih fokus, tarikan responsif, dan lebih tahan kerak oli samping.\n\n" .
                          "*Cara Baca Warna Elektroda Busi:* \n" .
                          "• *Merah Bata / Cokelat Kering:* Sempurna (Campuran udara, bensin, dan oli pas).\n" .
                          "• *Hitam Pekat & Basah:* Terlalu boros bensin / oli samping berlebih.\n" .
                          "• *Putih Kering / Abu-abu:* Bahaya! Terlalu irit (lean), rawan bikin piston macet (ngejim) saat digeber kencang.",
                'suggested_products' => [],
                'quick_replies' => [
                    'Settingan Karbu Ninja',
                    'Rekomendasi Oli Samping',
                    'Tanya Part ke WhatsApp',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        // 3.2 Membran / Reed Valve
        if (preg_match('/\b(membran|reed valve|vforce|v-force|vforce3|vforce4|kx85|lidah membran|intake)\b/i', $msgLower)) {
            return [
                'text' => "Penjelasan Membran / Reed Valve Ninja 150 ala PEPSO PARTS:\n\n" .
                          "• *Membran Standar Ninja:* Menggunakan plat besi/fiber standar. Sangat awet untuk harian santai.\n" .
                          "• *Membran KX85 (Karbon):* Pilihan ekonomis bertenaga. Lidah karbon lebih lentur dan cepat menutup, tarikan bawah hingga tengah terasa lebih padat.\n" .
                          "• *V-Force 3 / V-Force 4 (Moto Tassinari):* Rajanya membran 2-tak! Memiliki 8 bilah daun katup (ganda) sehingga volume pasokan bensin dan udara jauh lebih deras tanpa jeda lag. Cocok untuk mesin porting harian atau balap.\n" .
                          "• *Tanda Membran Rusak:* Kalau lidah membran renggang atau pecah walau hanya 0,5 mm, motor bakal sangat susah langsam, bensin nyemprot balik ke karbu, dan tarikan bawah brebet parah.",
                'suggested_products' => $this->findProductsByKeywords(['membran', 'karburator']),
                'quick_replies' => [
                    'Cek Karburator PWK 28',
                    'Tanya Ketersediaan Membran',
                    'Chat WhatsApp Mas Wahyu',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        // 3.3 Rasio Gir & Rantai
        if (preg_match('/\b(gir|gear|rantai|rasio gir|ukuran gir|mata gir|14-39|15-42|415|520)\b/i', $msgLower)) {
            return [
                'text' => "Panduan Ukuran Gir Depan & Belakang Kawasaki Ninja 150:\n\n" .
                          "• *Ninja 150 RR Standar:* 14 Mata (Depan) - 39 Mata (Belakang). Rasio: 2,78 (Karakter nafas panjang untuk trek lurus kencang).\n" .
                          "• *Ninja 150 R Standar:* 15 Mata (Depan) - 42 Mata (Belakang). Rasio: 2,80.\n" .
                          "• *Ninja 150 SS Standar:* 15 Mata (Depan) - 42 Mata (Belakang).\n\n" .
                          "*Rekomendasi Penyesuaian:*\n" .
                          "• *Akselerasi Padat / Stop & Go Dalam Kota:* Naikkan gir belakang 1–2 mata (misal Ninja RR jadi 14-41 atau 14-42).\n" .
                          "• *Top Speed Touring Panjang:* Turunkan gir belakang 1–2 mata (misal 14-38).\n" .
                          "• Gunakan rantai ukuran 428H (heavy duty) untuk harian atau 415 tipis buat kontes/tarikan enteng.",
                'suggested_products' => [],
                'quick_replies' => [
                    'Cek Part Ninja RR',
                    'Cek Part Ninja R/SS',
                    'Tanya Mas Wahyu via WA',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        // 3.4 Super KIPS
        if (preg_match('/\b(kips|super kips|superkips|katup kips|as kips|gigi kips|governor)\b/i', $msgLower)) {
            return [
                'text' => "Tips Super KIPS dari Mas Wahyu Bro:\n\n" .
                          "1. *Karakter KIPS:* Katup Super KIPS normalnya mulai membuka di putaran 7.000 RPM. Sensasinya motor bakal ngejambak kuat.\n" .
                          "2. *Penyebab Macet:* Kerak oli samping dan sisa karbon pembakaran menumpuk di batang katup/gigi pemutar.\n" .
                          "3. *Perawatan Rutin:* Bersihkan rumah katup KIPS pakai karbu cleaner atau bensin tiap 3.000-5.000 km. Pastikan oli samping tidak terlalu pekat atau berkualitas jelek.\n" .
                          "4. *Gigi KIPS Rompal:* Kalau macet parah jangan dipaksa puntir gas tinggi karena gigi as kips bisa rompal. Kami ada stok katup & blok kips original copotan jika butuh penggantian Bro!",
                'suggested_products' => $this->findProductsByKeywords(['kips', 'blok']),
                'quick_replies' => [
                    'Blok Silinder Super KIPS',
                    'Rekomendasi Oli Samping',
                    'Konsultasi via WhatsApp',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        // 3.5 Oli Samping & Rasio Bensin
        if (preg_match('/\b(oli samping|olsam|oli 2t|motul|idemitsu|castrol|enviro|ipone|pre-mix|premix|pompa oli)\b/i', $msgLower)) {
            return [
                'text' => "Panduan Oli Samping Ninja 2-Tak ala PEPSO PARTS:\n\n" .
                          "• *Harian Standar:* Motul 510, Idemitsu 2T, Castrol Power 1 2T, atau Pertamina Enviro 2T (aroma wangi, kerak rendah, ramah dompet).\n" .
                          "• *Touring / Spek Porting:* Motul 710, Ipone Samourai, Castrol A747, atau Shell Advance Ultra 2T.\n" .
                          "• *Setelan Pompa Oli:* Pastikan pompa oli samping aktif normal. Kalau main campur tangki (pre-mix), takarannya sekitar 25ml - 30ml per 1 liter bensin.\n" .
                          "• *Asap Terlalu Pekat:* Biasanya setelan pompa oli terlalu boros atau packing kruk as bocor menyedot oli mesin.",
                'suggested_products' => [],
                'quick_replies' => [
                    'Blok Seher Standar',
                    'Karburator PWK 28',
                    'Tanya Settingan ke Mas Wahyu',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        // 3.6 Perbedaan Blok Silinder (1855 Gold vs 1878 vs Blok Boringan)
        if (preg_match('/\b(1855|1878|blok silinder|blok mesin|seher|piston|electrofusion|overbos|ob|liner)\b/i', $msgLower)) {
            return [
                'text' => "Perbedaan Blok Ninja 2-Tak yang sering ditanyakan Bro:\n\n" .
                          "• *Blok 1855 Gold (Thailand):* Blok legendaris Ninja RR/R era CBU & CKD awal. Material liner Electrofusion sangat licin dan tahan panas, kompresi padat, tenaga atas galak.\n" .
                          "• *Blok 1878 (Lokal):* Blok bawaan Ninja RR New era KMI lokal. Karakternya lebih ramah harian dengan efisiensi bahan bakar yang baik.\n" .
                          "• *Catatan Penting:* Blok orisinil Ninja tidak bisa dikorter (harus ganti seher satu set/ganti blok jika baret dalam), kecuali di-overbos (OB) liner baja. Di PEPSO PARTS, kami mengutamakan blok orisinil copotan tanpa overbos!",
                'suggested_products' => $this->findProductsByKeywords(['blok']),
                'quick_replies' => [
                    'Lihat Stok Blok 1855',
                    'Lihat Stok Blok 1878',
                    'Tanya Kondisi Blok ke WA',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        // 3.7 Karburator & Settingan
        if (preg_match('/\b(karbu|karburator|pwk|pwl|sudco|pj|mj|pilot jet|main jet|setelan karbu)\b/i', $msgLower)) {
            return [
                'text' => "Tips Karburator Ninja 150 2-Tak:\n\n" .
                          "• *PWL 26 (Standar Ninja R/SS):* Irit, langsam stabil, sangat cocok untuk pemakaian harian santai.\n" .
                          "• *Mikuni VM 28 (Standar Ninja RR):* Karbu bawaan RR dengan karakter nafas panjang.\n" .
                          "• *Keihin PWK 28 (Sudco / KX85):* Favorit buat yang suka tarikan spontan dan nafas atas melesat. Respon skep semi-flat langsung instan.\n" .
                          "• *Tips Mbrebet:* Periksa busi, bersihkan pilot jet, dan cek karet intake dari kebocoran angin palsu. Kami ready karbu copotan orisinil siap pakai Bro!",
                'suggested_products' => $this->findProductsByKeywords(['karburator']),
                'quick_replies' => [
                    'Lihat Karburator PWK 28',
                    'Lihat Karburator PWL 26',
                    'Chat Mas Wahyu',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        // 3.8 Knalpot
        if (preg_match('/\b(knalpot|muffler|garing|racing|telo|perut knalpot|silincer|bobok|cobra|kolong)\b/i', $msgLower)) {
            return [
                'text' => "Pilihan Knalpot Ninja 2-Tak di PEPSO PARTS:\n\n" .
                          "• *Knalpot Standar Copotan:* Suara adem khas pabrik, aman dari tilang, tenaga bawah padat.\n" .
                          "• *Knalpot Standar Bobokan:* Tampilan tetap standar kaleng tapi suara garing gemrincing khas 2-tak dan nafas lebih lega.\n" .
                          "• *Knalpot Racing Perut 40/41:* Bahan galvanis / stainless dengan silincer alu/karbon buat putaran atas maksimal.\n\n" .
                          "Tersedia tipe Kolong (Ninja R/SS) maupun Cobra (Ninja RR). Mau cari yang mana Bro?",
                'suggested_products' => $this->findProductsByKeywords(['knalpot']),
                'quick_replies' => [
                    'Knalpot Standar Ninja RR',
                    'Knalpot Racing Harian',
                    'Tanya Ongkir Knalpot',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        // 3.9 CDI & Pengapian
        if (preg_match('/\b(cdi|pengapian|1454|1592|koil|spul|pulser|brt dualband)\b/i', $msgLower)) {
            return [
                'text' => "Seputar Pengapian & CDI Kawasaki Ninja 150:\n\n" .
                          "• *CDI 1454 (Denso Thailand):* CDI legendaris bawaan Ninja RR CBU/lama. Kurva pengapian maju di putaran atas dan non-limiter, jadi favorit buat yang suka top speed gila-gilaan.\n" .
                          "• *CDI 1592 (Denso Lokal):* Bawaan Ninja R/RR New. Kurva lebih halus dan bersahabat untuk harian.\n" .
                          "• *Koil YZ125 (4SS/4XM):* Sering dikombinasikan dengan CDI 1454 untuk menghasilkan loncatan bunga api tebal dan pembakaran tuntas.\n\n" .
                          "Di PEPSO PARTS kami kerap ready stok CDI 1454 orisinil copotan unit utuh garansi nyala normal!",
                'suggested_products' => $this->findProductsByKeywords(['cdi', 'pengapian']),
                'quick_replies' => [
                    'Cek Stok CDI 1454',
                    'Tanya Part Pengapian',
                    'Hubungi WhatsApp',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. INFORMASI BENGKEL, JASA, PENGIRIMAN, & LOKASI
        // ─────────────────────────────────────────────────────────────────

        // 4.1 Lokasi, Alamat, dan Jam Operasional
        if (preg_match('/\b(lokasi|alamat|bengkel|toko|sentul|bogor|maps|posisi|buka|tutup|jam operasional|ancer|rute)\b/i', $msgLower)) {
            return [
                'text' => "Bengkel dan gudang fisik PEPSO PARTS berlokasi di area Sentul, Babakan Madang, Kabupaten Bogor (Dekat Sirkuit Sentul).\n\n" .
                          "• *Jam Buka:* Senin s/d Sabtu pukul 09.00 - 17.00 WIB (Hari Minggu buka dengan perjanjian/janjian terlebih dahulu).\n" .
                          "• *Akses:* Dekat pintu Tol Sentul Sirkuit, mudah dijangkau dari arah Jakarta, Depok, maupun Bogor Kota.\n" .
                          "• Bisa mampir langsung untuk pilih fisik barang atau kirim via ekspedisi aman!",
                'suggested_products' => [],
                'quick_replies' => [
                    'Shareloc via WhatsApp',
                    'Lihat Katalog Ready',
                    'Jasa Pasang di Bengkel',
                ],
                'fallback_to_whatsapp' => true,
            ];
        }

        // 4.2 Jasa Servis, Pasang Part, Porting, Overhaul
        if (preg_match('/\b(pasang|jasa|servis|service|tune up|porting|overhaul|belah mesin|bisa pasang)\b/i', $msgLower)) {
            return [
                'text' => "Bisa banget Bro! Mas Wahyu di bengkel PEPSO PARTS Sentul melayani langsung:\n\n" .
                          "1. *Jasa Pemasangan Part:* Pasang blok silinder, ganti seher, ganti karburator, knalpot, dll.\n" .
                          "2. *Servis Super KIPS:* Pembersihan kerak karbon, setel katup, penggantian seal & as kips.\n" .
                          "3. *Overhaul / Belah Mesin:* Peremajaan lahar kruk as, ganti stang seher, ganti seal mesin total.\n" .
                          "4. *Porting Polish Harian / Touring:* Optimasi lubang transfer & exhaust agar nafas motor makin enteng namun tetap awet buat harian.\n\n" .
                          "Untuk estimasi biaya dan booking antrean servis, langsung chat Mas Wahyu ya Bro!",
                'suggested_products' => [],
                'quick_replies' => [
                    'Booking Servis via WhatsApp',
                    'Lokasi Bengkel Sentul',
                    'Lihat Suku Cadang Copotan',
                ],
                'fallback_to_whatsapp' => true,
            ];
        }

        // 4.3 Pengiriman, Ekspedisi, Packing, Garansi & COD
        if (preg_match('/\b(kirim|ekspedisi|ongkir|jne|jnt|cargo|packing|kayu|garansi|cod|rekber|bayar|transfer)\b/i', $msgLower)) {
            return [
                'text' => "Informasi Pengiriman & Transaksi PEPSO PARTS:\n\n" .
                          "• *Pengiriman:* Melayani kirim ke seluruh pelosok Indonesia via JNE, J&T, SiCepat, atau Cargo (Indah/Baraka) untuk barang berat seperti blok mesin/knalpot.\n" .
                          "• *Packing Aman:* Menggunakan kardus tebal, bubble wrap berlapis, dan opsi packing kayu untuk blok silinder agar sirip tidak patah.\n" .
                          "• *Garansi:* Barang dipastikan sesuai foto & deskripsi. Sebelum dikirim kami fotokan/videokan kondisi detailnya via WhatsApp.\n" .
                          "• *Pembayaran:* Transfer bank langsung atau COD langsung di bengkel Sentul.",
                'suggested_products' => [],
                'quick_replies' => [
                    'Cek Ongkir via WhatsApp',
                    'Lokasi Bengkel Sentul',
                    'Lihat Semua Katalog',
                ],
                'fallback_to_whatsapp' => true,
            ];
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. PENCARIAN PRODUK REAL-TIME DARI DATABASE
        // ─────────────────────────────────────────────────────────────────
        $searchResults = $this->productRepo->search([
            'q'          => $msg,
            'motor_type' => $effectiveMotor,
            'status'     => 'available',
            'per_page'   => 4,
        ]);

        $products = $searchResults['data'] ?? [];

        if (!empty($products)) {
            $count = count($products);
            $motorNote = $effectiveMotor ? " yang cocok untuk " . strtoupper($effectiveMotor) : "";
            $replyText = "Ditemukan {$count} barang rekomendasi{$motorNote} yang cocok dengan pencarianmu Bro:\n\n";

            foreach ($products as $p) {
                $priceFormatted = 'Rp ' . number_format((float)$p['price'], 0, ',', '.');
                $grade = strtoupper($p['condition_grade'] ?? 'Good');
                $replyText .= "• *{$p['name']}* ({$p['code']}) — {$priceFormatted} [Kondisi: {$grade}]\n";
            }

            $replyText .= "\nSemua barang di atas dijamin original copotan pilihan Mas Wahyu. Mau langsung checkout atau lihat detail fisiknya?";

            return [
                'text' => $replyText,
                'suggested_products' => array_map(function ($p) {
                    return [
                        'id'            => $p['id'],
                        'code'          => $p['code'],
                        'name'          => $p['name'],
                        'slug'          => $p['slug'],
                        'price'         => (float)$p['price'],
                        'stock'         => (int)$p['stock'],
                        'primary_image' => $p['primary_thumb_path'] ?? $p['primary_image_path'] ?? null,
                    ];
                }, $products),
                'quick_replies' => [
                    'Cek Detail Barang Pertama',
                    'Beli via Keranjang Belanja',
                    'Tanya via WhatsApp Mas Wahyu',
                ],
                'fallback_to_whatsapp' => false,
            ];
        }

        // ─────────────────────────────────────────────────────────────────
        // 6. DETEKSI NAMA PART YANG BELUM TERDAFTAR DI KATALOG (Smart Noun Fallback)
        // ─────────────────────────────────────────────────────────────────
        $partKeywords = [
            'tangki', 'spakbor', 'velg', 'pelek', 'swing arm', 'lengan ayun', 'kaliper',
            'master rem', 'footstep', 'underbone', 'lampu', 'headlamp', 'speedometer',
            'kabel body', 'stang', 'segitiga', 'shock', 'monoshock', 'piringan', 'cakram',
            'radiator', 'karburator', 'knalpot', 'blok', 'seher', 'cdi', 'kruk as', 'bak mesin',
            'tutup tangki', 'jok', 'behel', 'fairing', 'braket', 'kips', 'membran',
        ];

        foreach ($partKeywords as $pk) {
            if (str_contains($msgLower, $pk)) {
                return [
                    'text' => "Mengenai sparepart *{$pk}* yang kamu tanyakan Bro:\n\n" .
                              "Saat ini item tersebut belum tampil di etalase web, kemungkinan karena baru masuk di bengkel Sentul dan masih dalam proses sortir atau pembersihan oleh Mas Wahyu.\n\n" .
                              "Koleksi copotan unit kami selalu diperbarui berkala. Silakan langsung chat Mas Wahyu di WhatsApp untuk memastikan ketersediaan barang di gudang atau pre-order part copotan motor bahan!",
                    'suggested_products' => $this->getFeaturedProducts(2, $effectiveMotor),
                    'quick_replies' => [
                        "Tanya {$pk} via WhatsApp",
                        'Lihat Katalog Ready',
                        'Konsultasi Mas Wahyu',
                    ],
                    'fallback_to_whatsapp' => true,
                ];
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 7. JAWABAN UMUM CERDAS, RELEVAN & TIDAK MONOTON (Contextual Fallback)
        // ─────────────────────────────────────────────────────────────────
        return [
            'text' => "Pertanyaan menarik Bro! Seputar *\"{$msg}\"*:\n\n" .
                      "Di PEPSO PARTS, kami mengutamakan keaslian suku cadang original copotan pabrik Kawasaki Ninja 150 (Ninja R, RR, SS) dan kepuasan settingan mesin performa 2-tak.\n\n" .
                      "Apabila kamu membutuhkan rekomendasi teknis mendalam, pengecekan kecocokan part khusus, atau ingin mencari sparepart yang belum ada di katalog online, Mas Wahyu siap membantu langsung via obrolan santai di WhatsApp!",
            'suggested_products' => $this->getFeaturedProducts(2, $effectiveMotor),
            'quick_replies' => [
                'Chat WhatsApp Mas Wahyu',
                'Cek Stok Blok Seher 1855',
                'Cek Stok Karburator PWK',
                'Lokasi Bengkel Sentul',
            ],
            'fallback_to_whatsapp' => true,
        ];
    }

    private function detectContextFromHistory(array $history): array
    {
        $context = ['motor' => null, 'topic' => null];
        if (empty($history)) return $context;

        $lastTexts = '';
        foreach (array_slice($history, -4) as $h) {
            $lastTexts .= ' ' . strtolower($h['text'] ?? '');
        }

        if (str_contains($lastTexts, 'ninja-rr') || str_contains($lastTexts, 'ninja rr')) {
            $context['motor'] = 'ninja-rr';
        } elseif (str_contains($lastTexts, 'ninja-ss') || str_contains($lastTexts, 'ninja ss')) {
            $context['motor'] = 'ninja-ss';
        } elseif (str_contains($lastTexts, 'ninja-r') || str_contains($lastTexts, 'ninja r')) {
            $context['motor'] = 'ninja-r';
        }

        return $context;
    }

    private function detectMotorFromText(string $text): ?string
    {
        if (preg_match('/\b(ninja\s*rr|rr)\b/i', $text)) {
            return 'ninja-rr';
        }
        if (preg_match('/\b(ninja\s*ss|ss)\b/i', $text)) {
            return 'ninja-ss';
        }
        if (preg_match('/\b(ninja\s*r\b|kr150)/i', $text)) {
            return 'ninja-r';
        }
        return null;
    }

    private function formatMotorName(string $slug): string
    {
        return match ($slug) {
            'ninja-rr' => 'Kawasaki Ninja 150 RR',
            'ninja-r'  => 'Kawasaki Ninja 150 R',
            'ninja-ss' => 'Kawasaki Ninja 150 SS',
            default    => strtoupper($slug),
        };
    }

    private function getFeaturedProducts(int $limit = 2, ?string $motorSlug = null): array
    {
        try {
            $sql = "SELECT p.id, p.code, p.name, p.slug, p.price, p.stock,
                           (SELECT thumb_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
                    FROM products p ";
            $params = [];

            if ($motorSlug) {
                $sql .= "JOIN product_motor_types pmt ON pmt.product_id = p.id
                         JOIN motor_types mt ON mt.id = pmt.motor_type_id AND mt.slug = ? ";
                $params[] = $motorSlug;
            }

            $sql .= "WHERE p.status = 'available' AND p.deleted_at IS NULL
                     ORDER BY p.id DESC
                     LIMIT " . (int)$limit;

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    private function findProductsByKeywords(array $keywords, int $limit = 3): array
    {
        try {
            $clauses = [];
            $params = [];
            foreach ($keywords as $kw) {
                $clauses[] = "p.name LIKE ?";
                $params[] = '%' . $kw . '%';
            }
            $whereOr = implode(' OR ', $clauses);

            $sql = "SELECT p.id, p.code, p.name, p.slug, p.price, p.stock,
                           (SELECT thumb_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
                    FROM products p
                    WHERE ({$whereOr}) AND p.status = 'available' AND p.deleted_at IS NULL
                    ORDER BY p.id DESC
                    LIMIT " . (int)$limit;

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    public function search(string $query, ?string $motorType = null): array
    {
        $q = trim($query);
        $detectedMotor = $this->detectMotorFromText($q);
        $effectiveMotor = $motorType ?: $detectedMotor;

        $results = $this->productRepo->search([
            'q'          => $q,
            'motor_type' => $effectiveMotor,
            'per_page'   => 6,
        ]);

        $products = $results['data'] ?? [];

        return [
            'intent'            => 'catalog_search',
            'detected_category' => null,
            'detected_motor'    => $effectiveMotor,
            'products'          => array_map(function ($p) {
                return [
                    'id'            => $p['id'],
                    'code'          => $p['code'],
                    'name'          => $p['name'],
                    'slug'          => $p['slug'],
                    'price'         => (float)$p['price'],
                    'stock'         => (int)$p['stock'],
                    'status'        => $p['status'],
                    'condition'     => $p['condition_grade'] ?? 'good',
                    'primary_image' => $p['primary_thumb_path'] ?? $p['primary_image_path'] ?? null,
                ];
            }, $products),
            'explanation'       => count($products) > 0
                ? "Ditemukan " . count($products) . " sparepart sesuai kata kunci '{$q}'"
                : "Tidak ada produk yang persis cocok, silakan gunakan kata kunci umum seperti 'blok seher', 'karbu', atau 'knalpot'."
        ];
    }

    public function compatibility(int $productId, string $motorSlug): array
    {
        $product = $this->productRepo->findById($productId);
        if (!$product) {
            return [
                'compatible'   => false,
                'product_name' => 'Produk',
                'motor_name'   => $motorSlug,
                'explanation'  => 'Produk tidak ditemukan dalam database.',
                'notes'        => null,
            ];
        }

        $stmt = $this->db->prepare(
            "SELECT mt.id, mt.name, mt.slug, pmt.is_primary
             FROM product_motor_types pmt
             JOIN motor_types mt ON mt.id = pmt.motor_type_id
             WHERE pmt.product_id = ?"
        );
        $stmt->execute([$productId]);
        $compatibles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $matched = null;
        $allMotorNames = [];
        foreach ($compatibles as $c) {
            $allMotorNames[] = $c['name'];
            if ($c['slug'] === $motorSlug) {
                $matched = $c;
            }
        }

        $motorNameTarget = $this->formatMotorName($motorSlug);

        if ($matched) {
            return [
                'compatible'   => true,
                'product_name' => $product['name'],
                'motor_name'   => $matched['name'],
                'explanation'  => "Cocok 100% Plug & Play untuk {$matched['name']}. Part ini dirancang presisi sesuai spesifikasi motor Anda.",
                'notes'        => $product['compat_notes'] ?: 'Pemasangan PNP tanpa perlu modifikasi dudukan / braket.'
            ];
        }

        return [
            'compatible'   => false,
            'product_name' => $product['name'],
            'motor_name'   => $motorNameTarget,
            'explanation'  => "Kurang cocok / tidak langsung PNP untuk {$motorNameTarget}. Produk ini terdata khusus untuk: " . implode(', ', $allMotorNames) . ".",
            'notes'        => $product['compat_notes'] ?: 'Memerlukan penyesuaian braket atau konsultasikan terlebih dahulu dengan mekanik spesialis.'
        ];
    }

    public function describeProduct(array $imagePaths, ?string $notes = null, ?string $categoryName = null, ?string $productName = null): string
    {
        $cat = $categoryName ?: 'Suku Cadang';
        $title = $productName ?: ($cat . ' Original Kawasaki Ninja 2-Tak');
        $noteText = $notes ? trim($notes) : 'Kondisi barang mulus copotan unit normal, drat dan sirip aman, siap pasang.';

        return "Dijual {$title} copotan original bawaan motor Kawasaki Ninja 2-Tak (Kondisi Istimewa Pilihan Mas Wahyu PEPSO PARTS).\n\n" .
               "Kondisi Fisik & Spesifikasi:\n" .
               "• Keaslian: 100% Original Kawasaki OEM bawaan motor (Bukan part variasi murah / KW)\n" .
               "• Keutuhan: Fisik terawat, drat baut utuh, sirip pendingin tidak ada yang patah, tidak ada retak/pecah\n" .
               "• Catatan Mekanik: {$noteText}\n" .
               "• Kompatibilitas: Plug & Play presisi untuk tunggangan Ninja 150 kesayangan Anda\n\n" .
               "Jaminan barang sesuai deskripsi dan foto detail. Stok sangat terbatas (hanya 1 unit per seri copotan). Silakan langsung amankan order atau konsultasi pemasangan via WhatsApp!";
    }
}
