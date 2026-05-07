import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Search, Star, XCircle, X, ImageIcon, Package, Store, Tag } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../../types';
import { ProductService } from '../../services/productService';
import { CATEGORIES } from '../../constants';
import AdminToast from '../../components/AdminToast';
import { getProductGalleryImages, getProductPrimaryImage, handleProductImageError } from '../../lib/productImages';

const ProductApprovals: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'draft'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'error' | 'info'>('success');
  const focusProductId = searchParams.get('productId');
  const focusProductName = searchParams.get('productName');

  useEffect(() => {
    const loadProducts = async () => {
      const nextProducts = await ProductService.getProducts();
      setProducts(nextProducts);
    };

    loadProducts();
    window.addEventListener(ProductService.eventName, loadProducts);

    return () => {
      window.removeEventListener(ProductService.eventName, loadProducts);
    };
  }, []);

  useEffect(() => {
    if (focusProductName) {
      setSearchTerm(focusProductName);
    }
  }, [focusProductName]);

  useEffect(() => {
    if (!products.length) return;

    const focusedProduct = products.find(
      (product) =>
        (focusProductId && product.id === focusProductId) ||
        (focusProductName && product.name === focusProductName)
    );

    if (focusedProduct) {
      setSelectedProduct(focusedProduct);
    }
  }, [products, focusProductId, focusProductName]);

  useEffect(() => {
    if (!selectedProduct) return;

    const refreshedSelection = products.find((product) => product.id === selectedProduct.id);
    if (refreshedSelection) {
      setSelectedProduct(refreshedSelection);
    }
  }, [products, selectedProduct]);

  const handleStatusUpdate = async (productId: string, status: string) => {
    try {
      await ProductService.updateProduct(productId, { status });
      setToastTone('success');
      setToast(`Product moved to ${status}.`);
    } catch (error) {
      setToastTone('error');
      setToast(error instanceof Error ? error.message : 'Failed to update product status.');
    }
    setTimeout(() => setToast(null), 3000);
  };

  const handleFeaturedUpdate = async (product: Product) => {
    try {
      const nextFeatured = !product.featured;
      await ProductService.updateProduct(product.id, { featured: nextFeatured });
      setToastTone('success');
      setToast(nextFeatured ? 'Product featured successfully.' : 'Product removed from featured placement.');
    } catch (error) {
      setToastTone('error');
      setToast(error instanceof Error ? error.message : 'Failed to update featured state.');
    }
    setTimeout(() => setToast(null), 3000);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.merchantName || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'all') return true;
    return (product.status || 'pending') === activeFilter;
  });
  const selectedProductImages = selectedProduct ? getProductGalleryImages(selectedProduct) : [];

  return (
    <div className="space-y-8">
      <AdminToast message={toast} tone={toastTone} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Product Approval Desk</h1>
          <p className="text-gray-500">Review seller listings, approve visibility, and manage featured placement.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
          <Clock3 size={18} className="text-orange-500" />
          <span className="text-xs font-black uppercase tracking-widest text-gray-500">
            Pending: {products.filter((product) => (product.status || 'pending') === 'pending').length}
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product or merchant..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 font-bold outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'approved', 'draft'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeFilter === filter ? 'bg-black text-white' : 'bg-gray-50 text-gray-500'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className={`bg-white border rounded-[32px] p-6 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              (focusProductId && product.id === focusProductId) || (focusProductName && product.name === focusProductName)
                ? 'border-orange-300 ring-2 ring-orange-100'
                : 'border-gray-100'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <img
                  src={getProductPrimaryImage(product)}
                  alt={product.name}
                  onError={(event) => handleProductImageError(event, product.category)}
                  className="w-20 h-20 rounded-2xl object-cover bg-gray-50"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-gray-900">{product.name}</h3>
                    {product.featured && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-[10px] font-black uppercase">Featured</span>}
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{product.merchantName || 'Unknown merchant'}</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                    {CATEGORIES.find((category) => category.id === product.category)?.name || 'General'} | RWF {product.price.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={(event) => { event.stopPropagation(); handleStatusUpdate(product.id, 'approved'); }} className="px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-xs flex items-center">
                  <CheckCircle2 size={16} className="mr-2" /> Approve
                </button>
                <button onClick={(event) => { event.stopPropagation(); handleStatusUpdate(product.id, 'pending'); }} className="px-4 py-3 rounded-2xl bg-yellow-50 text-yellow-700 font-black text-xs flex items-center">
                  <Clock3 size={16} className="mr-2" /> Pending
                </button>
                <button onClick={(event) => { event.stopPropagation(); handleStatusUpdate(product.id, 'draft'); }} className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black text-xs flex items-center">
                  <XCircle size={16} className="mr-2" /> Draft
                </button>
                <button onClick={(event) => { event.stopPropagation(); handleFeaturedUpdate(product); }} className={`px-4 py-3 rounded-2xl font-black text-xs flex items-center ${product.featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                  <Star size={16} className="mr-2" /> {product.featured ? 'Unfeature' : 'Feature'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/40 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close product details"
            className="flex-1 cursor-default"
            onClick={() => setSelectedProduct(null)}
          />
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl border-l border-gray-100 overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-8 py-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Listing Details</p>
                <h2 className="text-2xl font-black text-gray-900">{selectedProduct.name}</h2>
                <p className="text-sm text-gray-500 mt-2">Review seller listing quality, visibility, stock, and merchandising status.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="w-11 h-11 rounded-2xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-orange-200 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Merchant</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Store size={16} className="text-orange-500" />
                    {selectedProduct.merchantName || 'Unknown merchant'}
                  </div>
                </div>
                <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Category</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Tag size={16} className="text-orange-500" />
                    {CATEGORIES.find((category) => category.id === selectedProduct.category)?.name || 'General'}
                  </div>
                </div>
                <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Status</p>
                  <p className="text-sm font-bold text-gray-900 uppercase">{selectedProduct.status || 'pending'}</p>
                </div>
                <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Featured Placement</p>
                  <p className="text-sm font-bold text-gray-900">{selectedProduct.featured ? 'Featured on storefront' : 'Standard listing'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-3xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <Package size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Inventory</p>
                  </div>
                  <p className="text-lg font-black text-gray-900">{selectedProduct.stock} units</p>
                </div>
                <div className="rounded-3xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <Tag size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Price</p>
                  </div>
                  <p className="text-lg font-black text-gray-900">RWF {selectedProduct.price.toLocaleString()}</p>
                </div>
                <div className="rounded-3xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <Star size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Ratings</p>
                  </div>
                  <p className="text-lg font-black text-gray-900">{selectedProduct.rating || 0} / 5</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedProduct.reviewsCount || 0} reviews</p>
                </div>
              </div>

              <div className="rounded-[32px] border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <ImageIcon size={18} className="text-orange-500" />
                  <h3 className="text-lg font-black text-gray-900">Listing Images</h3>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedProductImages.map((image, index) => (
                    <img
                      key={`${image}-${index}`}
                      src={image}
                      alt={`${selectedProduct.name} ${index + 1}`}
                      onError={(event) => handleProductImageError(event, selectedProduct.category)}
                      className="w-full aspect-square object-cover rounded-2xl bg-gray-50 border border-gray-100"
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-100 px-6 py-5">
                <h3 className="text-lg font-black text-gray-900 mb-3">Product Description</h3>
                <p className="text-sm text-gray-600 leading-7">
                  {selectedProduct.description || 'No product description was provided by the seller.'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900 mb-4">Approval Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => handleStatusUpdate(selectedProduct.id, 'approved')} className="px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-xs flex items-center">
                    <CheckCircle2 size={16} className="mr-2" /> Approve
                  </button>
                  <button onClick={() => handleStatusUpdate(selectedProduct.id, 'pending')} className="px-4 py-3 rounded-2xl bg-yellow-50 text-yellow-700 font-black text-xs flex items-center">
                    <Clock3 size={16} className="mr-2" /> Set Pending
                  </button>
                  <button onClick={() => handleStatusUpdate(selectedProduct.id, 'draft')} className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black text-xs flex items-center">
                    <XCircle size={16} className="mr-2" /> Move to Draft
                  </button>
                  <button onClick={() => handleFeaturedUpdate(selectedProduct)} className={`px-4 py-3 rounded-2xl font-black text-xs flex items-center ${selectedProduct.featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                    <Star size={16} className="mr-2" /> {selectedProduct.featured ? 'Remove Featured' : 'Make Featured'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductApprovals;
