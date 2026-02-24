
import React, { useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Phone, 
  ShieldCheck, 
  ArrowLeft,
  Navigation,
  Info
} from 'lucide-react';

interface TrackingStep {
  status: string;
  location: string;
  time: string;
  completed: boolean;
  current: boolean;
}

const OrderTracking: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();

  // Determine context (Buyer vs Seller)
  const isSellerView = location.pathname.includes('/seller');
  const backPath = isSellerView ? '/seller/orders' : '/buyer/orders';

  // Mock tracking data
  const trackingData: TrackingStep[] = [
    { status: 'Order Placed', location: 'Kigali Marketplace', time: 'May 24, 10:30 AM', completed: true, current: false },
    { status: 'Processed & Packed', location: 'Inzira Warehouse, Kicukiro', time: 'May 24, 02:15 PM', completed: true, current: false },
    { status: 'Picked Up by Courier', location: 'Kicukiro Hub', time: 'May 24, 04:00 PM', completed: true, current: false },
    { status: 'In Transit', location: 'Near Nyabugogo, Kigali', time: 'May 24, 05:45 PM', completed: true, current: true },
    { status: 'Out for Delivery', location: 'Customer District', time: 'Pending', completed: false, current: false },
    { status: 'Delivered', location: 'Doorstep', time: 'Pending', completed: false, current: false },
  ];

  const currentStep = useMemo(() => trackingData.find(s => s.current), [trackingData]);

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to={backPath} className="flex items-center text-gray-500 hover:text-orange-500 font-bold transition-colors mb-2 text-sm">
            <ArrowLeft size={16} className="mr-2" />
            Back to Orders
          </Link>
          <div className="flex items-center space-x-3">
             <h1 className="text-3xl font-black text-gray-900">Track Order #{id || '892'}</h1>
             {isSellerView && <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Merchant View</span>}
          </div>
        </div>
        <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
           <span className="text-orange-600 font-bold text-xs uppercase tracking-widest">In Transit</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline & Status */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 md:p-12">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-200">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-gray-900">{isSellerView ? 'Outgoing Shipment Tracking' : 'On its way to you'}</h3>
                  <p className="text-gray-400 text-sm">Estimated arrival: <span className="text-orange-600 font-bold">Today, 7:00 PM</span></p>
                </div>
              </div>
            </div>

            {/* Timeline Vertical */}
            <div className="relative pl-8 space-y-12">
              <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-100"></div>
              
              {trackingData.map((step, idx) => (
                <div key={idx} className="relative group">
                  {/* Circle Marker */}
                  <div className={`absolute -left-8 w-8 h-8 rounded-full border-4 border-white shadow-md flex items-center justify-center transition-all z-10 ${
                    step.completed ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.completed ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>

                  {/* Pulsing effect for current step */}
                  {step.current && (
                    <div className="absolute -left-8 w-8 h-8 rounded-full bg-orange-500 animate-ping opacity-20 z-0"></div>
                  )}

                  <div className={`${step.current ? 'bg-orange-50 p-6 rounded-3xl border border-orange-100' : ''}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <h4 className={`font-bold text-lg ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.status}
                        {step.current && <span className="ml-3 text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full uppercase">Live</span>}
                      </h4>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{step.time}</span>
                    </div>
                    <p className={`text-sm mt-1 flex items-center ${step.completed ? 'text-gray-500' : 'text-gray-300'}`}>
                      <MapPin size={12} className="mr-1" /> {step.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipment Details Card */}
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8">
            <h4 className="text-xl font-black text-gray-900 mb-6">Shipment Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Package className="text-gray-400" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Weight</p>
                    <p className="text-sm font-bold text-gray-900">1.2 kg</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="text-gray-400" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Protection</p>
                    <p className="text-sm font-bold text-emerald-600">Standard Warranty Applied</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Navigation className="text-gray-400" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Carrier</p>
                    <p className="text-sm font-bold text-gray-900">E-Malla Express Logistics</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Info className="text-gray-400" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Instructions</p>
                    <p className="text-sm font-bold text-gray-900 line-clamp-1">Leave with security if not home</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Map/Courier Widget */}
          <div className="bg-gray-900 rounded-[40px] overflow-hidden shadow-xl text-white">
            <div className="h-48 bg-gray-800 relative">
              {/* Mock Map Background */}
              <div className="absolute inset-0 opacity-40 imigongo-bg"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="relative">
                   <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                     <Truck size={24} />
                   </div>
                   <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/40 rounded-full blur-sm"></div>
                 </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Live Position</span>
                <span className="text-xs font-bold">Kigali - KN 5 Rd</span>
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-14 h-14 bg-gray-800 rounded-2xl overflow-hidden border border-white/10">
                  <img src="https://picsum.photos/id/64/100/100" className="w-full h-full object-cover" alt="Courier" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Mugisha Eric</h4>
                  <p className="text-gray-400 text-xs">Certified Courier Rider</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <a href="tel:+250788000000" className="bg-white/10 hover:bg-white/20 py-4 rounded-2xl flex items-center justify-center transition-all border border-white/5">
                  <Phone size={20} className="mr-2 text-orange-500" />
                  <span className="font-bold text-sm">Call</span>
                </a>
                <button className="bg-orange-500 hover:bg-orange-600 py-4 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-orange-500/20">
                  <Clock size={20} className="mr-2" />
                  <span className="font-bold text-sm">ETA</span>
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Window Reminder */}
          <div className="bg-yellow-400 rounded-[40px] p-8 text-black relative overflow-hidden group">
             <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <Clock size={120} />
             </div>
             <h4 className="font-black text-xl mb-4">{isSellerView ? 'Dispatch Ready?' : 'Stay Ready!'}</h4>
             <p className="text-sm font-medium leading-relaxed opacity-80">
               {isSellerView 
                ? 'Your courier is approaching. Ensure the package is sealed and the invoice is attached for a smooth hand-off.'
                : 'Your rider is expected to arrive within the next 45 minutes. Please ensure your mobile phone (+250 788...) is reachable.'}
             </p>
          </div>
          
          {/* Help Center Shortcut */}
          <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-2">Need help?</h4>
            <p className="text-xs text-gray-500 mb-6">Is there an issue with your tracking or delivery status?</p>
            <Link to="/contact" className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center hover:bg-orange-500 transition-all">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
