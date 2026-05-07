
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Edit2, Trash2, Home, Briefcase, CheckCircle2, ShieldCheck, RefreshCw, LogOut } from 'lucide-react';
import { CustomerService } from '../../services/customerService';
import { authService } from '../../services/authService';
import { useAuth } from '../../auth/AuthContext';
import { Address } from '../../types';

const AddressBook: React.FC = () => {
  const navigate = useNavigate();
  const { logoutAllDevices } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', district: '', sector: '', street: '' });
  const [sessions, setSessions] = useState<Array<{
    id: string;
    createdAt: string;
    lastSeenAt: string;
    isCurrent: boolean;
    userAgent?: string;
  }>>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  useEffect(() => {
    CustomerService.getAddresses().then(setAddresses);
    void refreshSessions();
  }, []);

  const refreshAddresses = async () => {
    const updated = await CustomerService.getAddresses();
    setAddresses(updated);
  };

  const handleAddAddress = async () => {
    if (!form.name || !form.district || !form.sector || !form.street) return;
    if (editingAddressId) {
      await CustomerService.updateAddress(editingAddressId, form);
    } else {
      await CustomerService.saveAddress(form);
    }
    setForm({ name: '', district: '', sector: '', street: '' });
    setIsAdding(false);
    setEditingAddressId(null);
    refreshAddresses();
  };

  const handleEditAddress = (address: Address) => {
    setForm({
      name: address.name,
      district: address.district,
      sector: address.sector,
      street: address.street
    });
    setEditingAddressId(address.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAddress = async (addressId: string) => {
    await CustomerService.deleteAddress(addressId);
    refreshAddresses();
  };

  const handleSetDefault = async (addressId: string) => {
    await CustomerService.setDefaultAddress(addressId);
    refreshAddresses();
  };

  const refreshSessions = async () => {
    setLoadingSessions(true);
    try {
      const activeSessions = await authService.getSessions();
      setSessions(activeSessions);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAllDevices();
    } finally {
      setLoggingOutAll(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Address Book</h1>
          <p className="text-gray-500 text-sm">Manage where we deliver your orders across Rwanda.</p>
        </div>
        <button
          onClick={() => {
            if (isAdding) {
              setIsAdding(false);
              setEditingAddressId(null);
              setForm({ name: '', district: '', sector: '', street: '' });
              return;
            }

            setEditingAddressId(null);
            setForm({ name: '', district: '', sector: '', street: '' });
            setIsAdding(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center shadow-lg shadow-orange-200 transition-all"
        >
          <Plus size={18} className="mr-2" /> {isAdding ? 'Close Form' : 'Add New Address'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Label" className="px-5 py-4 rounded-2xl bg-gray-50 font-bold outline-none" />
          <input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="District" className="px-5 py-4 rounded-2xl bg-gray-50 font-bold outline-none" />
          <input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="Sector" className="px-5 py-4 rounded-2xl bg-gray-50 font-bold outline-none" />
          <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="Street / House" className="px-5 py-4 rounded-2xl bg-gray-50 font-bold outline-none md:col-span-2" />
          <button onClick={handleAddAddress} className="bg-black text-white rounded-2xl px-6 py-4 font-black">{editingAddressId ? 'Update Address' : 'Save Address'}</button>
        </div>
      )}

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
                  <button onClick={() => handleEditAddress(addr)} className="text-gray-400 hover:text-orange-500 transition-colors flex items-center text-xs font-bold">
                    <Edit2 size={14} className="mr-1.5" /> Edit
                  </button>
                  {!addr.isDefault && (
                    <button onClick={() => handleDeleteAddress(addr.id)} className="text-gray-400 hover:text-red-500 transition-colors flex items-center text-xs font-bold">
                      <Trash2 size={14} className="mr-1.5" /> Remove
                    </button>
                  )}
               </div>
               {!addr.isDefault && (
                 <button onClick={() => handleSetDefault(addr.id)} className="text-xs font-black text-orange-500 uppercase tracking-widest hover:underline">
                    Set as Default
                 </button>
               )}
            </div>
          </div>
        ))}

        {/* Empty State / Add Card */}
        <div
          onClick={() => setIsAdding(true)}
          className="border-4 border-dashed border-gray-100 rounded-[40px] p-8 flex flex-col items-center justify-center text-center group hover:border-orange-200 transition-all cursor-pointer"
        >
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
         <button
           onClick={() => navigate('/shipping')}
           className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-black text-sm whitespace-nowrap hover:bg-orange-500 hover:text-white transition-all"
         >
           See Delivery Areas
         </button>
      </div>

      <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Account Security</h3>
              <p className="text-sm text-gray-500">Monitor signed-in devices and close all other active sessions when needed.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refreshSessions()}
            disabled={loadingSessions}
            className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest flex items-center justify-center"
          >
            <RefreshCw size={14} className={`mr-2 ${loadingSessions ? 'animate-spin' : ''}`} />
            Refresh Sessions
          </button>
        </div>

        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-gray-900">{session.isCurrent ? 'Current device' : 'Signed-in device'}</p>
                  <p className="text-xs text-gray-500 mt-1">{session.userAgent || 'Active E-Malla session'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${session.isCurrent ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                  {session.isCurrent ? 'Current' : 'Active'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-3 text-[11px] font-bold text-gray-500">
                <p>Signed in: {new Date(session.createdAt).toLocaleString()}</p>
                <p>Last activity: {new Date(session.lastSeenAt).toLocaleString()}</p>
              </div>
            </div>
          ))}

          {!sessions.length ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm font-bold text-gray-400">
              No active sessions were found for this buyer account.
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void handleLogoutAllDevices()}
          disabled={loggingOutAll}
          className="w-full md:w-auto px-6 py-4 rounded-2xl bg-red-50 text-red-600 font-black text-sm flex items-center justify-center hover:bg-red-100 transition-all disabled:opacity-60"
        >
          <LogOut size={16} className="mr-2" />
          {loggingOutAll ? 'Signing Out Devices...' : 'Logout All Devices'}
        </button>
      </div>
    </div>
  );
};

export default AddressBook;
