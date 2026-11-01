<?php

declare(strict_types=1);

namespace Pepso\Services;

/**
 * SearchService - Mesin pencarian dasar PEPSO PARTS
 * Fitur:
 * - Normalisasi teks (huruf kecil, strip tanda baca)
 * - Kamus sinonim sparepart motor Indonesia (dari Config/synonyms.php)
 * - Toleransi salah ketik dengan levenshtein() / similar_text()
 * - Skor relevansi bertingkat (kode tepat > nama > kategori > deskripsi)
 */
class SearchService
{
    private array $synonyms = [];
    private array $dictionaryWords = [];

    public function __construct()
    {
        $synonymsFile = dirname(__DIR__) . '/Config/synonyms.php';
        if (file_exists($synonymsFile)) {
            $this->synonyms = require $synonymsFile;
            
            // Bangun daftar kata unik dari kamus sinonim untuk pengecekan typo
            $words = [];
            foreach ($this->synonyms as $k => $v) {
                $words[$k] = true;
                foreach ($v as $syn) {
                    $words[$syn] = true;
                }
            }
            $this->dictionaryWords = array_keys($words);
        }
    }

    /**
     * Normalisasi teks query: huruf kecil, strip tanda baca, trim spasi ganda.
     */
    public function normalize(string $text): string
    {
        $text = mb_strtolower(trim($text), 'UTF-8');
        // Hapus tanda baca kecuali tanda hubung
        $text = preg_replace('/[^\p{L}\p{N}\s\-]/u', ' ', $text);
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }

    /**
     * Temukan kata terdekat dari kamus jika terjadi salah ketik (typo).
     */
    public function findClosestWord(string $word): ?string
    {
        $wordLen = mb_strlen($word);
        if ($wordLen < 3) {
            return null;
        }

        $bestWord = null;
        $bestScore = 0.0;

        foreach ($this->dictionaryWords as $dictWord) {
            // Hanya bandingkan dengan kata tunggal
            if (str_contains($dictWord, ' ')) {
                continue;
            }

            $score = $this->fuzzyScore($word, $dictWord);
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestWord = $dictWord;
            }
        }

        // Ambang batas kesamaan: minimal 0.70 atau Levenshtein distance <= 2
        if ($bestScore >= 0.70) {
            return $bestWord;
        }

        return null;
    }

    /**
     * Perluas query dengan sinonim dan koreksi salah ketik dari kamus.
     * @return string[] Array kata-kata query yang sudah diperluas
     */
    public function expandWithSynonyms(string $normalizedQuery): array
    {
        $words = explode(' ', $normalizedQuery);
        $expanded = [];

        foreach ($words as $word) {
            $expanded[] = $word;

            // 1. Cek sinonim langsung
            if (isset($this->synonyms[$word])) {
                foreach ($this->synonyms[$word] as $synonym) {
                    $expanded[] = $synonym;
                }
            }

            // 2. Cek toleransi salah ketik (typo)
            $closest = $this->findClosestWord($word);
            if ($closest && $closest !== $word) {
                $expanded[] = $closest;
                if (isset($this->synonyms[$closest])) {
                    foreach ($this->synonyms[$closest] as $synonym) {
                        $expanded[] = $synonym;
                    }
                }
            }
        }

        // Cek frasa 2-kata untuk sinonim majemuk (mis. "ninja r" => ekspansi)
        for ($i = 0; $i < count($words) - 1; $i++) {
            $phrase = $words[$i] . ' ' . $words[$i + 1];
            if (isset($this->synonyms[$phrase])) {
                foreach ($this->synonyms[$phrase] as $synonym) {
                    $expanded[] = $synonym;
                }
            }
        }

        return array_unique($expanded);
    }

    /**
     * Hitung toleransi kesamaan antara dua string menggunakan kombinasi
     * similar_text (persen kesamaan karakter) dan levenshtein (jarak edit).
     * Mengembalikan nilai 0.0 - 1.0, 1.0 = identik.
     */
    public function fuzzyScore(string $a, string $b): float
    {
        if ($a === $b) {
            return 1.0;
        }

        similar_text($a, $b, $percent);

        if (mb_strlen($a) >= 3 && mb_strlen($b) >= 3) {
            $dist = levenshtein(
                mb_substr($a, 0, 30, 'UTF-8'),
                mb_substr($b, 0, 30, 'UTF-8')
            );
            $maxLen = max(mb_strlen($a), mb_strlen($b));
            $levScore = max(0, 1 - ($dist / $maxLen));
            return ($percent / 100 * 0.5) + ($levScore * 0.5);
        }

        return $percent / 100;
    }

    /**
     * Hitung skor relevansi sebuah produk terhadap query.
     */
    public function scoreProduct(array $product, array $queryWords): float
    {
        $score = 0.0;
        $normalCode = $this->normalize($product['code'] ?? '');
        $normalName = $this->normalize($product['name'] ?? '');
        $normalCat  = $this->normalize($product['category_name'] ?? '');
        $normalDesc = $this->normalize($product['description'] ?? '');
        $normalMotor = $this->normalize($product['motor_types_text'] ?? '');

        foreach ($queryWords as $word) {
            if (mb_strlen($word) < 2) {
                continue;
            }

            // Kode produk: kecocokan tepat dapat nilai tertinggi
            if (str_contains($normalCode, $word)) {
                $score += 10.0;
            }

            // Nama produk: kecocokan substring
            if (str_contains($normalName, $word)) {
                $score += 5.0;
            }

            // Fuzzy matching pada nama produk (toleransi typo)
            foreach (explode(' ', $normalName) as $namePart) {
                if (mb_strlen($namePart) >= 3) {
                    $fuzz = $this->fuzzyScore($word, $namePart);
                    if ($fuzz >= 0.70) {
                        $score += $fuzz * 3.0;
                    }
                }
            }

            // Tipe motor
            if (str_contains($normalMotor, $word)) {
                $score += 3.0;
            }

            // Kategori
            if (str_contains($normalCat, $word)) {
                $score += 2.0;
            }

            // Deskripsi
            if (str_contains($normalDesc, $word)) {
                $score += 1.0;
            }
        }

        // Bonus ketersediaan
        if (($product['status'] ?? '') === 'available' && ($product['stock'] ?? 0) > 0) {
            $score += 0.5;
        }

        return $score;
    }
}
