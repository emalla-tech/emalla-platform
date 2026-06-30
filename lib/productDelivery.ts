import { Product } from '../types';

export const PRODUCT_FULFILLMENT_OPTIONS = [
  {
    value: 'ready_stock',
    label: 'Ready stock',
    description: 'Available locally and ready for seller dispatch.'
  },
  {
    value: 'imported_on_demand',
    label: 'Imported on demand',
    description: 'Sourced from abroad after the customer places an order.'
  },
  {
    value: 'preorder',
    label: 'Pre-order',
    description: 'Reserved in advance for a future stock arrival.'
  }
] as const;

export const getProductDeliveryEstimate = (product: Pick<Product, 'deliveryMinDays' | 'deliveryMaxDays'>) => {
  const minDays = Number(product.deliveryMinDays);
  const maxDays = Number(product.deliveryMaxDays);
  const configured =
    Number.isInteger(minDays) &&
    Number.isInteger(maxDays) &&
    minDays >= 1 &&
    maxDays >= minDays;

  return {
    configured,
    minDays: configured ? minDays : null,
    maxDays: configured ? maxDays : null,
    label: configured
      ? minDays === maxDays
        ? `${minDays} business day${minDays === 1 ? '' : 's'}`
        : `${minDays}-${maxDays} business days`
      : 'Timing confirmed after order review'
  };
};

export const getProductFulfillmentLabel = (fulfillmentType: Product['fulfillmentType']) =>
  PRODUCT_FULFILLMENT_OPTIONS.find((option) => option.value === fulfillmentType)?.label || 'Seller fulfilled';

export const getProductDeliveryMessage = (product: Product) => {
  if (product.deliveryNote?.trim()) {
    return product.deliveryNote.trim();
  }

  if (product.fulfillmentType === 'imported_on_demand') {
    return 'This product is sourced from abroad after your order is confirmed.';
  }

  if (product.fulfillmentType === 'preorder') {
    return 'This product is reserved before its next stock arrival.';
  }

  if (product.fulfillmentType === 'ready_stock') {
    return 'Available locally and ready for seller dispatch.';
  }

  return 'The seller will confirm the delivery timeline after order review.';
};
