BEGIN;

INSERT INTO categories (id, name, slug, description, icon_key, sort_order, is_active)
VALUES
  ('1', 'Electronics', 'electronics', 'Phones, laptops, accessories, and connected devices.', 'smartphone', 1, true),
  ('2', 'Fashion', 'fashion', 'Clothing, shoes, bags, and lifestyle wear.', 'shirt', 2, true),
  ('3', 'Home & Living', 'home-living', 'Furniture, decor, kitchenware, and essentials for the home.', 'home', 3, true),
  ('4', 'Groceries', 'groceries', 'Daily food, beverages, and household consumables.', 'apple', 4, true),
  ('5', 'Beauty', 'beauty', 'Skincare, cosmetics, fragrance, and personal care products.', 'sparkles', 5, true),
  ('6', 'Books', 'books', 'Educational books, literature, stationery, and study materials.', 'book', 6, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon_key = EXCLUDED.icon_key,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO admin_settings (id, preferences, category_commission_rates, updated_at)
VALUES ('platform', '{}'::jsonb, '{}'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;
