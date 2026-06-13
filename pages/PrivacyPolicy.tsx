import React from 'react';
import { LockKeyhole } from 'lucide-react';
import LegalPage from '../components/legal/LegalPage';

const PrivacyPolicy: React.FC = () => (
  <LegalPage
    eyebrow="Legal & Trust"
    title="Privacy Policy"
    description="How E-Malla Rwanda collects, uses, protects and shares information while operating the marketplace."
    icon={LockKeyhole}
    sections={[
      {
        title: 'Information we collect',
        text: 'We collect information needed to provide accounts, orders, deliveries, seller services, rider services and customer support.',
        items: ['Account and contact details such as name, email and phone number.', 'Order, payment method, delivery address and support request information.', 'Technical information required for security, reliability and fraud prevention.'],
      },
      {
        title: 'How information is used',
        text: 'Information is used only for legitimate marketplace operations and service improvement.',
        items: ['Process orders, payments and deliveries.', 'Send operational notifications and respond to support requests.', 'Protect users, investigate misuse and improve platform performance.'],
      },
      {
        title: 'Information sharing',
        text: 'We share only the information reasonably necessary for an order or service to be completed.',
        items: ['Relevant order details may be shared with the assigned seller and rider.', 'Approved service providers may process infrastructure, email, storage or payments for E-Malla.', 'Information may be disclosed when required by applicable Rwandan law.'],
      },
      {
        title: 'Data protection and retention',
        text: 'We use access controls, secure infrastructure and monitoring to protect information. Records are retained only as long as reasonably necessary for operations, legal obligations and dispute resolution.',
      },
      {
        title: 'Your choices and rights',
        text: 'You may request access, correction or deletion of eligible personal information and may manage optional cookie preferences at any time.',
      },
      {
        title: 'Contact',
        text: 'For privacy questions or requests, contact support@emallarwanda.com or use the Contact Us page.',
      },
    ]}
  />
);

export default PrivacyPolicy;
