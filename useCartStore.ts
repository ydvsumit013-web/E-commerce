import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';

export interface CartItem {
  product: string;
  quantity: number;
  price: number;
  name?: string;
  imageUrl?: string;
  stock?: number;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  itemCount: number;
  discountCode?: string;
  discountPercent: number;
  isLoading: boolean;
  lastCacheStatus: 'HIT' | 'MISS' | null;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  applyDiscount: (code: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  subtotal: 0,
  discountAmount: 0,
  total: 0,
  itemCount: 0,
  discountPercent: 0,
  isLoading: false,
  lastCacheStatus: null,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/cart');
      const cacheStatus = res.headers['x-cache'] as 'HIT' | 'MISS' | null;
      set({ ...res.data, isLoading: false, lastCacheStatus: cacheStatus });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1) => {
    try {
      await api.post('/cart/add', { productId, quantity });
      toast.success('Added to cart!');
      // refetch to get updated totals
      const res = await api.get('/cart');
      set({ ...res.data });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add item';
      toast.error(msg);
    }
  },

  removeItem: async (productId) => {
    try {
      await api.delete(`/cart/item/${productId}`);
      const res = await api.get('/cart');
      set({ ...res.data });
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove item');
    }
  },

  applyDiscount: async (code) => {
    try {
      const res = await api.post('/cart/apply-discount', { code });
      toast.success(res.data.message);
      const cartRes = await api.get('/cart');
      set({ ...cartRes.data });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid code';
      toast.error(msg);
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart');
      set({ items: [], subtotal: 0, discountAmount: 0, total: 0, itemCount: 0 });
      toast.success('Cart cleared');
    } catch {
      toast.error('Failed to clear cart');
    }
  },
}));
