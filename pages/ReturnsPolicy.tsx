import React from 'react';
import { RotateCcw } from 'lucide-react';
import LegalPage from '../components/legal/LegalPage';

const ReturnsPolicy: React.FC = () => (
  <LegalPage
    eyebrow="Customer Protection"
    title="Returns & Refunds Policy"
    description="Clear rules for requesting a return or refund when an order is defective, damaged or materially different from its listing."
    icon={RotateCcw}
    sections={[
      {
        title: 'Return eligibility',
        text: 'Eligible returns should normally be requested within 7 days after delivery through the order support flow.',
        items: ['The item arrived damaged, defective or materially different from the listing.', 'The item is unused, with original accessories and packaging where reasonably possible.', 'Proof of order and a clear explanation or supporting images may be requested.'],
      },
      {
        title: 'Items that may not be returnable',
        text: 'Certain items may be excluded for hygiene, safety, customization or licensing reasons unless they arrived defective or were misrepresented.',
        items: ['Opened personal-care or hygiene-sensitive products.', 'Customized, perishable or digitally delivered items.', 'Items damaged through misuse after delivery.'],
      },
      {
        title: 'How to request help',
        text: 'Open the relevant order, select Return or Refund Help, and submit the reason with supporting details. Guest customers may contact support with their order reference and checkout email.',
      },
      {
        title: 'Review and collection',
        text: 'E-Malla and the seller may review the request and arrange item inspection, pickup or return delivery before approval.',
      },
      {
        title: 'Refund processing',
        text: 'Approved refunds are returned through an available and appropriate payment method. Processing time may vary depending on the payment provider and investigation required.',
      },
      {
        title: 'Disputes',
        text: 'If a customer and seller cannot resolve a matter, E-Malla may review available order records and make a marketplace decision consistent with this policy and applicable law.',
      },
    ]}
  />
);

export default ReturnsPolicy;
