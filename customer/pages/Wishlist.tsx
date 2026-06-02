import React, { useEffect, useState } from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerService } from '../../services/customerService';
import { Product } from '../../types';
import { getProductPrimaryImage, handleProductImageError } from '../../lib/productImages';

interface WishlistProps {
  onAddToCart: (item: { productId: string; quantity: number }) => void;
}

const Wishlist: React.FC<WishlistProps> = ({ onAddToCart }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const loadWishlist = async () => {
      setLoading(true);
      try {
        const nextItems = await CustomerService.getWishlist();
        setItems(nextItems);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, []);

  const removeItem = async (productId: string) => {
    setBusyId(productId);
    try {
      await CustomerService.toggleWishlist(productId, true);
      setItems((current) => current.filter((item) => item.id !== productId));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="rounded-[36px] border border-gray-100 bg-white p-10 text-center shadow-sm">
            <Heart className="mx-auto mb-5 text-red-400" size={42} />
            <h1 className="text-3xl font-black text-gray-900">Wishlist</h1>
            <p className="mt-3 text-sm text-gray-500">Products you save will appear here for quick shopping later.</p>
            <Link to="/shop" className="mt-8 inline-flex items-center rounded-2xl bg-orange-500 px-8 py-4 text-sm font-black text-white shadow-xl shadow-orange-200 transition-all hover:bg-orange-600">
              Browse Products <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 pb-28">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-red-500">❤️ Wishlist</p>
            <h1 className="mt-2 text-3xl font-black text-gray-900">Saved Products</h1>
            <p className="mt-2 text-sm text-gray-500">Keep favorites ready for your next order.</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-gray-900 shadow-sm">
            {items.length} item{items.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-[34px] border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-xl">
              <button onClick={() => navigate(`/product/${item.id}`)} className="block w-full text-left">
                <img
                  src={getProductPrimaryImage(item)}
                  onError={(event) => handleProductImageError(event, item.category)}
                  loading="lazy"
                  decoding="async"
                  alt={item.name}
                  className="h-56 w-full rounded-[28px] object-cover"
                />
                <div className="mt-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.category}</p>
                  <h2 className="mt-2 line-clamp-2 text-lg font-black text-gray-900">{item.name}</h2>
                  <p className="mt-3 text-xl font-black text-orange-600">RWF {item.price.toLocaleString()}</p>
                </div>
              </button>

              <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                <button
                  onClick={() => onAddToCart({ productId: item.id, quantity: 1 })}
                  className="flex items-center justify-center rounded-2xl bg-gray-900 px-4 py-4 text-sm font-black text-white transition-all hover:bg-orange-600"
                >
                  <ShoppingBag size={16} className="mr-2" />
                  Add to Cart
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={busyId === item.id}
                  className="rounded-2xl border border-red-100 px-4 py-4 text-red-500 transition-all hover:bg-red-50 disabled:opacity-60"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
