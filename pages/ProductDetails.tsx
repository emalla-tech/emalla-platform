
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  ShoppingBag, 
  Heart, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Minus, 
  Plus,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Check
} from 'lucide-react';
import { CATEGORIES } from '../constants';
import { useProducts } from '../hooks/useProducts';
import { CustomerService } from '../services/customerService';
import { geminiService } from '../services/geminiService';
import { Product, ProductReview } from '../types';
import { useAuth } from '../auth/AuthContext';
import { getProductGalleryImages, getProductPrimaryImage, handleProductImageError } from '../lib/productImages';

const RECENTLY_VIEWED_KEY = 'emalla_recently_viewed_products';

interface ProductDetailsProps {
  onAddToCart: (item: {
    productId: string;
    quantity: number;
    selectedSize?: string | null;
    selectedColor?: string | null;
  }) => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ onAddToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const carouselRef = useRef<HTMLDivElement>(null);
  const products = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews' | 'shipping'>('description');
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Gallery State
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (products.length === 0) {
      return;
    }

    const found = products.find(p => p.id === id) || null;
    setProduct(found);
    setQuantity(1);
    setAiDescription(null);
    setIsAdded(false);
    setActiveImageIndex(0);
    setReviewMessage(null);
    setReviewError(null);
    
    // Set default variants if available
    if (found?.variants?.sizes?.length) setSelectedSize(found.variants.sizes[0]);
    else setSelectedSize(null);
    
    if (found?.variants?.colors?.length) setSelectedColor(found.variants.colors[0].name);
    else setSelectedColor(null);

    if (found) {
      const current = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]') as string[];
      const next = [found.id, ...current.filter((entry) => entry !== found.id)].slice(0, 8);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, products]);

  useEffect(() => {
    if (!product) {
      setReviews([]);
      return;
    }

    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const nextReviews = await CustomerService.getProductReviews(product.id);
        setReviews(nextReviews);
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, [product]);

  useEffect(() => {
    const loadWishlistState = async () => {
      if (!product || user?.role !== 'CUSTOMER') {
        setIsWishlisted(false);
        return;
      }

      const productIds = await CustomerService.getWishlistProductIds();
      setIsWishlisted(productIds.includes(product.id));
    };

    loadWishlistState();
  }, [product, user]);

  const productImages = useMemo(() => {
    return getProductGalleryImages(product || undefined);
  }, [product]);

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 8); // Slice more for carousel
  }, [product, products]);

  const specificationItems = useMemo(() => {
    if (!product) {
      return [];
    }

    const manualSpecifications = String(product.specifications || '')
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (manualSpecifications.length > 0) {
      return manualSpecifications.map((line) => {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex === -1) {
          return { label: 'Detail', value: line };
        }

        return {
          label: line.slice(0, separatorIndex).trim(),
          value: line.slice(separatorIndex + 1).trim()
        };
      });
    }

    const sizes = product.variants?.sizes?.join(', ');
    const colors = product.variants?.colors?.map((color) => color.name).join(', ');

    return [
      { label: 'Category', value: CATEGORIES.find((category) => category.id === product.category)?.name || 'General' },
      { label: 'Seller', value: product.merchantName || 'E-Malla Merchant' },
      { label: 'Price', value: `RWF ${product.price.toLocaleString()}` },
      { label: 'Availability', value: product.stock > 0 ? `${product.stock} units in stock` : 'Out of stock' },
      { label: 'Customer Rating', value: `${product.rating} / 5.0` },
      { label: 'Review Count', value: `${reviews.length || product.reviewsCount || 0} review(s)` },
      sizes ? { label: 'Sizes', value: sizes } : null,
      colors ? { label: 'Colors', value: colors } : null,
      { label: 'Listing Status', value: product.status ? product.status.replace(/_/g, ' ') : 'Active' },
      { label: 'Featured', value: product.featured ? 'Yes' : 'No' }
    ].filter(Boolean);
  }, [product, reviews.length]);

  const generateAIDescription = async () => {
    if (!product) return;
    setIsGenerating(true);
    const categoryName = CATEGORIES.find(c => c.id === product.category)?.name || 'General';
    const text = await geminiService.generateDescription(product.name, categoryName);
    setAiDescription(text);
    setIsGenerating(false);
  };

  const handleAddToCart = () => {
    onAddToCart({
      productId: product!.id,
      quantity,
      selectedSize,
      selectedColor
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    if (user?.role !== 'CUSTOMER') {
      navigate('/login');
      return;
    }

    await CustomerService.toggleWishlist(product.id, isWishlisted);
    setIsWishlisted((current) => !current);
  };

  const handleSubmitReview = async () => {
    if (!product) return;

    setReviewSubmitting(true);
    setReviewError(null);
    setReviewMessage(null);

    try {
      const review = await CustomerService.submitReview(product.id, reviewRating, reviewComment.trim());
      const nextReviews = [review, ...reviews.filter((entry) => entry.userId !== review.userId)];
      setReviews(nextReviews);
      const nextAverage = nextReviews.reduce((sum, entry) => sum + entry.rating, 0) / nextReviews.length;
      setProduct({
        ...product,
        reviewsCount: nextReviews.length,
        rating: Number(nextAverage.toFixed(1))
      });
      setReviewComment('');
      setReviewMessage('Review submitted successfully.');
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const formatReviewDate = (value: string) =>
    new Date(value).toLocaleDateString('en-RW', { year: 'numeric', month: 'short', day: 'numeric' });

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (products.length === 0) return <div className="p-20 text-center">Loading product...</div>;
  if (!product) return <div className="p-20 text-center">Product not found.</div>;

  return (
    <div className="bg-white min-h-screen pb-32 md:pb-0">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center space-x-2 text-sm text-gray-500 border-b md:border-none">
        <Link to="/" className="hover:text-orange-500 transition-colors">Home</Link>
        <ChevronRight size={14} />
        <Link to="/shop" className="hover:text-orange-500 transition-colors">Shop</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
          
          {/* Product Gallery */}
          <div className="space-y-6">
            <div className="aspect-square bg-gray-50 rounded-[40px] overflow-hidden border border-gray-100 shadow-sm relative group">
              <img 
                src={productImages[activeImageIndex] || getProductPrimaryImage(product)} 
                alt={product.name} 
                onError={(event) => handleProductImageError(event, product.category)}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover transition-all duration-700"
              />
              
              {/* Navigation Controls */}
              {productImages.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-500 hover:text-white"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-500 hover:text-white"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              <div className="absolute top-8 left-8">
                <span className="bg-white/90 backdrop-blur shadow-sm text-orange-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-orange-100">
                  {CATEGORIES.find(c => c.id === product.category)?.name}
                </span>
              </div>

              {/* Progress Dots */}
              {productImages.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
                  {productImages.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${activeImageIndex === i ? 'w-8 bg-orange-500' : 'w-2 bg-gray-300'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {productImages.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImageIndex(i)}
                  className={`aspect-square w-24 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${activeImageIndex === i ? 'border-orange-500 shadow-md scale-105' : 'border-gray-100 hover:border-orange-200 opacity-70 hover:opacity-100'}`}
                >
                  <img
                    src={img}
                    onError={(event) => handleProductImageError(event, product.category)}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                    alt={`Gallery view ${i + 1}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Actions & Info */}
          <div className="flex flex-col justify-start">
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{product.name}</h1>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center text-yellow-500 bg-yellow-50 px-2 py-1 rounded-lg">
                  <Star size={16} fill="currentColor" />
                  <span className="ml-1.5 text-gray-900 font-bold">{product.rating}</span>
                  <span className="ml-1 text-gray-400 font-normal text-xs">/ 5.0</span>
                </div>
                <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className="text-orange-500 font-semibold text-sm hover:underline"
                >
                  {reviews.length || product.reviewsCount || 0} customer reviews
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 md:hidden">
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Stock Availability</p>
                <p className="mt-2 text-base font-black text-gray-900">{product.stock > 0 ? `${product.stock} items ready` : 'Currently unavailable'}</p>
              </div>
              <div className="rounded-3xl border border-orange-100 bg-orange-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">Seller Info</p>
                <p className="mt-2 text-base font-black text-gray-900">{product.merchantName || 'E-Malla Merchant'}</p>
              </div>
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Delivery Info</p>
                <p className="mt-2 text-sm font-bold text-gray-900">Doorstep delivery and pickup options available in Rwanda.</p>
              </div>
              <div className="rounded-3xl border border-yellow-100 bg-yellow-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-yellow-700">Reviews</p>
                <p className="mt-2 text-sm font-bold text-gray-900">{reviews.length || product.reviewsCount || 0} verified reviews with live rating updates.</p>
              </div>
            </div>

            {/* Purchase Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden mb-8">
              <div className="p-6 md:p-8 space-y-8">
                {/* Price & Stock Status */}
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Price</p>
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl font-black text-gray-900">RWF {product.price.toLocaleString()}</span>
                      <span className="text-sm text-gray-400 line-through">RWF {(product.price * 1.2).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold">
                      <CheckCircle2 size={14} />
                      <span>In Stock</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase">Ready for pickup</p>
                  </div>
                </div>

                {/* Variants Selection */}
                {(product.variants?.colors || product.variants?.sizes) && (
                  <div className="space-y-6">
                    {product.variants.colors && (
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Color: <span className="text-gray-900">{selectedColor}</span></label>
                        <div className="flex flex-wrap gap-3">
                          {product.variants.colors.map((color) => (
                            <button
                              key={color.name}
                              onClick={() => setSelectedColor(color.name)}
                              className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${selectedColor === color.name ? 'border-orange-500 scale-110 shadow-lg' : 'border-transparent'}`}
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            >
                              {selectedColor === color.name && (
                                <Check size={16} className={color.hex === '#ffffff' || color.hex === '#faf0e6' ? 'text-black' : 'text-white'} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {product.variants.sizes && (
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Size: <span className="text-gray-900">{selectedSize}</span></label>
                        <div className="flex flex-wrap gap-3">
                          {product.variants.sizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`px-5 py-2 rounded-xl text-sm font-black transition-all border-2 ${selectedSize === size ? 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-100' : 'border-gray-100 text-gray-600 hover:border-orange-200'}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Separator */}
                <div className="h-px bg-gray-50"></div>

                {/* Purchase Controls */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="flex flex-col space-y-3">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quantity</label>
                      <div className="flex items-center border-2 border-gray-100 rounded-2xl overflow-hidden w-fit shadow-sm">
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="p-3 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={18} />
                        </button>
                        <div className="w-16 flex justify-center items-center bg-white">
                          <span className="font-bold text-lg">{quantity}</span>
                        </div>
                        <button 
                          onClick={() => setQuantity(quantity + 1)}
                          className="p-3 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="flex-grow flex flex-col space-y-3">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</label>
                      <p className="text-xl font-bold text-gray-900 leading-none py-2">RWF {(product.price * quantity).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button 
                      onClick={handleAddToCart}
                      className={`flex-grow py-5 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all shadow-lg active:scale-95 group ${isAdded ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200'}`}
                    >
                      {isAdded ? (
                        <Check size={20} className="animate-in zoom-in" />
                      ) : (
                        <ShoppingBag size={20} className="group-hover:rotate-12 transition-transform" />
                      )}
                      <span className="text-lg">{isAdded ? 'Added to Cart' : 'Add to Cart'}</span>
                    </button>
                    <button
                      onClick={handleToggleWishlist}
                      className={`p-5 border-2 rounded-2xl transition-all group active:scale-95 shadow-sm ${
                        isWishlisted
                          ? 'border-red-100 bg-red-50 text-red-500'
                          : 'border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100'
                      }`}
                    >
                      <Heart size={20} className={isWishlisted ? 'fill-red-500' : 'group-hover:fill-red-500'} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50/50 p-4 border-t border-orange-100 flex items-center justify-center space-x-2">
                <Zap size={14} className="text-orange-500" />
                <span className="text-xs font-bold text-orange-700">Secure checkout with live pricing and seller stock validation.</span>
              </div>
            </div>

            {/* AI Assistant Insight */}
            <div className="group relative">
               <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
               <div className="relative mb-10 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-black rounded-xl text-white shadow-lg">
                         <Sparkles size={18} />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">AI Recommendation</h4>
                    </div>
                    <button 
                      onClick={generateAIDescription}
                      disabled={isGenerating}
                      className="text-[10px] font-black tracking-widest text-orange-500 hover:text-orange-600 uppercase transition-colors disabled:opacity-50"
                    >
                      {isGenerating ? 'Synthesizing...' : 'Summarize details'}
                    </button>
                 </div>
                 <div className="min-h-[60px] flex items-center">
                    <p className="text-sm text-gray-600 leading-relaxed italic">
                      {aiDescription || "Get a fast, AI-generated overview of why this item is perfect for you. Our assistant analyzes features and local feedback."}
                    </p>
                 </div>
               </div>
            </div>

            {/* Micro-Trust Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
              <div className="flex items-center space-x-3 group">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Truck size={18} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Shipping</span>
                  <span className="text-xs font-bold text-gray-900">Nationwide</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><ShieldCheck size={18} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Guarantee</span>
                  <span className="text-xs font-bold text-gray-900">Verified Quality</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all"><RotateCcw size={18} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Returns</span>
                  <span className="text-xs font-bold text-gray-900">7-Day Policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-20">
          <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar scroll-smooth space-x-8 md:space-x-12">
            {[
              { id: 'description', name: 'Description', icon: <ChevronRight size={16} /> },
              { id: 'specifications', name: 'Specifications', icon: <CheckCircle2 size={16} /> },
              { id: 'reviews', name: 'User Reviews', icon: <MessageSquare size={16} /> },
              { id: 'shipping', name: 'Delivery Info', icon: <Truck size={16} /> }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {tab.name}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-t-full shadow-[0_-2px_6px_rgba(249,115,22,0.4)]" />}
              </button>
            ))}
          </div>
          
          <div className="py-10">
            {activeTab === 'description' && (
              <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="prose prose-orange">
                    <h3 className="text-2xl font-bold mb-4 text-gray-900">Description</h3>
                    <p className="text-gray-600 leading-relaxed text-lg mb-6">
                      {product.description || 'No detailed product description has been added yet.'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                    <h3 className="text-xl font-bold mb-6 text-gray-900">Key Features</h3>
                    <ul className="space-y-4">
                      {[
                        "Direct from authorized local distributors",
                        "Eco-friendly sustainable packaging",
                        "Fully compatible with Rwandan utility standards",
                        "Nationwide warranty support included"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start space-x-3 text-gray-600">
                          <CheckCircle2 size={18} className="text-orange-500 mt-1 flex-shrink-0" />
                          <span className="text-sm font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="max-w-4xl bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Specifications</h3>
                  <div className="space-y-4">
                    {specificationItems.map((item) => (
                      <div
                        key={`${item.label}-${item.value}`}
                        className="flex items-start gap-3 text-gray-700 border-b border-gray-50 pb-4 last:border-b-0 last:pb-0"
                      >
                        <CheckCircle2 size={18} className="text-orange-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                          <p className="mt-1 text-sm md:text-base font-medium leading-relaxed text-gray-900">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Customer Feedback</h3>
                    <p className="text-gray-500">Reviews stored from real buyer accounts on this platform.</p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Write a Review</h4>
                      <p className="text-sm text-gray-500">Only verified buyers of this product can submit a review.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() => setReviewRating(value)}
                          className="text-yellow-500 transition-transform hover:scale-110"
                          aria-label={`Rate ${value} stars`}
                        >
                          <Star size={20} fill={value <= reviewRating ? 'currentColor' : 'none'} className={value <= reviewRating ? '' : 'text-gray-300'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your real experience with this product..."
                    rows={4}
                    className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-orange-500"
                  />
                  {reviewMessage && <p className="text-sm font-semibold text-emerald-600">{reviewMessage}</p>}
                  {reviewError && <p className="text-sm font-semibold text-red-600">{reviewError}</p>}
                  <button
                    onClick={handleSubmitReview}
                    disabled={reviewSubmitting || reviewComment.trim().length < 8}
                    className="bg-black text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-orange-500 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>

                {reviewsLoading ? (
                  <div className="p-10 text-center text-gray-500">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-100 rounded-3xl p-10 text-center text-gray-500">
                    No verified reviews yet for this product.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-8">
                    {reviews.map((review) => (
                    <div key={review.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-black text-lg">
                            {review.userName[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{review.userName}</h4>
                            <div className="flex text-yellow-500 mt-1">
                              {[...Array(5)].map((_, j) => <Star key={j} size={14} fill={j < review.rating ? 'currentColor' : 'none'} className={j < review.rating ? '' : 'text-gray-200'} />)}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatReviewDate(review.createdAt)}</span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed flex-grow italic">"{review.comment}"</p>
                      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center space-x-2">
                        <div className="w-4 h-4 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={10} />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">{review.verifiedPurchase ? 'Verified Purchase' : 'Community Review'}</span>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="grid md:grid-cols-3 gap-8 animate-in fade-in duration-500">
                <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100 flex flex-col space-y-4">
                  <div className="p-3 bg-blue-600 text-white rounded-2xl w-fit shadow-lg shadow-blue-200">
                    <Truck size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Doorstep Delivery</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Estimated dispatch depends on seller confirmation and stock availability.<br />
                    In-stock items are prioritized for same-day or next-day handling.
                  </p>
                </div>
                <div className="bg-orange-50/50 p-8 rounded-3xl border border-orange-100 flex flex-col space-y-4">
                  <div className="p-3 bg-orange-500 text-white rounded-2xl w-fit shadow-lg shadow-orange-200">
                    <ShoppingBag size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Hub Pickup</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Pickup timing is shared after checkout confirmation and depends on the assigned seller or hub.
                  </p>
                </div>
                <div className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100 flex flex-col space-y-4">
                  <div className="p-3 bg-emerald-600 text-white rounded-2xl w-fit shadow-lg shadow-emerald-200">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Order Fulfillment</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Seller: {product.merchantName || 'E-Malla Merchant'}<br />
                    Stock status: {product.stock > 0 ? `${product.stock} units available` : 'Currently out of stock'}<br />
                    Payment options are confirmed during checkout.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Carousel */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 border-t border-gray-50 pt-16">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">You May Also Like</h2>
                <p className="text-gray-500 text-sm font-medium">Explore more items in the {CATEGORIES.find(c => c.id === product.category)?.name} category</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => scrollCarousel('left')}
                    className="p-3 rounded-full border border-gray-200 text-gray-400 hover:bg-black hover:text-white hover:border-black transition-all shadow-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => scrollCarousel('right')}
                    className="p-3 rounded-full border border-gray-200 text-gray-400 hover:bg-black hover:text-white hover:border-black transition-all shadow-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>
                <Link to={`/shop?category=${product.category}`} className="text-orange-500 font-black text-xs uppercase tracking-widest flex items-center hover:underline group">
                  Browse All <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            
            <div 
              ref={carouselRef}
              className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-8 pb-8 -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              {relatedProducts.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="min-w-[280px] sm:min-w-[320px] snap-start bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group cursor-pointer overflow-hidden flex flex-col"
                >
                  <div className="h-64 relative overflow-hidden bg-gray-50 p-4">
                    <div className="w-full h-full rounded-[32px] overflow-hidden">
                      <img 
                        src={getProductPrimaryImage(p)} 
                        alt={p.name} 
                        onError={(event) => handleProductImageError(event, p.category)}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    <div className="absolute top-8 right-8 p-3 bg-white/90 backdrop-blur-md rounded-2xl text-orange-500 shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <ShoppingBag size={20} />
                    </div>
                  </div>
                  <div className="p-8 flex-grow flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-yellow-400 text-xs font-black">
                        <Star size={12} fill="currentColor" className="mr-1" />
                        <span className="text-gray-600">{p.rating}</span>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {p.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight group-hover:text-orange-500 transition-colors mb-6 h-10">
                      {p.name}
                    </h4>
                    <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-gray-900 font-black text-lg">RWF {p.price.toLocaleString()}</span>
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="md:hidden fixed inset-x-0 bottom-[calc(5.3rem+env(safe-area-inset-bottom,0px))] z-[65] px-4">
        <div className="mx-auto max-w-lg rounded-[28px] border border-gray-200 bg-white/96 p-3 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-4 px-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</p>
              <p className="text-lg font-black text-gray-900">RWF {(product.price * quantity).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</p>
              <p className="text-sm font-black text-emerald-600">{product.stock > 0 ? 'In Stock' : 'Unavailable'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAddToCart}
              className={`rounded-2xl px-4 py-4 text-sm font-black transition-all active:scale-[0.98] ${
                isAdded ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white'
              }`}
            >
              {isAdded ? 'Added' : 'Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              className="rounded-2xl bg-orange-500 px-4 py-4 text-sm font-black text-white shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add a Zap icon for the point summary
const Zap = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

export default ProductDetails;
