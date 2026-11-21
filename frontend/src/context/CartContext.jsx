import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

// Kunci unik satu baris keranjang: produk yang sama dengan varian berbeda = baris berbeda
export const itemKey = (item) => `${item.id}:${item.variant_id || 0}`;

export function CartProvider({ children }) {
  const { warning, info } = useToast();
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('pepso_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('pepso_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1, variant = null) => {
    // Produk bervarian wajib memilih varian
    if (product.variants?.length > 0 && !variant) {
      warning('Silakan pilih varian terlebih dahulu.');
      return false;
    }

    const unitStock = variant ? variant.stock : product.stock;
    const unitPrice = variant ? variant.price : product.price;
    const variantId = variant ? variant.id : null;

    if (product.status !== 'available' || (unitStock ?? 0) <= 0) {
      warning('Produk ini sudah terjual atau tidak tersedia.');
      return false;
    }

    const label = variant ? `${product.name} (${variant.name})` : product.name;

    setItems((prev) => {
      const key = `${product.id}:${variantId || 0}`;
      const existingIndex = prev.findIndex((item) => itemKey(item) === key);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = Math.min(currentQty + quantity, unitStock);
        if (newQty === currentQty) {
          warning(`Stok maksimal untuk produk ini adalah ${unitStock}.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty, stock: unitStock, price: unitPrice };
        info(`Jumlah ${label} diperbarui menjadi ${newQty}.`);
        return updated;
      }

      if (prev.length >= 20) {
        warning('Maksimal 20 jenis barang per pesanan.');
        return prev;
      }

      const initialQty = Math.min(quantity, unitStock);
      info(`${label} dimasukkan ke keranjang.`);
      return [
        ...prev,
        {
          id: product.id,
          variant_id: variantId,
          variant_name: variant ? variant.name : null,
          code: product.code,
          slug: product.slug,
          name: product.name,
          price: unitPrice,
          stock: unitStock,
          status: product.status,
          primary_image: (() => {
            const vi = variant?.image_id ? (product.images || []).find((im) => Number(im.id) === Number(variant.image_id)) : null;
            return vi ? (vi.thumb_path || vi.path) : (product.primary_image || (product.images && product.images[0]?.thumb_path) || null);
          })(),
          quantity: initialQty,
        },
      ];
    });

    return true;
  };

  const updateQty = (key, newQty) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (itemKey(item) === key) {
            const max = item.stock || 1;
            const validQty = Math.max(1, Math.min(newQty, max));
            return { ...item, quantity: validQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (key) => {
    setItems((prev) => prev.filter((item) => itemKey(item) !== key));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQty,
        removeItem,
        clearCart,
        setItems,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

