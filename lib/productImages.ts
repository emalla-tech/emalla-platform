import type { SyntheticEvent } from 'react';

const CATEGORY_FALLBACKS: Record<string, string> = {
  '1': '/catalog/electronics.svg',
  '2': '/catalog/fashion.svg',
  '3': '/catalog/home.svg',
  '4': '/catalog/groceries.svg',
  '5': '/catalog/beauty.svg',
  '6': '/catalog/books.svg'
};

const normalizeImage = (value?: string | null) => {
  const next = String(value || '').trim();
  return next.length > 0 ? next : null;
};

const isCatalogPlaceholder = (value?: string | null) => /^\/catalog\/.+\.svg$/i.test(String(value || '').trim());

export const getCategoryFallbackImage = (category?: string | null) =>
  CATEGORY_FALLBACKS[String(category || '1')] || CATEGORY_FALLBACKS['1'];

export const getProductPrimaryImage = (product?: {
  image?: string | null;
  images?: string[] | null;
  category?: string | null;
}) => {
  const primaryImage = normalizeImage(product?.image);
  const gallery = ((product?.images || []).map((entry) => normalizeImage(entry)).filter(Boolean) as string[]);
  const galleryRealImage = gallery.find((entry) => !isCatalogPlaceholder(entry));

  if (primaryImage && !isCatalogPlaceholder(primaryImage)) {
    return primaryImage;
  }

  if (galleryRealImage) {
    return galleryRealImage;
  }

  return primaryImage || gallery[0] || getCategoryFallbackImage(product?.category);
};

export const getProductGalleryImages = (product?: {
  image?: string | null;
  images?: string[] | null;
  category?: string | null;
}) => {
  const primary = getProductPrimaryImage(product);
  const gallery = (product?.images || [])
    .map((entry) => normalizeImage(entry))
    .filter(Boolean) as string[];

  return Array.from(new Set([primary, ...gallery].filter(Boolean)));
};

export const handleProductImageError = (
  event: SyntheticEvent<HTMLImageElement>,
  category?: string | null
) => {
  const fallback = getCategoryFallbackImage(category);
  if (event.currentTarget.src.endsWith(fallback)) return;
  event.currentTarget.src = fallback;
};
