import { loadEnv, getDatabaseConfig } from '../backend/env.js';
import { uploadAsset } from '../backend/storageService.js';
import { readDb, writeDb } from '../backend/db.js';

const isDataUrl = (value = '') => String(value || '').startsWith('data:');
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const normalizeProductImages = async (product) => {
  const nextImages = [];
  const rawImages = Array.isArray(product.images) ? product.images : [];

  for (let index = 0; index < rawImages.length; index += 1) {
    const entry = rawImages[index];
    if (!isDataUrl(entry)) {
      nextImages.push(entry);
      continue;
    }

    const uploaded = await uploadAsset({
      dataUrl: entry,
      fileName: `${product.id}-gallery-${index + 1}`,
      folder: 'e-malla/products',
      allowedMimeTypes: ALLOWED_IMAGE_TYPES
    });
    nextImages.push(uploaded.url);
  }

  let nextPrimaryImage = product.image || '';
  if (isDataUrl(product.image)) {
    const uploaded = await uploadAsset({
      dataUrl: product.image,
      fileName: `${product.id}-primary`,
      folder: 'e-malla/products',
      allowedMimeTypes: ALLOWED_IMAGE_TYPES
    });
    nextPrimaryImage = uploaded.url;
  }

  const normalizedImages = Array.from(new Set([nextPrimaryImage, ...nextImages].filter(Boolean)));

  return {
    image: nextPrimaryImage || null,
    images: normalizedImages
  };
};

const migrateJsonSnapshot = async () => {
  const snapshot = await readDb();
  const products = Array.isArray(snapshot.products) ? snapshot.products : [];
  let updatedCount = 0;

  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    const containsInlineImage =
      isDataUrl(product?.image) ||
      (Array.isArray(product?.images) && product.images.some((entry) => isDataUrl(entry)));

    if (!containsInlineImage) {
      continue;
    }

    const normalized = await normalizeProductImages(product);
    products[index] = {
      ...product,
      image: normalized.image || '',
      images: normalized.images,
      updatedAt: new Date().toISOString()
    };
    updatedCount += 1;
  }

  if (updatedCount > 0) {
    snapshot.products = products;
    await writeDb(snapshot);
  }

  return updatedCount;
};

const migratePostgres = async (databaseUrl) => {
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query(
      'SELECT id, name, image, images FROM products WHERE COALESCE(image, \'\') LIKE \'data:%\' OR COALESCE(images::text, \'\') LIKE \'%data:%\' ORDER BY created_at DESC'
    );

    let updatedCount = 0;

    for (const row of result.rows) {
      const normalized = await normalizeProductImages(row);

      await pool.query(
        'UPDATE products SET image = $2, images = $3::jsonb, updated_at = NOW() WHERE id = $1',
        [row.id, normalized.image || null, JSON.stringify(normalized.images)]
      );
      updatedCount += 1;
    }

    return updatedCount;
  } finally {
    await pool.end();
  }
};

const main = async () => {
  await loadEnv();
  const config = getDatabaseConfig();
  const migratedTargets = [];

  const snapshotUpdates = await migrateJsonSnapshot();
  migratedTargets.push(`JSON snapshot: ${snapshotUpdates}`);

  if (config.provider === 'postgres' && config.databaseUrl) {
    const postgresUpdates = await migratePostgres(config.databaseUrl);
    migratedTargets.push(`Postgres: ${postgresUpdates}`);
  }

  console.log(`Migrated inline product images to file URLs. ${migratedTargets.join(' | ')}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
