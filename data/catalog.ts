import { Product } from '../types';

const categoryImageMap: Record<string, string> = {
  '1': '/catalog/electronics.svg',
  '2': '/catalog/fashion.svg',
  '3': '/catalog/home.svg',
  '4': '/catalog/groceries.svg',
  '5': '/catalog/beauty.svg',
  '6': '/catalog/books.svg'
};

const categoryGallery = (categoryId: string) => [categoryImageMap[categoryId], categoryImageMap[categoryId], categoryImageMap[categoryId]];

export const CATALOG_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Smart Watch Series 7',
    price: 120000,
    category: '1',
    rating: 4.8,
    reviewsCount: 124,
    stock: 15,
    image: categoryImageMap['1'],
    images: categoryGallery('1'),
    description:
      'Experience the next level of connectivity with the Smart Watch Series 7. Features always-on retina display, advanced health sensors, and reliable sync for busy city life in Rwanda.',
    merchantId: 'MCH-01',
    merchantName: 'Kigali Digital Hub',
    variants: {
      colors: [
        { name: 'Midnight', hex: '#1d212a' },
        { name: 'Starlight', hex: '#faf0e6' },
        { name: 'Blue', hex: '#203c56' }
      ]
    }
  },
  {
    id: 'p2',
    name: 'Wireless Noise Cancelling Headphones',
    price: 85000,
    category: '1',
    rating: 4.5,
    reviewsCount: 89,
    stock: 22,
    image: categoryImageMap['1'],
    images: categoryGallery('1'),
    description:
      'Immerse yourself in music without distractions. Perfect for busy Kigali commutes or quiet study sessions.',
    merchantId: 'MCH-01',
    merchantName: 'Kigali Digital Hub',
    variants: {
      colors: [
        { name: 'Silver', hex: '#c0c0c0' },
        { name: 'Black', hex: '#000000' }
      ]
    }
  },
  {
    id: 'p3',
    name: 'Cotton Linen Summer Shirt',
    price: 15000,
    category: '2',
    rating: 4.2,
    reviewsCount: 45,
    stock: 45,
    image: categoryImageMap['2'],
    images: categoryGallery('2'),
    description:
      'Breathable, lightweight cotton linen fabric perfect for the Rwandan climate. Stay stylish and cool.',
    merchantId: 'MCH-05',
    merchantName: 'Inyange Fashion',
    variants: {
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'White', hex: '#ffffff' },
        { name: 'Beige', hex: '#f5f5dc' },
        { name: 'Sage', hex: '#9caf88' }
      ]
    }
  },
  {
    id: 'p4',
    name: 'Leather Weekend Bag',
    price: 45000,
    category: '2',
    rating: 4.9,
    reviewsCount: 32,
    stock: 8,
    image: categoryImageMap['2'],
    description:
      'Premium handcrafted leather bag. Durable, spacious, and perfect for your weekend getaways to Rubavu.',
    merchantId: 'MCH-05',
    merchantName: 'Inyange Fashion',
    variants: {
      colors: [
        { name: 'Tan', hex: '#d2b48c' },
        { name: 'Chocolate', hex: '#3d1e1e' }
      ]
    }
  },
  {
    id: 'p5',
    name: 'Modern Ceramic Vase',
    price: 22000,
    category: '3',
    rating: 4.7,
    reviewsCount: 12,
    stock: 20,
    image: categoryImageMap['3'],
    description: 'A minimal statement piece for modern interiors, handcrafted for stylish homes.'
  },
  {
    id: 'p6',
    name: 'Smart LED Light Bulb',
    price: 8000,
    category: '3',
    rating: 4.4,
    reviewsCount: 67,
    stock: 60,
    image: categoryImageMap['3'],
    description: 'Energy-efficient smart lighting with easy setup for apartments, offices, and family homes.'
  },
  {
    id: 'p7',
    name: 'Organic Arabica Coffee (500g)',
    price: 12000,
    category: '4',
    rating: 5,
    reviewsCount: 210,
    stock: 100,
    image: categoryImageMap['4'],
    description: 'Freshly roasted specialty coffee from the hills of Karongi with notes of berry and chocolate.'
  },
  {
    id: 'p8',
    name: 'Fresh Rwandan Tea Leaves',
    price: 5000,
    category: '4',
    rating: 4.8,
    reviewsCount: 156,
    stock: 180,
    image: categoryImageMap['4'],
    description: 'Bright, aromatic tea leaves sourced from local farms for a smooth everyday brew.'
  },
  {
    id: 'p9',
    name: 'Moisturizing Face Cream',
    price: 18000,
    category: '5',
    rating: 4.3,
    reviewsCount: 28,
    stock: 30,
    image: categoryImageMap['5'],
    description: 'Hydrating daily skincare made to leave skin soft, balanced, and refreshed.'
  },
  {
    id: 'p10',
    name: 'Sandalwood Fragrance Oil',
    price: 25000,
    category: '5',
    rating: 4.6,
    reviewsCount: 19,
    stock: 20,
    image: categoryImageMap['5'],
    description: 'Warm, elegant fragrance oil with a refined sandalwood profile for everyday luxury.'
  },
  {
    id: 'p11',
    name: 'History of Rwanda: A Journey',
    price: 15000,
    category: '6',
    rating: 4.9,
    reviewsCount: 54,
    stock: 40,
    image: categoryImageMap['6'],
    description: 'A rich and accessible read for anyone exploring the story, resilience, and future of Rwanda.'
  },
  {
    id: 'p12',
    name: 'African Contemporary Art Guide',
    price: 35000,
    category: '6',
    rating: 4.7,
    reviewsCount: 8,
    stock: 12,
    image: categoryImageMap['6'],
    description: 'A beautifully curated guide to the voices and movements shaping contemporary African art.'
  },
  {
    id: 'p13',
    name: 'Ultra-slim Laptop Pro',
    price: 850000,
    category: '1',
    rating: 4.9,
    reviewsCount: 42,
    stock: 5,
    image: categoryImageMap['1'],
    description: 'Powerful performance in a sleek chassis for entrepreneurs, developers, and creatives on the move.'
  },
  {
    id: 'p14',
    name: 'Handcrafted Woven Basket',
    price: 12000,
    category: '3',
    rating: 5,
    reviewsCount: 112,
    stock: 30,
    image: categoryImageMap['3'],
    description: 'Traditional Rwandan Agaseke basket, meticulously hand-woven by local artisans.'
  }
];

export const getProductById = (id: string) =>
  CATALOG_PRODUCTS.find((product) => product.id === id);
