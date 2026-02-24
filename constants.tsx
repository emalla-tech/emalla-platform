
import React from 'react';
import { 
  ShoppingBag, 
  Truck, 
  Store, 
  User, 
  HelpCircle, 
  Info, 
  Phone,
  LayoutDashboard,
  Package,
  LineChart,
  Settings,
  Heart,
  ShoppingCart,
  Smartphone,
  Shirt,
  Home as HomeIcon,
  Apple,
  Sparkles,
  Book
} from 'lucide-react';
import { UserRole } from './types';

export const COLORS = {
  primary: 'orange-500',
  secondary: 'yellow-400',
  dark: 'black',
  light: 'white',
  bg: 'gray-50'
};

export const CATEGORIES = [
  { id: '1', name: 'Electronics', icon: <Smartphone size={32} /> },
  { id: '2', name: 'Fashion', icon: <Shirt size={32} /> },
  { id: '3', name: 'Home & Living', icon: <HomeIcon size={32} /> },
  { id: '4', name: 'Groceries', icon: <Apple size={32} /> },
  { id: '5', name: 'Beauty', icon: <Sparkles size={32} /> },
  { id: '6', name: 'Books', icon: <Book size={32} /> }
];

export const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'Shop', path: '/shop' },
  { name: 'How it Works', path: '/how-it-works' },
  { name: 'Become a Seller', path: '/become-seller' }
];

export const ROLE_NAV_CONFIG = {
  [UserRole.CUSTOMER]: [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My Orders', path: '/dashboard/orders', icon: <Package size={20} /> },
    { name: 'Wishlist', path: '/dashboard/wishlist', icon: <Heart size={20} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
  ],
  [UserRole.MERCHANT]: [
    { name: 'Merchant Panel', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My Products', path: '/dashboard/products', icon: <Store size={20} /> },
    { name: 'Orders Received', path: '/dashboard/orders', icon: <ShoppingBag size={20} /> },
    { name: 'Analytics', path: '/dashboard/analytics', icon: <LineChart size={20} /> },
    { name: 'Subscription', path: '/dashboard/subscription', icon: <Package size={20} /> },
  ],
  [UserRole.DELIVERY]: [
    { name: 'Delivery Hub', path: '/dashboard', icon: <Truck size={20} /> },
    { name: 'Available Orders', path: '/dashboard/available', icon: <Package size={20} /> },
    { name: 'My Deliveries', path: '/dashboard/history', icon: <Package size={20} /> },
    { name: 'Earnings', path: '/dashboard/earnings', icon: <LineChart size={20} /> },
  ],
  [UserRole.ADMIN]: [
    { name: 'Admin Console', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'System Orders', path: '/admin/orders', icon: <ShoppingBag size={20} /> },
    { name: 'User Management', path: '/admin/users', icon: <User size={20} /> },
    { name: 'System Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ]
};
