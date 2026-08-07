
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

export const PRODUCT_SUBCATEGORIES: Record<string, string[]> = {
  '1': ['Smart Devices', 'Audio', 'Cameras', 'Accessories', 'Power & Charging'],
  '2': ["Men's Clothing", "Women's Clothing", 'Kids Fashion', 'Traditional Wear', 'Fashion Accessories'],
  '3': ['Kitchenware', 'Home Decor', 'Bedding', 'Storage & Organization', 'Cleaning Essentials'],
  '4': ['Groceries', 'Household Cleaning', 'Beverages', 'Pantry Essentials', 'Daily Consumables'],
  '5': ['Skincare', 'Hair Care', 'Fragrance', 'Cosmetics', 'Grooming'],
  '6': ['Textbooks', 'Revision Guides', 'Literature', "Children's Books", 'Learning Resources'],
  '7': ['Pens & Writing', 'Paper & Notebooks', 'School Supplies', 'Office Files', 'Office Consumables'],
  '8': ['Laptops', 'Desktops', 'Monitors', 'Keyboards & Mice', 'Storage', 'Computer Parts'],
  '9': ['Smartphones', 'Tablets', 'Chargers', 'Cases & Screen Protectors', 'Mobile Accessories'],
  '10': ['TVs', 'Kitchen Appliances', 'Laundry Appliances', 'Cooling & Fans', 'Small Appliances'],
  '11': ['Shoes', 'Handbags', 'Backpacks', 'Travel Bags', 'Wallets & Accessories'],
  '12': ['Wellness Essentials', 'Personal Care Tools', 'First Aid', 'Fitness Care', 'Hygiene Products'],
  '13': ['Baby Care', 'Kids Clothing', 'Toys', 'School Items', 'Family Essentials'],
  '14': ['Gym Equipment', 'Sports Gear', 'Activewear', 'Outdoor Gear', 'Team Sports'],
  '15': ['Car Accessories', 'Motorcycle Parts', 'Maintenance Tools', 'Oils & Fluids', 'Vehicle Electronics'],
  '16': ['Hand Tools', 'Power Tools', 'Electrical Supplies', 'Plumbing Supplies', 'Repair Hardware'],
  '17': ['Building Supplies', 'Finishing Materials', 'Safety Gear', 'Paint & Coatings', 'Construction Tools'],
  '18': ['Packaged Foods', 'Drinks', 'Snacks', 'Tea & Coffee', 'Local Food Products'],
  '19': ['CCTV Cameras', 'Access Control', 'Alarm Systems', 'Smart Locks', 'Security Accessories'],
  '20': ['Routers', 'Switches', 'Access Points', 'Network Cables', 'Internet Accessories'],
  '21': ['Consoles', 'Gaming Accessories', 'Audio Entertainment', 'Media Devices', 'Toys & Games'],
  '22': ['Farming Tools', 'Seeds', 'Irrigation', 'Agri Inputs', 'Farm Equipment'],
  '23': ['Bulk Supplies', 'Professional Equipment', 'Business Tools', 'Industrial Essentials', 'Packaging'],
  '24': ['Repairs', 'Installation', 'Business Support', 'Delivery Services', 'Professional Services'],
  '25': ['Discounts', 'Bundles', 'Seasonal Offers', 'Clearance', 'Featured Deals'],
  '26': ['Printers', 'Scanners', 'Copiers', 'Toners & Cartridges', 'Shredders'],
  '27': ['Office Desks', 'Office Chairs', 'Shelves', 'Home Furniture', 'Interior Essentials']
};

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
