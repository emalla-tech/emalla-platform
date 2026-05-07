export const DEFAULT_CATEGORY_SEEDS = [
  {
    id: '1',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Phones, laptops, accessories, and connected devices.',
    iconKey: 'smartphone',
    sortOrder: 1
  },
  {
    id: '2',
    name: 'Fashion',
    slug: 'fashion',
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
    name: 'Groceries',
    slug: 'groceries',
    description: 'Daily food, beverages, and household consumables.',
    iconKey: 'apple',
    sortOrder: 4
  },
  {
    id: '5',
    name: 'Beauty',
    slug: 'beauty',
    description: 'Skincare, cosmetics, fragrance, and personal care products.',
    iconKey: 'sparkles',
    sortOrder: 5
  },
  {
    id: '6',
    name: 'Books',
    slug: 'books',
    description: 'Educational books, literature, stationery, and study materials.',
    iconKey: 'book',
    sortOrder: 6
  }
];

export const getCategorySeedMap = () =>
  new Map(DEFAULT_CATEGORY_SEEDS.map((category) => [category.id, category]));
