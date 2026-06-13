import React from 'react';
import { Handshake } from 'lucide-react';
import LegalPage from '../components/legal/LegalPage';

const SellerAgreement: React.FC = () => (
  <LegalPage
    eyebrow="Merchant Standards"
    title="Seller Agreement"
    description="The standards every approved seller agrees to follow when listing and fulfilling products on E-Malla Rwanda."
    icon={Handshake}
    sections={[
      {
        title: 'Seller eligibility',
        text: 'Sellers must provide accurate identity and business information, complete the approval process and keep account information current.',
      },
      {
        title: 'Product listings',
        text: 'Every listing must be accurate, lawful and suitable for sale in Rwanda.',
        items: ['Use truthful titles, images, descriptions, specifications, prices and stock levels.', 'Do not list counterfeit, prohibited, unsafe or rights-infringing products.', 'Clearly disclose product condition, warranty and relevant limitations.'],
      },
      {
        title: 'Order fulfilment',
        text: 'Sellers must respond to incoming orders promptly, prepare the correct item safely and update order status accurately.',
        items: ['Do not confirm unavailable inventory.', 'Package products appropriately for assigned delivery.', 'Cooperate with riders and customer-support investigations.'],
      },
      {
        title: 'Pricing, fees and payouts',
        text: 'Sellers are responsible for accurate pricing and applicable obligations. Platform fees, payout timing and adjustments are shown in seller tools or agreed commercial terms.',
      },
      {
        title: 'Returns, refunds and customer care',
        text: 'Sellers must cooperate with eligible returns, refunds and disputes and must communicate professionally with customers.',
      },
      {
        title: 'Enforcement and termination',
        text: 'E-Malla may pause listings, withhold disputed payouts, restrict or terminate seller access when necessary to protect customers, comply with law or enforce marketplace standards.',
      },
    ]}
  />
);

export default SellerAgreement;
