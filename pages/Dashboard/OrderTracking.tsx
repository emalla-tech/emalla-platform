import React, { useEffect, useMemo, useState } from 'react';
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
import { Order, OrderStatus, PaymentMethod } from '../../types';
import { OrderService } from '../../services/orderService';

interface TrackingStep {
  key: OrderStatus;
  status: string;
  location: string;
  time: string;
  completed: boolean;
  current: boolean;
}

const TRACKING_FLOW: Array<{ key: OrderStatus; label: string }> = [
  { key: OrderStatus.PENDING_PAYMENT, label: 'Order Placed' },
  { key: OrderStatus.PAID, label: 'Payment Confirmed' },
  { key: OrderStatus.CONFIRMED, label: 'Order Confirmed' },
  { key: OrderStatus.PREPARING, label: 'Processed & Packed' },
  { key: OrderStatus.READY_FOR_PICKUP, label: 'Ready for Pickup' },
  { key: OrderStatus.ASSIGNED, label: 'Rider Assigned' },
  { key: OrderStatus.PICKED_UP, label: 'Picked Up' },
  { key: OrderStatus.ON_THE_WAY, label: 'In Transit' },
  { key: OrderStatus.OUT_FOR_DELIVERY, label: 'Out for Delivery' },
  { key: OrderStatus.DELIVERED, label: 'Delivered' },
  { key: OrderStatus.COMPLETED, label: 'Completed' }
];

const formatStatus = (status?: string) => String(status || '').replaceAll('_', ' ');

const getLocationLabel = (order: Order, status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING_PAYMENT:
    case OrderStatus.PAID:
    case OrderStatus.CONFIRMED:
      return 'E-Malla order desk';
    case OrderStatus.PREPARING:
    case OrderStatus.READY_FOR_PICKUP:
      return `${order.merchantName} fulfilment center`;
    case OrderStatus.ASSIGNED:
    case OrderStatus.PICKED_UP:
    case OrderStatus.ON_THE_WAY:
    case OrderStatus.OUT_FOR_DELIVERY:
      return order.address || 'Customer delivery route';
    case OrderStatus.DELIVERED:
    case OrderStatus.COMPLETED:
      return order.address || 'Delivery destination';
    default:
      return 'Order processing';
  }
};

const getEstimatedArrival = (order: Order) => {
  if ([OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(order.status)) return 'Delivered';
  if (order.status === OrderStatus.OUT_FOR_DELIVERY) return 'Arrival pending handoff';
  if (order.status === OrderStatus.ON_THE_WAY) return 'In transit';
  if (order.status === OrderStatus.READY_FOR_PICKUP || order.status === OrderStatus.ASSIGNED) return 'Pickup in progress';
  if (order.status === OrderStatus.PENDING_PAYMENT) return 'Waiting for payment confirmation';
  return 'Being processed';
};

const buildTrackingSteps = (order: Order): TrackingStep[] => {
  const currentIndex = TRACKING_FLOW.findIndex((step) => step.key === order.status);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  return TRACKING_FLOW.map((step, index) => ({
    key: step.key,
    status: step.label,
    location: getLocationLabel(order, step.key),
    time: index <= safeIndex ? new Date(order.updatedAt || order.createdAt).toLocaleString() : 'Pending',
    completed: index < safeIndex || [OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(order.status) && index <= safeIndex,
    current: index === safeIndex && ![OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(order.status)
  }));
};

interface OrderTrackingProps {
  guestAccess?: {
    email?: string;
    phone?: string;
  };
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ guestAccess }) => {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSellerView = location.pathname.includes('/seller');
  const isRiderView = location.pathname.includes('/rider');
  const isGuestView = location.pathname.includes('/track-order');
  const backPath = isSellerView ? '/seller/orders' : isRiderView ? '/rider/history' : isGuestView ? '/shop' : '/buyer/orders';

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) {
        setError('Order reference missing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const nextOrder = await OrderService.getOrderById(id, guestAccess);
        if (!nextOrder) {
          throw new Error('Order not found.');
        }
        setOrder(nextOrder);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load tracking details.');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const trackingData = useMemo(() => (order ? buildTrackingSteps(order) : []), [order]);
  const currentStep = useMemo(() => trackingData.find((step) => step.current) || trackingData.find((step) => step.completed), [trackingData]);
  const totalItems = useMemo(() => (order?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0), [order]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 text-center shadow-sm">
        <h2 className="text-xl font-black text-gray-900">Tracking unavailable</h2>
        <p className="text-sm text-gray-500 mt-2">{error || 'We could not load tracking details for this order.'}</p>
        <Link to={backPath} className="inline-flex mt-6 px-5 py-3 rounded-2xl bg-black text-white font-black text-sm">
          Back to Orders
        </Link>
      </div>
    );
  }

  const courierLabel = order.riderName || 'Awaiting rider assignment';
  const paymentLabel =
    order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'Cash on Delivery' : formatStatus(order.paymentMethod);

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <Link to={backPath} className="flex items-center text-gray-500 hover:text-orange-500 font-bold transition-colors mb-2 text-sm">
            <ArrowLeft size={16} className="mr-2" />
            Back to Orders
          </Link>
          <div className="flex items-center space-x-3 flex-wrap">
            <h1 className="text-3xl font-black text-gray-900">Track Order {order.orderNumber}</h1>
            {isSellerView && <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Merchant View</span>}
            {isRiderView && <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Rider View</span>}
          </div>
        </div>
        <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
          <span className="text-orange-600 font-bold text-xs uppercase tracking-widest">{formatStatus(order.status)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 md:p-12">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-200">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-gray-900">{isSellerView ? 'Outgoing Shipment Tracking' : 'Live delivery tracking'}</h3>
                  <p className="text-gray-400 text-sm">
                    Estimated arrival: <span className="text-orange-600 font-bold">{getEstimatedArrival(order)}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="relative pl-8 space-y-12">
              <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-100"></div>

              {trackingData.map((step, idx) => (
                <div key={step.key} className="relative group">
                  <div
                    className={`absolute -left-8 w-8 h-8 rounded-full border-4 border-white shadow-md flex items-center justify-center transition-all z-10 ${
                      step.completed || step.current ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step.completed || step.current ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>

                  {step.current ? (
                    <div className="absolute -left-8 w-8 h-8 rounded-full bg-orange-500 animate-ping opacity-20 z-0"></div>
                  ) : null}

                  <div className={`${step.current ? 'bg-orange-50 p-6 rounded-3xl border border-orange-100' : ''}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <h4 className={`font-bold text-lg ${step.completed || step.current ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.status}
                        {step.current ? <span className="ml-3 text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full uppercase">Live</span> : null}
                      </h4>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{step.time}</span>
                    </div>
                    <p className={`text-sm mt-1 flex items-center ${step.completed || step.current ? 'text-gray-500' : 'text-gray-300'}`}>
                      <MapPin size={12} className="mr-1" /> {step.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8">
            <h4 className="text-xl font-black text-gray-900 mb-6">Shipment Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Package className="text-gray-400" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Items</p>
                    <p className="text-sm font-bold text-gray-900">{totalItems} item(s)</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="text-gray-400" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Payment</p>
                    <p className="text-sm font-bold text-emerald-600">{paymentLabel}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Navigation className="text-gray-400" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Merchant</p>
                    <p className="text-sm font-bold text-gray-900">{order.merchantName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Info className="text-gray-400" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Instructions</p>
                    <p className="text-sm font-bold text-gray-900 line-clamp-2">{order.notes || 'No delivery notes provided.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gray-900 rounded-[40px] overflow-hidden shadow-xl text-white">
            <div className="h-48 bg-gray-800 relative">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.45),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.08),transparent_25%),linear-gradient(135deg,#111827,#1f2937)]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Truck size={24} />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/40 rounded-full blur-sm"></div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Delivery Route</span>
                <span className="text-xs font-bold truncate ml-3">{currentStep?.location || order.address}</span>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-14 h-14 bg-gray-800 rounded-2xl border border-white/10 flex items-center justify-center text-lg font-black text-orange-400">
                  {courierLabel.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{courierLabel}</h4>
                  <p className="text-gray-400 text-xs">{order.riderId ? 'Assigned delivery rider' : 'Assignment pending'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <a href={`tel:${order.phone}`} className="bg-white/10 hover:bg-white/20 py-4 rounded-2xl flex items-center justify-center transition-all border border-white/5">
                  <Phone size={20} className="mr-2 text-orange-500" />
                  <span className="font-bold text-sm">Call</span>
                </a>
                <div className="bg-orange-500 py-4 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Clock size={20} className="mr-2" />
                  <span className="font-bold text-sm">{getEstimatedArrival(order)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-400 rounded-[40px] p-8 text-black relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Clock size={120} />
            </div>
            <h4 className="font-black text-xl mb-4">{isSellerView ? 'Dispatch Ready?' : 'Stay Ready!'}</h4>
            <p className="text-sm font-medium leading-relaxed opacity-80">
              {isSellerView
                ? 'Keep the package sealed and ready for a smooth hand-off when the rider arrives.'
                : `Delivery destination: ${order.address}. Keep ${order.phone} reachable for hand-off updates.`}
            </p>
          </div>

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
