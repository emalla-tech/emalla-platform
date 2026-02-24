
import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, Home, Briefcase, CheckCircle2 } from 'lucide-react';
import { CustomerService } from '../../services/customerService';

const AddressBook: React.FC = () => {
  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    CustomerService.getAddresses().then(setAddresses);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Address Book</h1>
          <p className="text-gray-500 text-sm">Manage where we deliver your orders across Rwanda.</p>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center shadow-lg shadow-orange-200 transition-all">
          <Plus size={18} className="mr-2" /> Add New Address
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {addresses.map((addr) => (
          <div key={addr.id} className={`bg-white rounded-[40px] p-8 border-2 transition-all relative group overflow-hidden ${addr.isDefault ? 'border-orange-500 shadow-xl' : 'border-gray-100 hover:border-orange-200 shadow-sm'}`}>
            {addr.isDefault && (
               <div className="absolute top-0 right-0 bg-orange-500 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                 Primary
               </div>
            )}
            
            <div className="flex items-start space-x-6 mb-8">
               <div className={`p-4 rounded-2xl ${addr.isDefault ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-400'}`}>
                  {addr.name === 'Home' ? <Home size={28} /> : <Briefcase size={28} />}
               </div>
               <div>
                  <h3 className="text-xl font-black text-gray-900">{addr.name}</h3>
                  <div className="mt-4 space-y-1">
                    <p className="text-sm font-bold text-gray-700">{addr.street}</p>
                    <p className="text-sm font-medium text-gray-500">{addr.sector}, {addr.district} District</p>
                    <p className="text-sm font-medium text-gray-500">Rwanda</p>
                  </div>
               </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-gray-50">
               <div className="flex space-x-4">
                  <button className="text-gray-400 hover:text-orange-500 transition-colors flex items-center text-xs font-bold">
                    <Edit2 size={14} className="mr-1.5" /> Edit
                  </button>
                  {!addr.isDefault && (
                    <button className="text-gray-400 hover:text-red-500 transition-colors flex items-center text-xs font-bold">
                      <Trash2 size={14} className="mr-1.5" /> Remove
                    </button>
                  )}
               </div>
               {!addr.isDefault && (
                 <button className="text-xs font-black text-orange-500 uppercase tracking-widest hover:underline">
                    Set as Default
                 </button>
               )}
            </div>
          </div>
        ))}

        {/* Empty State / Add Card */}
        <div className="border-4 border-dashed border-gray-100 rounded-[40px] p-8 flex flex-col items-center justify-center text-center group hover:border-orange-200 transition-all cursor-pointer">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-orange-50 group-hover:text-orange-500 transition-all mb-4">
             <Plus size={32} />
           </div>
           <p className="font-black text-gray-400 uppercase tracking-widest text-xs group-hover:text-orange-500 transition-all">Add Shipping Location</p>
        </div>
      </div>

      {/* Safety Info */}
      <div className="bg-gray-900 p-8 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-center space-x-6">
            <div className="p-4 bg-white/10 rounded-2xl text-emerald-400">
               <CheckCircle2 size={32} />
            </div>
            <div>
               <h4 className="font-black text-lg">Verified Addresses</h4>
               <p className="text-gray-400 text-sm">Providing accurate address details ensures 100% successful delivery by our riders.</p>
            </div>
         </div>
         <button className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-black text-sm whitespace-nowrap hover:bg-orange-500 hover:text-white transition-all">
           See Delivery Areas
         </button>
      </div>
    </div>
  );
};

export default AddressBook;
