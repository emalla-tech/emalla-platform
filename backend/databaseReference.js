export const DEFAULT_CATEGORY_SEEDS = [
  {
    id: '1',
    name: 'Electronics & Gadgets',
    slug: 'electronics-gadgets',
    description: 'Phones, laptops, accessories, and connected devices.',
    iconKey: 'smartphone',
    sortOrder: 1
  },
  {
    id: '2',
    name: 'Fashion & Clothing',
    slug: 'fashion-clothing',
    description: 'Clothing, shoes, bags, and lifestyle wear.',
    iconKey: 'shirt',
    sortOrder: 2
  },
  {
    id: '3',
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Furniture, decor, kitchenware, and essentials for the home.',
    iconKey: 'home',
    sortOrder: 3
  },
  {
    id: '4',
    name: 'Groceries & Household Essentials',
    slug: 'groceries-household-essentials',
    description: 'Daily food, beverages, and household consumables.',
    iconKey: 'apple',
    sortOrder: 4
  },
  {
    id: '5',
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    description: 'Skincare, cosmetics, fragrance, and personal care products.',
    iconKey: 'sparkles',
    sortOrder: 5
  },
  {
    id: '6',
    name: 'Books & Learning Materials',
    slug: 'books-learning-materials',
    description: 'Educational books, literature, revision guides, and learning resources.',
    iconKey: 'book',
    sortOrder: 6
  },
  {
    id: '7',
    name: 'Stationery & Office Supplies',
    slug: 'stationery-office-supplies',
    description: 'School, office, and paperwork essentials for students, businesses, and teams.',
    iconKey: 'clipboard-list',
    sortOrder: 7
  },
  {
    id: '8',
    name: 'Computers & Accessories',
    slug: 'computers-accessories',
    description: 'Laptops, desktops, monitors, keyboards, storage, and computer accessories.',
    iconKey: 'laptop',
    sortOrder: 8
  },
  {
    id: '9',
    name: 'Phones & Tablets',
    slug: 'phones-tablets',
    description: 'Smartphones, tablets, chargers, cases, and mobile accessories.',
    iconKey: 'tablet-smartphone',
    sortOrder: 9
  },
  {
    id: '10',
    name: 'Home Appliances',
    slug: 'home-appliances',
    description: 'TVs, kitchen appliances, laundry machines, cooling, and home electronics.',
    iconKey: 'tv',
    sortOrder: 10
  },
  {
    id: '11',
    name: 'Shoes & Bags',
    slug: 'shoes-bags',
    description: 'Footwear, handbags, backpacks, travel bags, and fashion accessories.',
    iconKey: 'shopping-bag',
    sortOrder: 11
  },
  {
    id: '12',
    name: 'Health & Wellness',
    slug: 'health-wellness',
    description: 'Wellness products, personal care tools, fitness care, and health essentials.',
    iconKey: 'heart-pulse',
    sortOrder: 12
  },
  {
    id: '13',
    name: 'Baby & Kids',
    slug: 'baby-kids',
    description: 'Baby care, children clothing, toys, school items, and family essentials.',
    iconKey: 'baby',
    sortOrder: 13
  },
  {
    id: '14',
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Sports gear, gym equipment, activewear, and outdoor fitness products.',
    iconKey: 'dumbbell',
    sortOrder: 14
  },
  {
    id: '15',
    name: 'Automotive & Motorcycle',
    slug: 'automotive-motorcycle',
    description: 'Car accessories, motorcycle parts, maintenance tools, and vehicle essentials.',
    iconKey: 'car',
    sortOrder: 15
  },
  {
    id: '16',
    name: 'Tools & Hardware',
    slug: 'tools-hardware',
    description: 'Hand tools, power tools, fixtures, repairs, and hardware supplies.',
    iconKey: 'wrench',
    sortOrder: 16
  },
  {
    id: '17',
    name: 'Construction & Building Materials',
    slug: 'construction-building-materials',
    description: 'Building supplies, finishing materials, safety gear, and construction essentials.',
    iconKey: 'hard-hat',
    sortOrder: 17
  },
  {
    id: '18',
    name: 'Food & Beverages',
    slug: 'food-beverages',
    description: 'Packaged foods, drinks, snacks, tea, coffee, and local food products.',
    iconKey: 'utensils',
    sortOrder: 18
  },
  {
    id: '19',
    name: 'Security & CCTV',
    slug: 'security-cctv',
    description: 'CCTV cameras, access control, alarms, locks, and security systems.',
    iconKey: 'shield-check',
    sortOrder: 19
  },
  {
    id: '20',
    name: 'Networking & Internet Equipment',
    slug: 'networking-internet-equipment',
    description: 'Routers, switches, access points, cables, and connectivity equipment.',
    iconKey: 'wifi',
    sortOrder: 20
  },
  {
    id: '21',
    name: 'Gaming & Entertainment',
    slug: 'gaming-entertainment',
    description: 'Consoles, gaming accessories, audio devices, entertainment and media products.',
    iconKey: 'gamepad-2',
    sortOrder: 21
  },
  {
    id: '22',
    name: 'Agriculture & Farming',
    slug: 'agriculture-farming',
    description: 'Farming tools, seeds, inputs, irrigation, and agri-business supplies.',
    iconKey: 'sprout',
    sortOrder: 22
  },
  {
    id: '23',
    name: 'Industrial & Business Supplies',
    slug: 'industrial-business-supplies',
    description: 'Bulk supplies, professional equipment, business tools, and industrial essentials.',
    iconKey: 'briefcase-business',
    sortOrder: 23
  },
  {
    id: '24',
    name: 'Services',
    slug: 'services',
    description: 'Professional, repair, installation, delivery, and business support services.',
    iconKey: 'monitor',
    sortOrder: 24
  },
  {
    id: '25',
    name: 'Deals & Promotions',
    slug: 'deals-promotions',
    description: 'Limited offers, discounts, bundles, and seasonal promotional products.',
    iconKey: 'badge-percent',
    sortOrder: 25
  },
  {
    id: '26',
    name: 'Printers & Office Machines',
    slug: 'printers-office-machines',
    description: 'Printers, scanners, copiers, shredders, cartridges, toners, and office machines.',
    iconKey: 'printer',
    sortOrder: 26
  },
  {
    id: '27',
    name: 'Furniture',
    slug: 'furniture',
    description: 'Office desks, chairs, shelves, home furniture, and interior essentials.',
    iconKey: 'sofa',
    sortOrder: 27
  }
];

export const getCategorySeedMap = () =>
  new Map(DEFAULT_CATEGORY_SEEDS.map((category) => [category.id, category]));
