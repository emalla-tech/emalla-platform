
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
  BANK_TRANSFER = 'BANK_TRANSFER',
  GTBANK_MOMO_PAY = 'GTBANK_MOMO_PAY',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY'
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
  username?: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  orderCount: number;
  mustChangePassword?: boolean;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  district: string;
  sector: string;
  street: string;
  isDefault: boolean;
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
  customerEmail?: string;
  merchantId: string;
  merchantName: string;
  riderId?: string;
  riderName?: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryFee: number;
  riderPayout?: number;
  riderPayoutStatus?: 'pending_assignment' | 'ready' | 'assigned' | 'released';
  totalAmount: number;
  tx_ref: string;
  address: string;
  phone: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SupportTicketType = 'support' | 'return' | 'refund';
export type SupportTicketStatus = 'new' | 'replied' | 'resolved';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  type: SupportTicketType;
  name: string;
  email: string;
  customerId: string;
  subject: string;
  message: string;
  reason?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  orderId?: string | null;
  orderNumber?: string | null;
  merchantId?: string | null;
  merchantName?: string | null;
  requestedAmount?: number;
  status: SupportTicketStatus;
  assignedAdminName?: string | null;
  lastResponse?: string;
  repliedAt?: string | null;
  resolvedAt?: string | null;
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
  specifications?: string;
  merchantId?: string;
  merchantName?: string;
  status?: string;
  featured?: boolean;
  reviewsCount?: number;
  variants?: ProductVariant;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  verifiedPurchase?: boolean;
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
  grossSales?: number;
  commissionAmount?: number;
  joinedAt?: string;
  documentsVerified?: boolean;
  supportEmail?: string;
  logoUrl?: string;
  coverUrl?: string;
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
  mobileMoneyNumber?: string;
  emergencyContact?: string;
}

export interface RiderApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  temporaryUsername?: string;
  temporaryPassword?: string;
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

export interface PaymentVerificationResult {
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  id?: string;
  tx_ref?: string;
  orderId?: string;
}
