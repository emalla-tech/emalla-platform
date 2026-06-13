import React from 'react';
import { Building2 } from 'lucide-react';
import LegalPage from '../components/legal/LegalPage';

const CompanyInformation: React.FC = () => (
  <LegalPage
    eyebrow="Company Information"
    title="About the Platform Operator"
    description="E-Malla Rwanda is a digital marketplace powered and operated by E-Malla Technologies in Kigali, Rwanda."
    icon={Building2}
    sections={[
      {
        title: 'Platform',
        text: 'E-Malla Rwanda connects customers, approved sellers and delivery partners through one digital marketplace.',
      },
      {
        title: 'Operator',
        text: 'The platform is powered and operated by E-Malla Technologies.',
      },
      {
        title: 'Head office',
        text: 'Near Inkurunziza Church, behind Bank of Kigali Headquarters, KN 84 St Road, Kigali, Rwanda.',
      },
      {
        title: 'Official contacts',
        text: 'General enquiries: info@emallarwanda.com. Customer and order support: support@emallarwanda.com.',
      },
      {
        title: 'Public website',
        text: 'The canonical public website is https://www.emallarwanda.com.',
      },
    ]}
  />
);

export default CompanyInformation;
