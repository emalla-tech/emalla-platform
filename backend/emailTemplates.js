import { getAppConfig } from './env.js';
import { createEmailHtml } from './emailService.js';

const EMAIL_TEMPLATE_NAMES = [
  'account_verification',
  'welcome_email',
  'order_confirmation',
  'seller_order_notification',
  'rider_delivery_assignment',
  'support_ticket_confirmation',
  'password_reset'
];

const formatMoney = (value) => `RWF ${Number(value || 0).toLocaleString()}`;

const normalizePublicRoute = (path = '') => {
  const base = String(getAppConfig().publicAppUrl || 'http://127.0.0.1:3000').replace(/\/#?$/, '');
  const normalizedPath = String(path || '').replace(/^#?\/?/, '');
  return normalizedPath ? `${base}/${normalizedPath}` : base;
};

const createSections = (entries) =>
  entries.filter((entry) => entry && entry.label && entry.value !== undefined && entry.value !== null && entry.value !== '');

const getSupportPayload = () => ({
  email: 'support@emallarwanda.com',
  url: normalizePublicRoute('/contact')
});

const renderTemplate = ({ subject, title, intro, sections, closing, bodyLines, replyTo, highlights, primaryAction, support }) => ({
  subject,
  body: bodyLines.filter(Boolean).join('\n'),
  html: createEmailHtml({
    title,
    intro,
    sections,
    closing,
    highlights,
    primaryAction,
    support
  }),
  replyTo
});

const renderAccountVerificationEmail = ({ name, email, role, username }) => {
  const loginUrl = normalizePublicRoute('/login');
  const sections = createSections([
    { label: 'Name', value: name || 'E-Malla User' },
    { label: 'Email', value: email || 'Not provided' },
    { label: 'Role', value: role || 'CUSTOMER' },
    { label: 'Username', value: username || 'Assigned in account' },
    { label: 'Login URL', value: loginUrl }
  ]);

  return renderTemplate({
    subject: 'Your E-Malla Account Is Ready',
    title: 'Account verified and ready',
    intro: `Muraho ${name || 'there'}. Account yawe ya E-Malla yamaze gufungurwa neza kandi ushobora guhita winjira kuri platform.`,
    sections,
    closing: 'Niba hari ikibazo cyo kwinjira, twandikire kandi team ya E-Malla iragufasha vuba.',
    bodyLines: [
      `Hello ${name || 'there'},`,
      'Your E-Malla account is active and ready to use.',
      `Email: ${email || 'Not provided'}`,
      `Role: ${role || 'CUSTOMER'}`,
      `Username: ${username || 'Assigned in account'}`,
      `Login: ${loginUrl}`
    ]
  });
};

const renderWelcomeEmail = ({ name, email, role, username }) => {
  const homeUrl = normalizePublicRoute('/');
  const sections = createSections([
    { label: 'Name', value: name || 'E-Malla User' },
    { label: 'Email', value: email || 'Not provided' },
    { label: 'Role', value: role || 'CUSTOMER' },
    { label: 'Username', value: username || 'Assigned in account' },
    { label: 'Website', value: homeUrl }
  ]);

  return renderTemplate({
    subject: 'Welcome to E-Malla Rwanda',
    title: 'Welcome to E-Malla Rwanda',
    intro: `Muraho ${name || 'there'}. Murakaza neza kuri E-Malla Rwanda. Ubu ushobora guhaha, gukurikirana orders, no gukoresha services za platform mu buryo busanzwe.`,
    sections,
    closing: 'Murakoze kwizera E-Malla Rwanda. Turifuza ko ubona experience nziza kandi yizewe.',
    bodyLines: [
      `Hello ${name || 'there'},`,
      'Welcome to E-Malla Rwanda.',
      `Email: ${email || 'Not provided'}`,
      `Role: ${role || 'CUSTOMER'}`,
      `Username: ${username || 'Assigned in account'}`,
      `Website: ${homeUrl}`
    ]
  });
};

const renderOrderConfirmationEmail = ({ customerName, orderNumber, totalAmount, paymentMethod, address, phone, txRef, merchantName, itemCount, trackingUrl }) => {
  const ordersUrl = trackingUrl || normalizePublicRoute('/buyer/orders');
  const sections = createSections([
    { label: 'Order', value: orderNumber || 'Pending' },
    { label: 'Payment Method', value: paymentMethod || 'Not specified' },
    { label: 'Items', value: itemCount ? `${itemCount} item(s)` : undefined },
    { label: 'Merchant', value: merchantName || 'E-Malla Rwanda' },
    { label: 'Delivery Address', value: address || 'To be confirmed' },
    { label: 'Phone', value: phone || undefined },
    { label: 'Reference', value: txRef || undefined },
    { label: 'Track Order', value: ordersUrl }
  ]);
  const highlights = [
    { label: 'Order Total', value: formatMoney(totalAmount), accentBg: '#ecfdf5', accentBorder: '#a7f3d0', labelColor: '#047857', valueColor: '#065f46' },
    { label: 'Status', value: 'Confirmed', accentBg: '#fff7ed', accentBorder: '#fdba74', labelColor: '#c2410c', valueColor: '#9a3412' }
  ];

  return renderTemplate({
    subject: `Order Confirmation - ${orderNumber || 'E-Malla'}`,
    title: 'Order confirmed',
    intro: `Muraho ${customerName || 'there'}. Order yawe yemejwe neza kuri E-Malla Rwanda kandi team yacu yatangiye kuyikurikirana.`,
    sections,
    closing: 'Ushobora gukurikirana status ya order yawe uko ihinduka muri buyer hub cyangwa kuri page ya orders.',
    highlights,
    primaryAction: { label: 'Track Order', url: ordersUrl },
    support: getSupportPayload(),
    bodyLines: [
      `Hello ${customerName || 'there'},`,
      `Your order ${orderNumber || ''} has been confirmed.`,
      `Amount: ${formatMoney(totalAmount)}`,
      `Payment method: ${paymentMethod || 'Not specified'}`,
      `Delivery address: ${address || 'To be confirmed'}`,
      `Track order: ${ordersUrl}`
    ]
  });
};

const renderSellerOrderNotificationEmail = ({ merchantName, orderNumber, totalAmount, paymentMethod, customerName }) => {
  const sellerOrdersUrl = normalizePublicRoute('/seller');
  const sections = createSections([
    { label: 'Order', value: orderNumber || 'Pending' },
    { label: 'Payment Method', value: paymentMethod || 'Not specified' },
    { label: 'Customer', value: customerName || 'Buyer' },
    { label: 'Seller Hub', value: sellerOrdersUrl }
  ]);
  const highlights = [
    { label: 'New Order Value', value: formatMoney(totalAmount), accentBg: '#eff6ff', accentBorder: '#bfdbfe', labelColor: '#1d4ed8', valueColor: '#1e3a8a' },
    { label: 'Status', value: 'Action Required', accentBg: '#fff7ed', accentBorder: '#fdba74', labelColor: '#c2410c', valueColor: '#9a3412' }
  ];

  return renderTemplate({
    subject: `New Order for Your Store - ${orderNumber || 'E-Malla'}`,
    title: 'New order received',
    intro: `Muraho ${merchantName || 'Seller'}. Hari order nshya yemejwe kuri store yawe kandi ushobora gutangira preparation yayo.`,
    sections,
    closing: 'Jya muri Seller Hub urebe details za order, ubone gutangira packing no delivery handoff.',
    highlights,
    primaryAction: { label: 'Open Seller Hub', url: sellerOrdersUrl },
    support: getSupportPayload(),
    bodyLines: [
      `Hello ${merchantName || 'Seller'},`,
      `A new order ${orderNumber || ''} has been confirmed for your store.`,
      `Amount: ${formatMoney(totalAmount)}`,
      `Payment method: ${paymentMethod || 'Not specified'}`,
      `Customer: ${customerName || 'Buyer'}`,
      `Seller Hub: ${sellerOrdersUrl}`
    ]
  });
};

const renderRiderDeliveryAssignmentEmail = ({ riderName, orderNumber, customerName, address, phone }) => {
  const riderHubUrl = normalizePublicRoute('/rider');
  const sections = createSections([
    { label: 'Order', value: orderNumber || 'Pending' },
    { label: 'Customer', value: customerName || 'Buyer' },
    { label: 'Address', value: address || 'To be confirmed' },
    { label: 'Phone', value: phone || 'Not provided' },
    { label: 'Rider Hub', value: riderHubUrl }
  ]);

  return renderTemplate({
    subject: `New Delivery Assignment - ${orderNumber || 'E-Malla'}`,
    title: 'Delivery assigned',
    intro: `Muraho ${riderName || 'Rider'}. Waherewe delivery nshya kuri E-Malla Rwanda. Reba details zayo maze utangire workflow ya pickup.`,
    sections,
    closing: 'Jya muri Rider Hub urebe assignment yawe, uhite ukurikiza intambwe za pickup na delivery.',
    primaryAction: { label: 'Open Rider Hub', url: riderHubUrl },
    support: getSupportPayload(),
    bodyLines: [
      `Hello ${riderName || 'Rider'},`,
      `You have been assigned delivery ${orderNumber || ''}.`,
      `Customer: ${customerName || 'Buyer'}`,
      `Address: ${address || 'To be confirmed'}`,
      `Phone: ${phone || 'Not provided'}`,
      `Rider Hub: ${riderHubUrl}`
    ]
  });
};

const renderSupportTicketConfirmationEmail = ({ name, email, subject }) => {
  const supportUrl = normalizePublicRoute('/contact');
  const sections = createSections([
    { label: 'Name', value: name || 'Visitor' },
    { label: 'Email', value: email || 'Not provided' },
    { label: 'Subject', value: subject || 'Support request' },
    { label: 'Support Page', value: supportUrl }
  ]);

  return renderTemplate({
    subject: 'E-Malla Support Request Received',
    title: 'Support request received',
    intro: `Muraho ${name || 'there'}. Twakiriye support request yawe kandi team yacu iri kuyisuzuma.`,
    sections,
    closing: 'Turagusubiza vuba bishoboka. Ushobora no kongera kudusangiza andi makuru kuri page ya contact igihe bibaye ngombwa.',
    bodyLines: [
      `Hello ${name || 'there'},`,
      'We received your support request.',
      `Email: ${email || 'Not provided'}`,
      `Subject: ${subject || 'Support request'}`,
      `Support page: ${supportUrl}`
    ]
  });
};

const renderPasswordResetEmail = ({ name, email, role, resetUrl }) => {
  const sections = createSections([
    { label: 'Account', value: email || 'Not provided' },
    { label: 'Role', value: role || 'Unknown' },
    { label: 'Reset Link', value: resetUrl || normalizePublicRoute('/reset-password') }
  ]);

  return renderTemplate({
    subject: 'Reset Your E-Malla Password',
    title: 'Password reset request',
    intro: `Muraho ${name || email || 'there'}. Habaye request yo guhindura password ya account yawe ya E-Malla.`,
    sections,
    closing: 'Iyo atari wowe wabikoze, ushobora kwirengagiza iyi email. Reset link imara iminota 30 ikiri valid.',
    bodyLines: [
      `Hello ${name || email || 'there'},`,
      'A password reset was requested for your E-Malla account.',
      `Account: ${email || 'Not provided'}`,
      `Role: ${role || 'Unknown'}`,
      `Reset link: ${resetUrl || normalizePublicRoute('/reset-password')}`
    ]
  });
};

export const buildPlatformEmail = (templateName, payload = {}) => {
  switch (templateName) {
    case 'account_verification':
      return renderAccountVerificationEmail(payload);
    case 'welcome_email':
      return renderWelcomeEmail(payload);
    case 'order_confirmation':
      return renderOrderConfirmationEmail(payload);
    case 'seller_order_notification':
      return renderSellerOrderNotificationEmail(payload);
    case 'rider_delivery_assignment':
      return renderRiderDeliveryAssignmentEmail(payload);
    case 'support_ticket_confirmation':
      return renderSupportTicketConfirmationEmail(payload);
    case 'password_reset':
      return renderPasswordResetEmail(payload);
    default:
      throw new Error(`Unsupported email template: ${templateName}`);
  }
};

export const getPlatformEmailTemplateNames = () => [...EMAIL_TEMPLATE_NAMES];
