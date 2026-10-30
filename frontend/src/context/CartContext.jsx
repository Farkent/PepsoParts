import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

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

  const addItem = (product, quantity = 1) => {
    if (product.status !== 'available' || (product.stock ?? 0) <= 0) {
      warning('Produk ini sudah terjual atau tidak tersedia.');
      return false;
    }

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = Math.min(currentQty + quantity, product.stock);
        if (newQty === currentQty) {
          warning(`Stok maksimal untuk produk ini adalah ${product.stock}.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        info(`Jumlah ${product.name} diperbarui menjadi ${newQty}.`);
        return updated;
      }

      if (prev.length >= 20) {
        warning('Maksimal 20 jenis barang per pesanan.');
        return prev;
      }

      const initialQty = Math.min(quantity, product.stock);
      info(`${product.name} dimasukkan ke keranjang.`);
      return [
        ...prev,
        {
          id: product.id,
          code: product.code,
          slug: product.slug,
          name: product.name,
          price: product.price,
          stock: product.stock,
          status: product.status,
          primary_image: product.primary_image || (product.images && product.images[0]?.thumb_path) || null,
          quantity: initialQty,
        },
      ];
    });

    return true;
  };

  const updateQty = (productId, newQty) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const max = item.stock || 1;
            const validQty = Math.max(1, Math.min(newQty, max));
            return { ...item, quantity: validQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
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

