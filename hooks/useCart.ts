import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProductService } from '../services/productService';
import { Product } from '../types';

const STORAGE_KEY = 'emalla_cart';

export interface CartItem {
  productId: string;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
}

export interface CartLineItem extends CartItem {
  product: Product;
  subtotal: number;
}

const readCart = (): CartItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>(readCart);
  const [catalogProducts, setCatalogProducts] = useState<Record<string, Product>>({});

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => {
      const catalogProduct = catalogProducts[item.productId];
      const availableStock = catalogProduct ? Math.max(0, Number(catalogProduct.stock || 0)) : Number.POSITIVE_INFINITY;
      if (catalogProduct && availableStock === 0) return current;

      const existingIndex = current.findIndex(
        (entry) =>
          entry.productId === item.productId &&
          entry.selectedSize === item.selectedSize &&
          entry.selectedColor === item.selectedColor
      );

      if (existingIndex === -1) {
        return [...current, { ...item, quantity: Math.min(Math.max(1, item.quantity), availableStock) }];
      }

      const next = [...current];
      next[existingIndex] = {
        ...next[existingIndex],
        quantity: Math.min(next[existingIndex].quantity + item.quantity, availableStock)
      };
      return next;
    });
  }, [catalogProducts]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const catalogProduct = catalogProducts[productId];
    const availableStock = catalogProduct ? Math.max(0, Number(catalogProduct.stock || 0)) : Number.POSITIVE_INFINITY;
    setItems((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, quantity: Math.min(quantity, availableStock) } : item))
        .filter((item) => item.quantity > 0)
    );
  }, [catalogProducts]);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      const products = await ProductService.getProducts();
      setCatalogProducts(
        Object.fromEntries(products.map((product) => [product.id, product]))
      );
    };

    loadProducts();
    const unsubscribe = ProductService.subscribe((products) => {
      setCatalogProducts(
        Object.fromEntries(products.map((product) => [product.id, product]))
      );
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const detailedItems = useMemo<CartLineItem[]>(
    () =>
      items
        .map((item) => {
          const product = catalogProducts[item.productId];

          if (!product) {
            return null;
          }

          return {
            ...item,
            product,
            subtotal: product.price * item.quantity
          };
        })
        .filter((item): item is CartLineItem => item !== null),
    [catalogProducts, items]
  );

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => detailedItems.reduce((total, item) => total + item.subtotal, 0),
    [detailedItems]
  );

  return {
    items,
    detailedItems,
    itemCount,
    subtotal,
    addItem,
    updateQuantity,
    removeItem,
    clearCart
  };
};
