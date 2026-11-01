<?php

declare(strict_types=1);

namespace Pepso\Services\Ai;

interface AiProviderInterface
{
    /**
     * Chat conversation with catalog assistant.
     *
     * @param string $message User question/prompt
     * @param string|null $myMotorSlug Selected motor slug (ninja-r, ninja-rr, ninja-ss)
     * @param array $history Previous chat messages [{role: 'user'|'model', text: '...'}]
     * @return array{
     *   text: string,
     *   suggested_products: array,
     *   quick_replies: string[],
     *   fallback_to_whatsapp: bool
     * }
     */
    public function chat(string $message, ?string $myMotorSlug = null, array $history = []): array;

    /**
     * Intent-based smart search.
     *
     * @param string $query Natural language query
     * @param string|null $motorType Motor type filter if any
     * @return array{
     *   intent: string,
     *   detected_category: string|null,
     *   detected_motor: string|null,
     *   products: array,
     *   explanation: string
     * }
     */
    public function search(string $query, ?string $motorType = null): array;

    /**
     * Check compatibility between a product and a motor type.
     *
     * @param int $productId Product ID
     * @param string $motorSlug Motor slug (e.g. 'ninja-rr')
     * @return array{
     *   compatible: bool,
     *   product_name: string,
     *   motor_name: string,
     *   explanation: string,
     *   notes: string|null
     * }
     */
    public function compatibility(int $productId, string $motorSlug): array;

    /**
     * Generate product description draft from photo paths and notes.
     *
     * @param array $imagePaths Relative paths or URLs of product photos
     * @param string|null $notes Additional technical notes / condition details
     * @param string|null $categoryName Category name
     * @param string|null $productName Optional proposed product name
     * @return string Generated description text
     */
    public function describeProduct(array $imagePaths, ?string $notes = null, ?string $categoryName = null, ?string $productName = null): string;
}
