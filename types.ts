
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  MERCHANT = 'MERCHANT',
  DELIVERY = 'DELIVERY',
  ADMIN = 'ADMIN'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  ABANDONED = 'ABANDONED'
}

export enum PaymentMethod {
  MOMO = 'MOMO',
  AIRTEL = 'AIRTEL',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export enum OrderStatus {
  PENDING = 'pending',
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  PROCESSING = 'processing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  ON_THE_WAY = 'on_the_way',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  REFUNDED = 'refunded'
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

export interface Notification {
  id: string;
  userId: string;
  role: UserRole;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  metadata?: any; // e.g. orderId
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  orderCount: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  variant?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  merchantId: string;
  merchantName: string;
  riderId?: string;
  riderName?: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryFee: number;
  totalAmount: number;
  tx_ref: string;
  address: string;
  phone: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  sizes?: string[];
  colors?: { name: string; hex: string }[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  images?: string[];
  stock: number;
  rating: number;
  description?: string;
  merchantId?: string;
  merchantName?: string;
  status?: string;
  reviewsCount?: number;
  variants?: ProductVariant;
}

export interface Merchant {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  balance: number;
  status?: 'active' | 'pending' | 'suspended';
  commissionRate?: number;
  totalSales?: number;
  joinedAt?: string;
  documentsVerified?: boolean;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  status: 'available' | 'busy' | 'offline';
  vehicleNumber: string;
  rating: number;
  totalDeliveries: number;
  earnings: number;
}

export interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  type: 'payment' | 'payout' | 'income';
  status: 'pending' | 'success' | 'failed';
  method: string;
  tx_ref: string;
  timestamp: string;
}
