import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, Info } from 'lucide-react';

interface CartProps {
  cartItems: Array<{
    productId: string;
    quantity: number;
    subtotal: number;
    selectedSize?: string | null;
    selectedColor?: string | null;
    product: {
      name: string;
      price: number;
      image: string;
    };
  }>;
  subtotal: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

const Cart: React.FC<CartProps> = ({ cartItems, subtotal, onUpdateQuantity, onRemoveItem }) => {
  if (cartItems.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10 md:p-16">
            <ShoppingBag className="mx-auto text-orange-500 mb-6" size={48} />
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Your bag is empty</h1>
            <p className="text-gray-500 mb-8">Browse the marketplace and add products to start your order.</p>
            <Link to="/shop" className="inline-flex items-center bg-orange-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-orange-600 transition-all">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-10 md:mb-12 flex items-center">
          <ShoppingBag className="mr-3 md:mr-4 text-orange-500" size={32} />
          My Shopping Bag
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div key={item.productId} className="bg-white p-5 md:p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8 hover:shadow-lg transition-all group">
                <div className="w-32 h-32 bg-gray-50 rounded-3xl overflow-hidden flex-shrink-0 border border-gray-50 group-hover:scale-105 transition-transform">
                  <img src={item.product.image} alt={item.product.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-grow text-center sm:text-left">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.product.name}</h3>
                  <p className="text-orange-500 font-black text-lg">RWF {item.product.price.toLocaleString()}</p>
                  {(item.selectedColor || item.selectedSize) && (
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">
                      {[item.selectedColor, item.selectedSize].filter(Boolean).join(' / ')}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto">
                  <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
                    <button onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)} className="p-2 hover:bg-white hover:text-orange-500 rounded-xl transition-all"><Minus size={16} /></button>
                    <span className="px-4 font-bold text-gray-900">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)} className="p-2 hover:bg-white hover:text-orange-500 rounded-xl transition-all"><Plus size={16} /></button>
                  </div>
                  
                  <button onClick={() => onRemoveItem(item.productId)} className="text-gray-300 hover:text-red-500 transition-colors p-2">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-8">
              <Link to="/shop" className="text-orange-500 font-bold flex items-center hover:underline">
                <ArrowRight size={18} className="rotate-180 mr-2" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Checkout Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-2xl border border-gray-100 lg:sticky lg:top-32">
              <h3 className="text-2xl font-black text-gray-900 mb-8">Summary</h3>
              
              <div className="space-y-6 pb-8 border-b border-gray-50">
                <div className="flex justify-between text-gray-500">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-black text-gray-900">RWF {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="font-medium">Estimated Shipping</span>
                  <span className="font-bold text-emerald-600">Calculated at Checkout</span>
                </div>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-10">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-3xl font-black text-black">RWF {subtotal.toLocaleString()}</span>
              </div>

              <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 mb-8 flex items-start space-x-3">
                <Info className="text-orange-500 flex-shrink-0" size={18} />
                <p className="text-[10px] text-orange-800 font-bold uppercase leading-tight">
                  Free shipping on orders over RWF 50,000 within Kigali City!
                </p>
              </div>

              <Link 
                to="/checkout" 
                className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center space-x-3 hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 active:scale-95 group"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Cart;
