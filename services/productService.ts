import { CATALOG_PRODUCTS } from '../data/catalog';
import { Product } from '../types';
import { apiUrl } from './apiConfig';

const PRODUCTS_UPDATED_EVENT = 'emalla_products_updated';
let cachedProducts: Product[] | null = null;
let inflightProductsRequest: Promise<Product[]> | null = null;
const productListeners = new Set<(products: Product[]) => void>();

const request = async (path = '', init: RequestInit = {}) => {
  const token = localStorage.getItem('emalla_token');
  const headers = new Headers(init.headers || {});
  if (init.body != null && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(`/products${path}`), {
    ...init,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Product request failed');
  }

  return data;
};

const dispatchProductUpdate = () => {
  cachedProducts = null;
  window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT));
};

const emitProducts = (products: Product[]) => {
  productListeners.forEach((listener) => listener(products));
};

const cloneProducts = (products: Product[]) => JSON.parse(JSON.stringify(products)) as Product[];

export const ProductService = {
  eventName: PRODUCTS_UPDATED_EVENT,

  subscribe(listener: (products: Product[]) => void) {
    productListeners.add(listener);
    if (cachedProducts) {
      listener(cloneProducts(cachedProducts));
    }

    return () => {
      productListeners.delete(listener);
    };
  },

  getProducts: async (options?: { force?: boolean; fallbackToCatalog?: boolean }): Promise<Product[]> => {
    if (!options?.force && cachedProducts) {
      return cloneProducts(cachedProducts);
    }

    if (!options?.force && inflightProductsRequest) {
      return inflightProductsRequest.then((products) => cloneProducts(products));
    }

    inflightProductsRequest = (async () => {
      try {
        const response = await request();
        cachedProducts = response.products;
      } catch (error) {
        if (options?.fallbackToCatalog === false) {
          throw error;
        }
        cachedProducts = cloneProducts(CATALOG_PRODUCTS);
      } finally {
        inflightProductsRequest = null;
      }

      emitProducts(cloneProducts(cachedProducts || []));
      return cloneProducts(cachedProducts || []);
    })();

    return inflightProductsRequest.then((products) => cloneProducts(products));
  },

  getProductById: async (productId: string) => {
    const products = await ProductService.getProducts();
    return products.find((product) => product.id === productId) || null;
  },

  saveProduct: async (productData: Partial<Product>) => {
    const response = await request('', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    dispatchProductUpdate();
    return response.product as Product;
  },

  updateProduct: async (productId: string, updates: Partial<Product>) => {
    const response = await request(`/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    dispatchProductUpdate();
    return response.product as Product;
  },

  deleteProduct: async (productId: string) => {
    await request(`/${productId}`, {
      method: 'DELETE'
    });
    dispatchProductUpdate();
    return true;
  }
};
