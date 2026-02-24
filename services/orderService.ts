import { Order, OrderStatus, PaymentStatus, PaymentMethod, OrderItem, UserRole, NotificationType } from '../types';
import { NotificationService } from './NotificationService';

const STORAGE_KEY = 'emalla_notifications_db';

/**
 * Strict transition map to prevent illegal order state changes.
 */
const ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.ASSIGNED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.ON_THE_WAY],
  [OrderStatus.ON_THE_WAY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
  [OrderStatus.REJECTED]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [],
  // Legacy/Alias handling
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.READY_FOR_PICKUP],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED]
};

let cache: Order[] | null = null;

export const OrderService = {
  
  _loadOrders: (): Order[] => {
    if (cache) return cache;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      cache = stored ? JSON.parse(stored) : OrderService._getInitialMockData();
    } catch (e) {
      cache = [];
    }
    return cache || [];
  },

  _saveOrders: (orders: Order[]) => {
    cache = [...orders];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  },

  _getInitialMockData: (): Order[] => [
    {
      id: 'o-001',
      orderNumber: 'EM-2024-0892',
      customerId: 'USR-DEV-001',
      customerName: 'Mugisha Dev',
      merchantId: 'MCH-05',
      merchantName: 'Inyange Fashion',
      items: [{ productId: 'p1', productName: 'Smart Watch S7', quantity: 1, price: 120000, subtotal: 120000 }],
      status: OrderStatus.ON_THE_WAY,
      paymentStatus: PaymentStatus.SUCCESS,
      paymentMethod: PaymentMethod.MOMO,
      deliveryFee: 3500,
      totalAmount: 123500,
      tx_ref: 'EM-TX-892',
      address: 'Gasabo, Kimironko, KG 123 St',
      phone: '0780000000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],

  generateOrderNumber: () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `EM-${year}-${rand}`;
  },

  createOrder: async (data: Partial<Order>): Promise<Order> => {
    const orders = OrderService._loadOrders();
    const items = data.items || [];
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const deliveryFee = data.deliveryFee || 0;
    const totalAmount = subtotal + deliveryFee;

    const newOrder: Order = {
      id: 'o-' + Date.now(),
      orderNumber: OrderService.generateOrderNumber(),
      customerId: data.customerId || '',
      customerName: data.customerName || '',
      merchantId: data.merchantId || 'MCH-05',
      merchantName: data.merchantName || 'E-Malla Merchant',
      items: items.map(item => ({ ...item, subtotal: item.price * item.quantity })),
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: data.paymentMethod || PaymentMethod.MOMO,
      deliveryFee: deliveryFee,
      totalAmount: totalAmount,
      tx_ref: data.tx_ref || `TX-${Date.now()}`,
      address: data.address || '',
      phone: data.phone || '',
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updated = [newOrder, ...orders];
    OrderService._saveOrders(updated);

    // AUTO-NOTIFY: Customer & Merchant
    NotificationService.send({
      userId: newOrder.customerId,
      role: UserRole.CUSTOMER,
      title: "Order Placed!",
      message: `Your order ${newOrder.orderNumber} is awaiting payment.`,
      type: NotificationType.INFO
    });

    NotificationService.send({
      userId: newOrder.merchantId,
      role: UserRole.MERCHANT,
      title: "New Incoming Order!",
      message: `Order ${newOrder.orderNumber} has been placed for RWF ${newOrder.totalAmount.toLocaleString()}.`,
      type: NotificationType.SUCCESS,
      channels: ['in-app', 'sms']
    });

    return newOrder;
  },

  getAllOrders: async (): Promise<Order[]> => OrderService._loadOrders(),

  getOrdersByMerchant: async (merchantId: string): Promise<Order[]> => 
    OrderService._loadOrders().filter(o => o.merchantId === merchantId),

  getOrdersByRider: async (riderId: string): Promise<Order[]> => 
    OrderService._loadOrders().filter(o => o.riderId === riderId),

  // Fix: Added missing getOrdersByCustomer method used by MyOrders.tsx
  getOrdersByCustomer: async (customerId: string): Promise<Order[]> => 
    OrderService._loadOrders().filter(o => o.customerId === customerId),

  updateOrderStatus: async (orderId: string, nextStatus: OrderStatus): Promise<boolean> => {
    const orders = OrderService._loadOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return false;

    const currentOrder = orders[idx];
    const allowed = ALLOWED_TRANSITIONS[currentOrder.status] || [];

    if (!allowed.includes(nextStatus)) return false;

    let paymentStatus = currentOrder.paymentStatus;
    if (nextStatus === OrderStatus.PAID) paymentStatus = PaymentStatus.SUCCESS;

    orders[idx] = { 
      ...currentOrder, 
      status: nextStatus, 
      paymentStatus,
      updatedAt: new Date().toISOString() 
    };
    
    OrderService._saveOrders(orders);

    // AUTO-NOTIFY Logic for state changes
    if (nextStatus === OrderStatus.PAID) {
      NotificationService.send({
        userId: currentOrder.customerId,
        role: UserRole.CUSTOMER,
        title: "Payment Success!",
        message: `We've received your payment for ${currentOrder.orderNumber}. The merchant is now preparing your items.`,
        type: NotificationType.SUCCESS,
        channels: ['in-app', 'sms', 'email']
      });
    }

    if (nextStatus === OrderStatus.READY_FOR_PICKUP) {
      NotificationService.sendToRole(UserRole.DELIVERY, "Job Available", `New pickup ready at ${currentOrder.merchantName}. Open the pool to accept.`, NotificationType.INFO);
    }

    if (nextStatus === OrderStatus.DELIVERED) {
      NotificationService.send({
        userId: currentOrder.customerId,
        role: UserRole.CUSTOMER,
        title: "Package Delivered!",
        message: `Your order ${currentOrder.orderNumber} has been successfully delivered. Please rate your experience!`,
        type: NotificationType.SUCCESS,
        channels: ['in-app', 'sms']
      });
    }

    return true;
  },

  assignRider: async (orderId: string, riderId: string, riderName: string): Promise<boolean> => {
    const orders = OrderService._loadOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return false;

    orders[idx] = { 
      ...orders[idx], 
      riderId, 
      riderName,
      status: OrderStatus.ASSIGNED,
      updatedAt: new Date().toISOString() 
    };

    OrderService._saveOrders(orders);

    // AUTO-NOTIFY: Rider
    NotificationService.send({
      userId: riderId,
      role: UserRole.DELIVERY,
      title: "New Delivery Assigned",
      message: `You've been assigned order ${orders[idx].orderNumber}. Head to the merchant hub for pickup.`,
      type: NotificationType.SUCCESS
    });

    return true;
  },

  cancelOrder: async (orderId: string): Promise<boolean> => {
    const success = await OrderService.updateOrderStatus(orderId, OrderStatus.CANCELLED);
    if (success) {
      const order = await OrderService.getOrderById(orderId);
      if (order) {
        NotificationService.send({
          userId: order.merchantId,
          role: UserRole.MERCHANT,
          title: "Order Cancelled",
          message: `Order ${order.orderNumber} has been cancelled by the system/customer.`,
          type: NotificationType.WARNING
        });
      }
    }
    return success;
  },

  getOrderById: async (id: string) => OrderService._loadOrders().find(o => o.id === id || o.orderNumber === id)
};