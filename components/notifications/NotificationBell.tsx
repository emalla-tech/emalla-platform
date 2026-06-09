
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, Clock, Package, Zap, ShieldAlert, ChevronRight } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationType, UserRole } from '../../types';
import { Link, useNavigate } from 'react-router-dom';

interface NotificationBellProps {
  userId: string;
  role: UserRole;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId, role }) => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId, role);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS: return <Zap className="text-emerald-500" size={16} />;
      case NotificationType.WARNING: return <ShieldAlert className="text-orange-500" size={16} />;
      case NotificationType.ERROR: return <ShieldAlert className="text-red-500" size={16} />;
      default: return <Package className="text-blue-500" size={16} />;
    }
  };

  const getRecent = notifications.slice(0, 5);
  const notificationCenterPath = {
    [UserRole.CUSTOMER]: '/buyer/notifications',
    [UserRole.MERCHANT]: '/seller/notifications',
    [UserRole.DELIVERY]: '/rider/notifications',
    [UserRole.ADMIN]: '/admin/dashboard/notifications'
  }[role];
  const getOrderTrackingPath = (orderId: string) => {
    if (role === UserRole.CUSTOMER) return `/buyer/orders/${orderId}/track`;
    if (role === UserRole.MERCHANT) return `/seller/orders/${orderId}/track`;
    if (role === UserRole.DELIVERY) return `/rider/orders/${orderId}/track`;
    return '/admin/dashboard/orders';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-gray-50 hover:bg-orange-50 text-gray-500 hover:text-orange-500 rounded-xl transition-all group"
      >
        <Bell size={20} className={unreadCount > 0 ? 'animate-[swing_2s_infinite]' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white text-[8px] font-black flex items-center justify-center rounded-full ring-2 ring-white shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-96 bg-white rounded-[32px] shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
             <h4 className="font-black text-gray-900">Notifications</h4>
             <button 
                onClick={markAllRead}
                className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline"
             >
                Mark all as read
             </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {getRecent.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {getRecent.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => {
                      if (!n.read) {
                        void markRead(n.id);
                      }
                      if (n.metadata?.orderId) {
                        setIsOpen(false);
                        navigate(getOrderTrackingPath(String(n.metadata.orderId)));
                      }
                    }}
                    className={`p-5 flex gap-4 transition-colors cursor-pointer relative group ${n.read ? 'bg-white' : 'bg-orange-50/30'}`}
                  >
                    {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-full" />}
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                       {getIcon(n.type)}
                    </div>
                    <div className="flex-grow space-y-1">
                       <p className="text-sm font-black text-gray-900 leading-tight">{n.title}</p>
                       <p className="text-xs text-gray-500 font-medium line-clamp-2">{n.message}</p>
                       <p className="text-[9px] text-gray-400 font-bold uppercase flex items-center">
                          <Clock size={10} className="mr-1" /> {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                 <Bell size={40} className="mx-auto text-gray-100 mb-4" />
                 <p className="text-sm font-bold text-gray-400">All caught up!</p>
                 <p className="text-xs text-gray-300 mt-1">No new alerts at this time.</p>
              </div>
            )}
          </div>

          <Link 
            to={notificationCenterPath}
            onClick={() => setIsOpen(false)}
            className="block p-4 bg-gray-50 hover:bg-gray-100 text-center text-[10px] font-black text-gray-500 uppercase tracking-[3px] transition-colors"
          >
            View Notification Center
          </Link>
        </div>
      )}

      <style>{`
        @keyframes swing {
          0%, 100% { transform: rotate(0); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(5deg); }
          40% { transform: rotate(-5deg); }
          50% { transform: rotate(0); }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
