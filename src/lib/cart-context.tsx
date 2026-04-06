'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export interface CartItem {
  id: string;
  name_ar: string;
  slug: string;
  price: number;
  compare_price: number | null;
  main_image: string | null;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, qty: number, size?: string, color?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

function getKey(item: { id: string; selectedSize?: string; selectedColor?: string }) {
  return `${item.id}_${item.selectedSize || ''}_${item.selectedColor || ''}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fam_cart');
      if (saved) setItems(JSON.parse(saved));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem('fam_cart', JSON.stringify(items));
    }
  }, [items, loaded]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems(prev => {
      const key = getKey(item);
      const idx = prev.findIndex(i => getKey(i) === key);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + qty };
        return updated;
      }
      return [...prev, { ...item, quantity: qty }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string, size?: string, color?: string) => {
    const key = `${id}_${size || ''}_${color || ''}`;
    setItems(prev => prev.filter(i => getKey(i) !== key));
  }, []);

  const updateQuantity = useCallback((id: string, qty: number, size?: string, color?: string) => {
    const key = `${id}_${size || ''}_${color || ''}`;
    if (qty <= 0) {
      setItems(prev => prev.filter(i => getKey(i) !== key));
    } else {
      setItems(prev => prev.map(i => getKey(i) === key ? { ...i, quantity: qty } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
}
