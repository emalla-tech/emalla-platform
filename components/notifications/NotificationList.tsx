import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, Check, Clock,
  Package, Zap, ShieldAlert, ChevronRight, Bell
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationType, UserRole } from '../../types';

interface NotificationListProps {
  userId: string;
  role: UserRole;
}

const NotificationList: React.FC<NotificationListProps> = ({ userId, role }) => {
  const { notifications, markRead, remove, markAllRead } = useNotifications(userId, role);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const navigate = useNavigate();

  const filtered = notifications.filter(n => filter === 'all' || n.type === filter);

  const getOrderTrackingRoute = (orderId: string) => {
    switch (role) {
      case UserRole.MERCHANT:
        return `/seller/orders/${orderId}/track`;
      case UserRole.CUSTOMER:
        return `/buyer/orders/${orderId}/track`;
      case UserRole.ADMIN:
        return '/admin/dashboard/orders';
      case UserRole.DELIVERY:
        return `/rider/orders/${orderId}/track`;
      default:
        return null;
    }
  };

  const getStyle = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS: return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <Zap size={20} /> };
      case NotificationType.WARNING: return { bg: 'bg-orange-50', text: 'text-orange-600', icon: <ShieldAlert size={20} /> };
      case NotificationType.ERROR: return { bg: 'bg-red-50', text: 'text-red-600', icon: <ShieldAlert size={20} /> };
      default: return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <Package size={20} /> };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Notification Center</h1>
          <p className="text-gray-500 font-medium">Keep track of your order updates and system alerts.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={markAllRead}
            className="px-6 py-2.5 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
          >
            Mark All Read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex overflow-x-auto no-scrollbar gap-4 border-b border-gray-100 pb-4">
        {['all', NotificationType.INFO, NotificationType.SUCCESS, NotificationType.WARNING, NotificationType.ERROR].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              filter === f ? 'bg-black text-white shadow-xl' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((n) => {
          const style = getStyle(n.type);
          return (
            <div 
              key={n.id} 
              className={`bg-white rounded-[32px] p-6 border transition-all flex items-start gap-6 group ${
                n.read ? 'border-gray-100 opacity-70' : 'border-orange-200 shadow-xl shadow-orange-500/5'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                 {style.icon}
              </div>
              <div className="flex-grow space-y-2">
                 <div className="flex justify-between items-start">
                    <div>
                       <h3 className="text-lg font-black text-gray-900 leading-tight">{n.title}</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center mt-1">
                          <Clock size={12} className="mr-1.5" /> 
                          {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       {!n.read && (
                         <button 
                           onClick={() => markRead(n.id)}
                           className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                         >
                           <Check size={16} />
                         </button>
                       )}
                       <button 
                         onClick={() => remove(n.id)}
                         className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                 </div>
                 <p className="text-gray-600 font-medium leading-relaxed">{n.message}</p>
                 {n.metadata?.orderId && (
                   <div className="pt-4 flex">
                      <button
                        type="button"
                        onClick={() => {
                          const route = getOrderTrackingRoute(String(n.metadata.orderId));
                          if (route) {
                            navigate(route);
                          }
                        }}
                        className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center group/btn"
                      >
                         View Related Order <ChevronRight size={14} className="ml-1 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                   </div>
                 )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-gray-50 rounded-[40px] p-32 text-center border-2 border-dashed border-gray-100">
             <Bell size={64} className="mx-auto text-gray-200 mb-6" />
             <h3 className="text-2xl font-black text-gray-900 mb-2">Inbox is empty</h3>
             <p className="text-gray-500 font-medium">Any new platform alerts will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList;
