
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Lock,
  Loader2
} from 'lucide-react';
import { PaymentMethod } from '../types';
import { PaymentService } from '../services/paymentService';
import { OrderService } from '../services/orderService';
import PaymentMethodSelector from '../components/Payment/PaymentMethodSelector';
import { useAuth } from '../auth/AuthContext';

const DISTRICTS = [
  'Nyarugenge', 'Gasabo', 'Kicukiro', 
  'Musanze', 'Rubavu', 'Huye', 'Kayonza', 
  'Rwamagana', 'Nyagatare', 'Rusizi', 'Karongi','Nyamasheke', 'Rutsiro', 'Burera', 'Gicumbi',
];

interface CheckoutProps {
  cartItems: Array<{
    productId: string;
    quantity: number;
    subtotal: number;
    product: {
      name: string;
      price: number;
      image: string;
      merchantId?: string;
      merchantName?: string;
    };
  }>;
  subtotal: number;
  clearCart: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, subtotal, clearCart }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '0780000000',
    district: 'Gasabo',
    sector: 'Kimironko',
    street: 'KG 11 St, House 4',
    paymentMethod: PaymentMethod.GTBANK_MOMO_PAY,
    notes: ''
  });

  useEffect(() => {
    if (user?.name || user?.email) {
      setFormData((current) => ({
        ...current,
        fullName: user?.name || current.fullName,
        email: user?.email || current.email
      }));
    }
  }, [user]);

  const deliveryFee = subtotal > 50000 ? 0 : 3500;
  const cartTotal = subtotal;
  const finalTotal = cartTotal + deliveryFee;
  const merchantIds = Array.from(new Set(cartItems.map((item) => item.product.merchantId).filter(Boolean)));
  const hasMixedMerchantCart = merchantIds.length > 1;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      navigate('/shop');
      return;
    }

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.street.trim()) {
      setErrorMessage('Please complete your name, email, phone, and address before continuing.');
      return;
    }

    if (hasMixedMerchantCart) {
      setErrorMessage('Your cart contains products from different sellers. Please complete checkout one seller at a time.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    let createdOrderId: string | null = null;
    try {
      const primaryMerchant = cartItems[0]?.product;
      const checkoutResult = await OrderService.createCheckoutOrder({
        customerId: user?.id || '',
        customerName: formData.fullName,
        customerEmail: formData.email,
        merchantId: primaryMerchant?.merchantId,
        merchantName: primaryMerchant?.merchantName,
        items: cartItems.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.subtotal
        })),
        totalAmount: finalTotal,
        deliveryFee,
        address: `${formData.street}, ${formData.sector}, ${formData.district}`,
        phone: formData.phone,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      });
      const order = checkoutResult.order;
      createdOrderId = order.id;

      // Keep the legacy initiation call as a safe deployment-order fallback.
      const paymentInit = checkoutResult.paymentInit || await PaymentService.initializePayment({
          orderId: order.id,
          amount: finalTotal,
          customerEmail: formData.email,
          customerName: formData.fullName,
          method: formData.paymentMethod
        });

      clearCart();
      if (formData.paymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
        navigate(`/payment/success?order_id=${order.id}&mode=cod`);
        return;
      }

      const emailParam = encodeURIComponent(formData.email);
      navigate(`/payment/processing?tx_ref=${String(paymentInit.tx_ref)}&order_id=${order.id}&email=${emailParam}&amount=${finalTotal}`);

    } catch (err) {
      if (createdOrderId) {
        await OrderService.cancelOrder(createdOrderId, {
          email: formData.email,
          phone: formData.phone
        }).catch(() => undefined);
      }
      setErrorMessage(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10 md:p-16">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">No items to check out</h1>
            <p className="text-gray-500 mb-8">Add products to your bag before continuing to payment.</p>
            <Link to="/shop" className="inline-flex bg-orange-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-orange-600 transition-all">
              Return to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10">
          <Link to="/cart" className="flex items-center text-gray-500 hover:text-orange-500 font-bold transition-colors">
            <ArrowLeft size={20} className="mr-2" /> Back to Bag
          </Link>
          <div className="flex items-center space-x-2">
             <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
             <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full bg-orange-500 transition-all duration-500 ${step === 2 ? 'w-full' : 'w-0'}`}></div>
             </div>
             <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
              {step === 1 ? (
                <div className="p-6 md:p-12 animate-in fade-in slide-in-from-left duration-500">
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-8">Delivery Information</h2>
                  {hasMixedMerchantCart ? (
                    <div className="mb-6 rounded-3xl border border-red-100 bg-red-50 px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Separate Seller Checkout</p>
                      <p className="mt-2 text-sm font-bold text-gray-900">
                        This cart combines products from different sellers. Please keep one seller per checkout so fulfillment and rider assignment stay accurate.
                      </p>
                    </div>
                  ) : null}
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Recipient Name</label>
                        <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-gray-900 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-gray-900 transition-all" placeholder="you@example.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Contact Phone</label>
                        <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-gray-900 transition-all" placeholder="078..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">District</label>
                        <select value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-gray-900 transition-all appearance-none">
                          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Address Detail (Sector, Street, House)</label>
                        <input type="text" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-gray-900 transition-all" placeholder="Kimironko, KG 123 St, House 4" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Delivery Notes (Optional)</label>
                       <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold text-gray-900 transition-all resize-none" placeholder="Gate color, floor number, etc." rows={2}></textarea>
                    </div>

                    <button onClick={() => setStep(2)} className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center space-x-3 hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 active:scale-95">
                      <span>Choose Payment Method</span>
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 md:p-12 animate-in fade-in slide-in-from-right duration-500">
                  <div className="mb-10 flex items-start sm:items-center justify-between gap-4">
                    <div>
                      <button onClick={() => setStep(1)} className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center hover:underline mb-2">
                        <ArrowLeft size={14} className="mr-1" /> Delivery Info
                      </button>
                      <h2 className="text-2xl md:text-3xl font-black text-gray-900">Secure Payment</h2>
                    </div>
                    <div className="hidden sm:block p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                      <ShieldCheck size={28} />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
                      {errorMessage}
                    </div>
                  )}

                  <PaymentMethodSelector 
                    selected={formData.paymentMethod} 
                    onSelect={(method) => setFormData({...formData, paymentMethod: method})} 
                  />
                  
                  <button 
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="w-full mt-10 bg-black text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center space-x-3 hover:bg-orange-600 transition-all shadow-xl disabled:opacity-50 active:scale-95 group"
                  >
                    {isProcessing ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <>
                        <Lock size={20} className="group-hover:scale-110 transition-transform" />
                        <span>
                          {formData.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
                            ? `Confirm Order RWF ${finalTotal.toLocaleString()}`
                            : `Confirm & Pay RWF ${finalTotal.toLocaleString()}`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 p-6 md:p-8 lg:sticky lg:top-32">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-8">Order Summary</h3>
              <div className="space-y-6">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex items-start justify-between gap-4">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                          <img src={item.product.image} className="w-full h-full object-cover" alt={item.product.name} loading="lazy" decoding="async" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 break-words">{item.product.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-gray-900 text-right shrink-0">RWF {item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-gray-50 space-y-3">
                   <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Subtotal</span>
                      <span className="text-gray-900 font-bold">RWF {cartTotal.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Delivery</span>
                      <span className="text-emerald-600 font-bold">RWF {deliveryFee.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className="text-lg font-black text-gray-900">Total</span>
                      <span className="text-2xl font-black text-orange-600">RWF {finalTotal.toLocaleString()}</span>
                   </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl flex items-center justify-center space-x-2 border border-emerald-100">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                   <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Safe Escrow Activated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
