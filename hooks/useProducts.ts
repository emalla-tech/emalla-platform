import { useEffect, useState } from 'react';
import { Product } from '../types';
import { ProductService } from '../services/productService';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      const nextProducts = await ProductService.getProducts();
      setProducts(nextProducts);
    };

    loadProducts();
    const unsubscribe = ProductService.subscribe(setProducts);

    return () => {
      unsubscribe();
    };
  }, []);

  return products;
};
