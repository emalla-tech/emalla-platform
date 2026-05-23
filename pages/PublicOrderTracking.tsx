import React from 'react';
import { useSearchParams } from 'react-router-dom';
import OrderTracking from './Dashboard/OrderTracking';

const PublicOrderTracking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');

  return <OrderTracking guestAccess={{ email: email || '', phone: phone || '' }} />;
};

export default PublicOrderTracking;
