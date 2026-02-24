import React from 'react';
// Corrected import from react-router-dom to resolve named export issues
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, Info } from 'lucide-react';

const Cart: React.FC = () => {
  // Mock Cart Data
  const cartItems = [
    { id: 'p1', name: 'Smart Watch Series 7', price: 120000, qty: 1, image: 'https://picsum.photos/id/175/400/400' },
    { id: 'p2', name: 'Wireless Noise Cancelling Headphones', price: 85000, qty: 1, image: 'https://picsum.photos/id/211/400/400' },
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-black text-gray-900 mb-12 flex items-center">
          <ShoppingBag className="mr-4 text-orange-500" size={36} />
          My Shopping Bag
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8 hover:shadow-lg transition-all group">
                <div className="w-32 h-32 bg-gray-50 rounded-3xl overflow-hidden flex-shrink-0 border border-gray-50 group-hover:scale-105 transition-transform">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-grow text-center sm:text-left">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-orange-500 font-black text-lg">RWF {item.price.toLocaleString()}</p>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
                    <button className="p-2 hover:bg-white hover:text-orange-500 rounded-xl transition-all"><Minus size={16} /></button>
                    <span className="px-4 font-bold text-gray-900">{item.qty}</span>
                    <button className="p-2 hover:bg-white hover:text-orange-500 rounded-xl transition-all"><Plus size={16} /></button>
                  </div>
                  
                  <button className="text-gray-300 hover:text-red-500 transition-colors p-2">
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
            <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 sticky top-32">
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

              <div className="pt-8 flex justify-between items-center mb-10">
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