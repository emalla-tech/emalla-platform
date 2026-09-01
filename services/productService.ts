import { Product } from '../types';
import { apiUrl } from './apiConfig';
import { monitoringService } from './monitoringService';

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

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error || 'Product request failed';
    if (response.status >= 500) {
      monitoringService.reportApiError({
        path: `/products${path}`,
        statusCode: response.status,
        message,
        requestId: data?.requestId || response.headers.get('x-request-id') || undefined
      });
    }
    throw new Error(message);
  }

  if (!data || !Array.isArray(data.products)) {
    monitoringService.reportApiError({
      path: `/products${path}`,
      statusCode: response.status,
      message: 'Products API returned an invalid response'
    });
    throw new Error('Products API returned an invalid response');
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

const shouldUseCatalogFallback = (options?: { fallbackToCatalog?: boolean }) =>
  options?.fallbackToCatalog ?? import.meta.env.DEV;

const loadCatalogFallback = async () => {
  if (import.meta.env.PROD) {
    return [];
  }

  const { CATALOG_PRODUCTS } = await import('../data/catalog');
  return cloneProducts(CATALOG_PRODUCTS);
};

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
        monitoringService.reportApiError({
          path: '/products',
          message: error instanceof Error ? error.message : 'Unable to load products'
        });
        cachedProducts = shouldUseCatalogFallback(options) ? await loadCatalogFallback() : [];
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
