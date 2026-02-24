
import React from 'react';
import { Truck, MapPin, Clock, ShieldCheck, Globe, Info } from 'lucide-react';

const ShippingPolicy: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Header Section */}
      <section className="bg-orange-500 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">Shipping Policy</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Reliable, nationwide logistics designed to bring the marketplace to your doorstep across the Land of a Thousand Hills.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
          <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Swift Delivery</h3>
            <p className="text-gray-600 text-sm">Most orders in Kigali are delivered within 6 hours of confirmation.</p>
          </div>
          <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Globe size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Nationwide Reach</h3>
            <p className="text-gray-600 text-sm">We cover all 30 districts, ensuring no village is left behind.</p>
          </div>
          <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Safe Handling</h3>
            <p className="text-gray-600 text-sm">Every package is sealed and handled with the utmost care.</p>
          </div>
        </div>

        <div className="space-y-16">
          {/* Section 1: Timelines */}
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
                <Truck className="mr-3 text-orange-500" /> Delivery Timelines
              </h2>
              <p className="text-gray-500 text-sm">Expected arrival times based on your delivery location.</p>
            </div>
            <div className="md:w-2/3 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">Kigali City</h4>
                    <p className="text-sm text-gray-500">Same-day delivery (Standard)</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">2 - 6 Hours</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">Secondary Cities</h4>
                    <p className="text-sm text-gray-500">Musanze, Huye, Rubavu, Rwamagana</p>
                  </div>
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">24 Hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">Other Provinces</h4>
                    <p className="text-sm text-gray-500">Rural and remote locations</p>
                  </div>
                  <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">2 - 3 Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Methods */}
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
                <MapPin className="mr-3 text-orange-500" /> Delivery Methods
              </h2>
              <p className="text-gray-500 text-sm">Choose how you want to receive your order.</p>
            </div>
            <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 border border-gray-100 rounded-3xl bg-gray-50/50">
                <h4 className="font-bold text-gray-900 mb-2">Doorstep Delivery</h4>
                <p className="text-sm text-gray-600">Our riders deliver directly to your home or office location provided during checkout.</p>
              </div>
              <div className="p-6 border border-gray-100 rounded-3xl bg-gray-50/50">
                <h4 className="font-bold text-gray-900 mb-2">E-Malla Hub Pickup</h4>
                <p className="text-sm text-gray-600">Pick up your order at any of our 25+ verified pickup points across Rwanda for a lower fee.</p>
              </div>
            </div>
          </div>

          {/* Section 3: Shipping Rates */}
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
                <Info className="mr-3 text-orange-500" /> Shipping Rates
              </h2>
              <p className="text-gray-500 text-sm">Transparent pricing for all deliveries.</p>
            </div>
            <div className="md:w-2/3 prose prose-orange max-w-none text-gray-600">
              <p>
                Shipping costs are calculated at checkout based on the weight of your order and the distance from the merchant's warehouse to your location.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-4 text-sm">
                <li><strong>Free Delivery:</strong> Available for orders over RWF 50,000 within Kigali.</li>
                <li><strong>Base Rate (Kigali):</strong> Starts at RWF 1,500 for lightweight items.</li>
                <li><strong>Upcountry Standard:</strong> Starts at RWF 3,000 depending on location.</li>
                <li><strong>Bulk/Heavy Items:</strong> Custom rates apply for furniture or heavy electronics.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tracking Call to Action */}
        <div className="mt-20 bg-gray-900 rounded-3xl p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Track Your Order in Real-Time</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Stay updated with SMS notifications and live tracking for every movement of your package from our warehouse to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-600 transition-all">
              Go to My Orders
            </button>
            <button className="bg-white/10 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all border border-white/20">
              Contact Support
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ShippingPolicy;
