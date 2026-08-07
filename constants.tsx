
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
  Baby,
  BadgePercent,
  BriefcaseBusiness,
  Car,
  Dumbbell,
  Gamepad2,
  HardHat,
  HeartPulse,
  Laptop,
  Monitor,
  Printer,
  ShieldCheck,
  Smartphone,
  Shirt,
  Home as HomeIcon,
  Apple,
  Sparkles,
  Book,
  ClipboardList,
  Sofa,
  Sprout,
  TabletSmartphone,
  Tv,
  Utensils,
  Wifi,
  Wrench
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
  { id: '1', name: 'Electronics & Gadgets', icon: <Smartphone size={32} /> },
  { id: '2', name: 'Fashion & Clothing', icon: <Shirt size={32} /> },
  { id: '3', name: 'Home & Living', icon: <HomeIcon size={32} /> },
  { id: '4', name: 'Groceries & Household Essentials', icon: <Apple size={32} /> },
  { id: '5', name: 'Beauty & Personal Care', icon: <Sparkles size={32} /> },
  { id: '6', name: 'Books & Learning Materials', icon: <Book size={32} /> },
  { id: '7', name: 'Stationery & Office Supplies', icon: <ClipboardList size={32} /> },
  { id: '8', name: 'Computers & Accessories', icon: <Laptop size={32} /> },
  { id: '9', name: 'Phones & Tablets', icon: <TabletSmartphone size={32} /> },
  { id: '10', name: 'Home Appliances', icon: <Tv size={32} /> },
  { id: '11', name: 'Shoes & Bags', icon: <ShoppingBag size={32} /> },
  { id: '12', name: 'Health & Wellness', icon: <HeartPulse size={32} /> },
  { id: '13', name: 'Baby & Kids', icon: <Baby size={32} /> },
  { id: '14', name: 'Sports & Fitness', icon: <Dumbbell size={32} /> },
  { id: '15', name: 'Automotive & Motorcycle', icon: <Car size={32} /> },
  { id: '16', name: 'Tools & Hardware', icon: <Wrench size={32} /> },
  { id: '17', name: 'Construction & Building Materials', icon: <HardHat size={32} /> },
  { id: '18', name: 'Food & Beverages', icon: <Utensils size={32} /> },
  { id: '19', name: 'Security & CCTV', icon: <ShieldCheck size={32} /> },
  { id: '20', name: 'Networking & Internet Equipment', icon: <Wifi size={32} /> },
  { id: '21', name: 'Gaming & Entertainment', icon: <Gamepad2 size={32} /> },
  { id: '22', name: 'Agriculture & Farming', icon: <Sprout size={32} /> },
  { id: '23', name: 'Industrial & Business Supplies', icon: <BriefcaseBusiness size={32} /> },
  { id: '24', name: 'Services', icon: <Monitor size={32} /> },
  { id: '25', name: 'Deals & Promotions', icon: <BadgePercent size={32} /> },
  { id: '26', name: 'Printers & Office Machines', icon: <Printer size={32} /> },
  { id: '27', name: 'Furniture', icon: <Sofa size={32} /> }
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
