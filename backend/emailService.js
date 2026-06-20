import { getEmailConfig } from './env.js';

const buildFromHeader = (config) => `${config.fromName} <${config.fromEmail}>`;

const isPlaceholderValue = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || normalized.includes('replace_with') || normalized.includes('yourdomain.com');
};

export const getEmailDeliveryStatus = () => {
  const config = getEmailConfig();
  const issues = [];

  if (config.provider !== 'resend') {
    issues.push('EMAIL_PROVIDER is not set to resend.');
  }

  if (config.provider === 'resend' && isPlaceholderValue(config.resendApiKey)) {
    issues.push('RESEND_API_KEY is missing or still a placeholder.');
  }

  if (config.provider === 'resend' && isPlaceholderValue(config.fromEmail)) {
    issues.push('RESEND_FROM_EMAIL or EMAIL_FROM must be a verified sender address.');
  }

  return {
    provider: config.provider,
    liveDeliveryReady: config.provider === 'resend' && issues.length === 0,
    fromEmail: config.fromEmail,
    fromName: config.fromName,
    adminAlertEmail: config.adminAlertEmail,
    issues
  };
};

const sendWithResend = async (email, config) => {
  const replyTo = email.replyTo || email.reply_to || undefined;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json'
    },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      from: buildFromHeader(config),
      to: Array.isArray(email.to) ? email.to : [email.to],
      subject: email.subject,
      text: email.body,
      html: email.html || undefined,
      reply_to: replyTo
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend API error: ${response.status} ${message}`);
  }

  return response.json();
};

export const deliverEmail = async (email) => {
  const config = getEmailConfig();
  const readiness = getEmailDeliveryStatus();

  if (readiness.liveDeliveryReady) {
    const providerResponse = await sendWithResend(email, config);
    return {
      status: 'sent',
      provider: 'resend',
      providerMessageId: providerResponse?.id || null
    };
  }

  return {
    status: 'logged',
    provider: 'log',
    providerMessageId: null,
    note:
      config.provider === 'resend'
        ? `Resend not ready: ${readiness.issues.join(' ')} Email kept in local log only.`
        : 'EMAIL_PROVIDER not configured for live delivery, email kept in local log only.'
  };
};

const escapeHtml = (value = '') =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const normalizeEmailItems = (items = []) =>
  items.filter((item) => item && item.label && item.value !== undefined && item.value !== null && item.value !== '');

const renderHighlights = (highlights = []) => {
  const safeHighlights = normalizeEmailItems(highlights);
  if (!safeHighlights.length) return '';

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 12px;width:100%;margin:0 0 18px;">
      ${safeHighlights.map((item) => `
        <tr>
          <td style="background:${item.accentBg || '#fff7ed'};border:1px solid ${item.accentBorder || '#fed7aa'};border-radius:16px;padding:16px;">
            <div style="font-size:11px;font-weight:800;color:${item.labelColor || '#9a3412'};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">${escapeHtml(item.label)}</div>
            <div style="font-size:24px;font-weight:900;color:${item.valueColor || '#111827'};line-height:1.25;">${escapeHtml(item.value)}</div>
          </td>
        </tr>
      `).join('')}
    </table>
  `;
};

const renderSections = (sections = []) => {
  const safeSections = normalizeEmailItems(sections);
  if (!safeSections.length) return '';

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;width:100%;margin:0;">
      ${safeSections.map((section) => `
        <tr>
          <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:14px 16px;">
            <div style="font-size:11px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">
              ${escapeHtml(section.label)}
            </div>
            <div style="font-size:15px;font-weight:800;color:#111827;line-height:1.55;word-break:break-word;">
              ${escapeHtml(section.value)}
            </div>
          </td>
        </tr>
      `).join('')}
    </table>
  `;
};

export const createEmailHtml = ({ title, intro, sections = [], closing, highlights = [], primaryAction = null, support = null }) => {
  const safeTitle = escapeHtml(title || 'E-Malla Rwanda Update');
  const safeIntro = escapeHtml(intro || '');
  const safeClosing = escapeHtml(closing || 'Thank you for using E-Malla Rwanda.');
  const supportEmail = support?.email ? escapeHtml(support.email) : '';
  const supportUrl = support?.url ? escapeHtml(support.url) : '';
  const actionUrl = primaryAction?.url ? escapeHtml(primaryAction.url) : '';
  const actionLabel = primaryAction?.label ? escapeHtml(primaryAction.label) : '';

  return `
    <!doctype html>
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeTitle}</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f4f6;color:#111827;-webkit-text-size-adjust:100%;text-size-adjust:100%;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;background:#f3f4f6;">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e5e7eb;border-radius:22px;overflow:hidden;font-family:Segoe UI,Arial,sans-serif;">
                <tr>
                  <td style="padding:22px 24px;background:#111827;color:#ffffff;">
                    <div style="font-size:24px;line-height:1.2;font-weight:900;">E-<span style="color:#f97316;">Malla</span> Rwanda</div>
                    <div style="font-size:12px;line-height:1.5;color:#d1d5db;margin-top:6px;">Secure platform notification</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:26px 24px 24px;">
                    <h1 style="font-size:24px;line-height:1.25;margin:0 0 12px;font-weight:900;color:#111827;">${safeTitle}</h1>
                    <p style="font-size:15px;line-height:1.75;color:#4b5563;margin:0 0 18px;">${safeIntro}</p>
                    ${renderHighlights(highlights)}
                    ${renderSections(sections)}
                    ${
                      actionLabel && actionUrl
                        ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0 0;">
                            <tr>
                              <td style="background:#f97316;border-radius:14px;">
                                <a href="${actionUrl}" style="display:inline-block;color:#ffffff;text-decoration:none;font-size:14px;font-weight:900;padding:14px 22px;">
                                  ${actionLabel}
                                </a>
                              </td>
                            </tr>
                           </table>`
                        : ''
                    }
                    <p style="font-size:14px;line-height:1.75;color:#4b5563;margin:20px 0 0;">${safeClosing}</p>
                    ${
                      supportEmail || supportUrl
                        ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin-top:24px;border-top:1px solid #e5e7eb;">
                            <tr>
                              <td style="padding-top:18px;">
                                <div style="font-size:11px;font-weight:900;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Need help?</div>
                                <div style="font-size:13px;line-height:1.8;color:#4b5563;">
                                  ${
                                    supportEmail
                                      ? `Support email: <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;font-weight:800;">${supportEmail}</a><br/>`
                                      : ''
                                  }
                                  ${
                                    supportUrl
                                      ? `Contact us: <a href="${supportUrl}" style="color:#2563eb;text-decoration:none;font-weight:800;">${supportUrl}</a>`
                                      : ''
                                  }
                                </div>
                              </td>
                            </tr>
                           </table>`
                        : ''
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};
