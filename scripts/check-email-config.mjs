import { loadEnv, getAppConfig, getEmailConfig } from '../backend/env.js';
import { getEmailDeliveryStatus } from '../backend/emailService.js';
import { buildPlatformEmail, getPlatformEmailTemplateNames } from '../backend/emailTemplates.js';

const samplePayloads = {
  account_verification: {
    name: 'Demo Buyer',
    email: 'buyer@example.com',
    role: 'CUSTOMER',
    username: 'demo.buyer'
  },
  welcome_email: {
    name: 'Demo Buyer',
    email: 'buyer@example.com',
    role: 'CUSTOMER',
    username: 'demo.buyer'
  },
  order_confirmation: {
    customerName: 'Demo Buyer',
    orderNumber: 'EM-2026-0001',
    totalAmount: 32500,
    paymentMethod: 'CASH_ON_DELIVERY',
    address: 'Kigali, Gasabo, Remera'
  },
  seller_order_notification: {
    merchantName: 'Demo Seller',
    orderNumber: 'EM-2026-0001',
    totalAmount: 32500,
    paymentMethod: 'MOMO',
    customerName: 'Demo Buyer'
  },
  rider_delivery_assignment: {
    riderName: 'Demo Rider',
    orderNumber: 'EM-2026-0001',
    customerName: 'Demo Buyer',
    address: 'Kigali, Gasabo, Remera',
    phone: '+250788000000'
  },
  support_ticket_confirmation: {
    name: 'Demo Visitor',
    email: 'visitor@example.com',
    subject: 'Need help with checkout'
  },
  password_reset: {
    name: 'Demo Buyer',
    email: 'buyer@example.com',
    role: 'CUSTOMER',
    resetUrl: 'https://example.com/#/reset-password?token=demo-token'
  }
};

const isPlaceholderValue = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || normalized.includes('replace_with') || normalized.includes('yourdomain.com');
};

const main = async () => {
  await loadEnv();
  const emailConfig = getEmailConfig();
  const appConfig = getAppConfig();
  const status = getEmailDeliveryStatus();
  const templates = getPlatformEmailTemplateNames();

  const renderSummary = templates.map((templateName) => {
    const rendered = buildPlatformEmail(templateName, samplePayloads[templateName] || {});
    return {
      templateName,
      subject: rendered.subject,
      hasText: Boolean(rendered.body),
      hasHtml: Boolean(rendered.html)
    };
  });

  console.log('E-Malla Rwanda email configuration check');
  console.log(`Provider: ${emailConfig.provider}`);
  console.log(`From email configured: ${isPlaceholderValue(emailConfig.fromEmail) ? 'no' : 'yes'}`);
  console.log(`Resend API key configured: ${isPlaceholderValue(emailConfig.resendApiKey) ? 'no' : 'yes'}`);
  console.log(`Public app URL configured: ${isPlaceholderValue(appConfig.publicAppUrl) ? 'no' : 'yes'}`);
  console.log(`Live delivery ready: ${status.liveDeliveryReady ? 'yes' : 'no'}`);
  console.log('');

  if (status.issues.length > 0) {
    console.log('Readiness issues:');
    status.issues.forEach((issue) => console.log(`- ${issue}`));
    console.log('');
  }

  console.log('Template render check:');
  renderSummary.forEach((entry) => {
    console.log(`- ${entry.templateName}: subject ok, text=${entry.hasText ? 'yes' : 'no'}, html=${entry.hasHtml ? 'yes' : 'no'}`);
  });

  if (emailConfig.provider === 'resend') {
    if (status.liveDeliveryReady && !isPlaceholderValue(appConfig.publicAppUrl)) {
      console.log('');
      console.log('Production email configuration is ready.');
      return;
    }

    console.error('');
    console.error('Resend production email configuration is not ready yet.');
    process.exit(1);
  }

  console.log('');
  console.log('Development fallback mode is active. Emails will stay in local logs.');
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
