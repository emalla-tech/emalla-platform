
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Filter, Edit3, Trash2, ExternalLink, 
  AlertTriangle, CheckCircle, Package, X, Sparkles, Loader2
} from 'lucide-react';
import { MerchantService } from '../../services/merchantService';
import { geminiService } from '../../services/geminiService';
import { uploadService } from '../../services/uploadService';
import { Product } from '../../types';
import { CATEGORIES } from '../../constants';
import { getProductPrimaryImage, handleProductImageError } from '../../lib/productImages';

const SPECIFICATION_FIELDS = [
  { key: 'material', label: 'Material', placeholder: 'e.g. Genuine leather' },
  { key: 'dimensions', label: 'Dimensions', placeholder: 'e.g. 40 x 30 x 12 cm' },
  { key: 'weight', label: 'Weight', placeholder: 'e.g. 1.2 kg' },
  { key: 'warranty', label: 'Warranty', placeholder: 'e.g. 12 months' },
  { key: 'color', label: 'Color', placeholder: 'e.g. Black, Brown' },
  { key: 'size', label: 'Size', placeholder: 'e.g. S, M, L or Standard' }
] as const;

type SpecificationFieldKey = (typeof SPECIFICATION_FIELDS)[number]['key'];
type StructuredSpecifications = Record<SpecificationFieldKey, string> & { additional: string };

const createEmptySpecifications = (): StructuredSpecifications => ({
  material: '',
  dimensions: '',
  weight: '',
  warranty: '',
  color: '',
  size: '',
  additional: ''
});

const parseSpecifications = (raw: string | undefined): StructuredSpecifications => {
  const parsed = createEmptySpecifications();
  const remaining: string[] = [];
  const labelMap = Object.fromEntries(SPECIFICATION_FIELDS.map((field) => [field.label.toLowerCase(), field.key])) as Record<string, SpecificationFieldKey>;

  String(raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) {
        remaining.push(line);
        return;
      }

      const label = line.slice(0, separatorIndex).trim().toLowerCase();
      const value = line.slice(separatorIndex + 1).trim();
      const key = labelMap[label];

      if (key) {
        parsed[key] = value;
      } else if (value) {
        remaining.push(line);
      }
    });

  parsed.additional = remaining.join('\n');
  return parsed;
};

const buildSpecifications = (specifications: StructuredSpecifications) => {
  const lines = SPECIFICATION_FIELDS.map((field) => {
    const value = specifications[field.key].trim();
    return value ? `${field.label}: ${value}` : '';
  }).filter(Boolean);

  const additionalLines = specifications.additional
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return [...lines, ...additionalLines].join('\n');
};

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [structuredSpecifications, setStructuredSpecifications] = useState<StructuredSpecifications>(createEmptySpecifications());
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: '1',
    description: '',
    specifications: '',
    stock: 0,
    image: '',
    images: [],
    status: 'pending',
    featured: true
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await MerchantService.getProducts();
    setProducts(data);
  };

  const handleAiGenerate = async () => {
    if (!newProduct.name) {
      setToast('Please enter a product name first to help the AI.');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setIsGenerating(true);
    const categoryName = CATEGORIES.find(c => c.id === newProduct.category)?.name || 'General';
    const description = await geminiService.generateDescription(newProduct.name, categoryName);
    setNewProduct(prev => ({ ...prev, description }));
    setIsGenerating(false);
  };

  const processSelectedFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploadingImages(true);
    try {
      const uploadedImages = await Promise.all(
        files.map((file) => uploadService.uploadProductImage(file))
      );

      setNewProduct((prev) => {
        const currentImages = prev.images || [];
        const nextUrls = uploadedImages.map((entry) => entry.url);
        const updatedImages = [...currentImages, ...nextUrls];
        return {
          ...prev,
          images: updatedImages,
          image: prev.image || updatedImages[0] || ''
        };
      });

      const usedFallback = uploadedImages.some((entry) => entry.provider !== 'cloudinary');
      setToast(usedFallback ? 'Images uploaded locally. Add storage credentials for cloud delivery.' : 'Images uploaded successfully.');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Image upload failed.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processSelectedFiles(files);
    e.target.value = '';
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setNewProduct((prev) => {
      const images = [...(prev.images || [])];
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= images.length || toIndex >= images.length) {
        return prev;
      }

      const [moved] = images.splice(fromIndex, 1);
      images.splice(toIndex, 0, moved);

      return {
        ...prev,
        images,
        image: images[0] || ''
      };
    });
  };

  const handleDropUpload = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer.files || []).filter((file) => file.type.startsWith('image/'));
    await processSelectedFiles(files);
  };

  const removeImage = (index: number) => {
    setNewProduct(prev => {
      const updatedImages = (prev.images || []).filter((_, i) => i !== index);
      return {
        ...prev,
        images: updatedImages,
        image: updatedImages[0] || ''
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const productPayload = {
        ...newProduct,
        specifications: buildSpecifications(structuredSpecifications)
      };

      const savedProduct = editingProductId
        ? await MerchantService.updateProduct(editingProductId, productPayload)
        : await MerchantService.saveProduct(productPayload);
      
      const updatedProducts = await MerchantService.getProducts();
      setProducts(updatedProducts);
      
      if (savedProduct?.id) {
        setJustAddedId(savedProduct.id);
      }
      setTimeout(() => setJustAddedId(null), 3000);
      setToast(editingProductId ? 'Product updated successfully.' : 'Product added successfully.');
      setTimeout(() => setToast(null), 3000);

      setIsModalOpen(false);
      setEditingProductId(null);
      setNewProduct({
        name: '',
        price: 0,
        category: '1',
        description: '',
        specifications: '',
        stock: 0,
        image: '',
        images: [],
        status: 'pending',
        featured: true
      });
      setStructuredSpecifications(createEmptySpecifications());
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const confirmed = window.confirm('Remove this product from your inventory?');
    if (!confirmed) return;

    await MerchantService.deleteProduct(productId);
    loadProducts();
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setNewProduct({
      ...product,
      images: product.images || (product.image ? [product.image] : []),
      status: product.status || 'pending',
      featured: product.featured ?? false
    });
    setStructuredSpecifications(parseSpecifications(product.specifications));
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingProductId(null);
      setNewProduct({
        name: '',
        price: 0,
        category: '1',
        description: '',
        specifications: '',
        stock: 0,
        image: '',
        images: [],
      status: 'pending',
      featured: false
    });
    setStructuredSpecifications(createEmptySpecifications());
  };

  const visibleProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (CATEGORIES.find((category) => category.id === product.category)?.name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (showLowStockOnly && product.stock >= 5) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-24 right-6 z-[120] bg-emerald-500 text-white px-5 py-4 rounded-2xl shadow-2xl font-black text-sm">
          {toast}
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 text-sm">Manage your catalog, prices, and stock levels.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center shadow-lg shadow-orange-200 transition-all active:scale-95"
        >
          <Plus size={18} className="mr-2" /> Add New Product
        </button>
      </div>

      {/* Quick Filters */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by SKU, Name or Category..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all text-sm font-bold"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-3 bg-gray-50 rounded-2xl text-xs font-black text-gray-500 hover:bg-gray-100 flex items-center">
             <Filter size={14} className="mr-2" /> Categories
           </button>
           <button
             onClick={() => setShowLowStockOnly((current) => !current)}
             className={`px-4 py-3 rounded-2xl text-xs font-black flex items-center transition-all ${
               showLowStockOnly ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
             }`}
           >
             <AlertTriangle size={14} className="mr-2" /> Low Stock
           </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visibleProducts.map((p) => (
                <tr key={p.id} className={`group hover:bg-gray-50/50 transition-colors ${justAddedId === p.id ? 'bg-emerald-50/50 animate-pulse' : ''}`}>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden border border-gray-50 flex-shrink-0">
                        <img
                          src={getProductPrimaryImage(p)}
                          onError={(event) => handleProductImageError(event, p.category)}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                          alt={p.name}
                        />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                           <p className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{p.name}</p>
                           {justAddedId === p.id && <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">New</span>}
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">SKU: EM-{p.id.toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-medium text-gray-500">
                    {CATEGORIES.find(c => c.id === p.category)?.name || 'General'}
                  </td>
                  <td className="px-8 py-6 font-black text-gray-900 text-sm">RWF {p.price.toLocaleString()}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                       <span className={`text-sm font-black ${p.stock < 5 ? 'text-red-500' : 'text-gray-900'}`}>{p.stock}</span>
                       {p.stock < 5 && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        p.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : p.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        <CheckCircle size={10} className="mr-1.5" /> {p.status || 'pending'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleEditProduct(p)} className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-black hover:text-white transition-all"><Edit3 size={16} /></button>
                      <Link to={`/product/${p.id}`} className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-black hover:text-white transition-all"><ExternalLink size={16} /></Link>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Visible: {visibleProducts.length} of {products.length} Products</p>
          <div className="flex space-x-2">
             <span className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-400">
               All products loaded
             </span>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center p-8 border-b border-gray-100">
              <h2 className="text-2xl font-black text-gray-900">{editingProductId ? 'Edit Product' : 'List New Product'}</h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto no-scrollbar">
              {/* Image Upload Field */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Media (Multiple Allowed)</label>
                <div className="flex flex-wrap gap-4">
                  {(newProduct.images || []).map((img, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => setDraggedImageIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedImageIndex === null || draggedImageIndex === index) return;
                        moveImage(draggedImageIndex, index);
                        setDraggedImageIndex(null);
                      }}
                      onDragEnd={() => setDraggedImageIndex(null)}
                      className="w-24 h-24 rounded-2xl bg-gray-50 border border-gray-100 relative group overflow-hidden shadow-sm"
                    >
                      <img
                        src={img}
                        onError={(event) => handleProductImageError(event, newProduct.category)}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        alt={`Preview ${index}`}
                      />
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                      <div className="absolute left-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => moveImage(index, Math.max(0, index - 1))}
                          disabled={index === 0}
                          className="bg-white/90 text-gray-700 px-1.5 py-0.5 rounded text-[9px] font-black disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, Math.min((newProduct.images || []).length - 1, index + 1))}
                          disabled={index === (newProduct.images || []).length - 1}
                          className="bg-white/90 text-gray-700 px-1.5 py-0.5 rounded text-[9px] font-black disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-orange-500 text-white text-[8px] font-black py-0.5 text-center uppercase tracking-tighter">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragActive(true);
                    }}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={handleDropUpload}
                    className={`w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center hover:border-orange-500 cursor-pointer transition-all group ${
                      isDragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-gray-50/50'
                    }`}
                  >
                    {isUploadingImages ? (
                      <Loader2 className="text-orange-500 animate-spin" size={24} />
                    ) : (
                      <Plus className="text-gray-300 group-hover:text-orange-500" size={24} />
                    )}
                    <span className="text-[8px] font-black text-gray-400 uppercase mt-1">
                      {isUploadingImages ? 'Uploading' : isDragActive ? 'Drop Here' : 'Add Image'}
                    </span>
                    <input 
                      type="file" 
                      multiple
                      accept="image/*"
                      onChange={handleImagesChange}
                      disabled={isUploadingImages}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 font-medium italic">
                  Tip: Drag images into the upload box, then reorder thumbnails. The first image stays the main thumbnail.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
                  <input 
                    type="text" required
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="e.g. Inzira Premium Coffee"
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold text-gray-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                  <select 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold text-gray-900 appearance-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (RWF)</label>
                  <input 
                    type="number" required
                    value={newProduct.price || ''}
                    onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold text-gray-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Stock</label>
                  <input 
                    type="number" required
                    value={newProduct.stock || ''}
                    onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold text-gray-900 transition-all"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-orange-100 bg-orange-50 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Review Workflow</p>
                <p className="mt-2 text-sm font-bold text-gray-900">
                  Seller listings are submitted for admin review first. Approval status and featured placement are managed by the admin team.
                </p>
              </div>

              <div className="space-y-2 relative">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                  <button 
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={isGenerating}
                    className="flex items-center space-x-1 text-[10px] font-black text-orange-500 uppercase tracking-widest hover:text-orange-600 mb-1 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    <span>Generate with AI</span>
                  </button>
                </div>
                <textarea 
                  rows={4}
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Describe your product for your customers..."
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold text-gray-900 transition-all resize-none"
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Specifications</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SPECIFICATION_FIELDS.map((field) => (
                    <input
                      key={field.key}
                      type="text"
                      value={structuredSpecifications[field.key]}
                      onChange={(e) =>
                        setStructuredSpecifications((current) => ({
                          ...current,
                          [field.key]: e.target.value
                        }))
                      }
                      placeholder={field.placeholder}
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold text-gray-900 transition-all"
                    />
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={structuredSpecifications.additional}
                  onChange={(e) =>
                    setStructuredSpecifications((current) => ({
                      ...current,
                      additional: e.target.value
                    }))
                  }
                  placeholder="Additional specifications, one detail per line..."
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold text-gray-900 transition-all resize-none"
                ></textarea>
                <p className="text-[10px] text-gray-400 font-medium italic">
                  Structured fields make the product page cleaner, while extra lines can go in additional specifications.
                </p>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center space-x-3 hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <Package size={22} />
                      <span>{editingProductId ? 'Save Product Changes' : 'Confirm & List Product'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;

