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

export const createEmailHtml = ({ title, intro, sections = [], closing, highlights = [], primaryAction = null, support = null }) => `
  <div style="font-family:Segoe UI,Arial,sans-serif;background:#f8fafc;padding:24px;color:#111827;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
      <div style="padding:20px 24px;background:#111827;color:#ffffff;">
        <div style="font-size:24px;font-weight:800;">E-<span style="color:#f97316;">Malla</span> Rwanda</div>
        <div style="font-size:12px;opacity:0.7;margin-top:6px;">Operational email notification</div>
      </div>
      <div style="padding:24px;">
        <h1 style="font-size:22px;margin:0 0 12px;font-weight:800;">${title}</h1>
        <p style="font-size:14px;line-height:1.7;color:#4b5563;margin:0 0 18px;">${intro}</p>
        ${
          highlights.filter((item) => item && item.label && item.value).length > 0
            ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 12px;width:100%;margin:0 0 18px;">
                <tr>
                  ${highlights
                    .filter((item) => item && item.label && item.value)
                    .map(
                      (item) => `
                        <td style="width:${Math.max(100 / highlights.length, 33)}%;padding-right:12px;">
                          <div style="background:${item.accentBg || '#fff7ed'};border:1px solid ${item.accentBorder || '#fed7aa'};border-radius:16px;padding:16px;">
                            <div style="font-size:11px;font-weight:800;color:${item.labelColor || '#9a3412'};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">${item.label}</div>
                            <div style="font-size:22px;font-weight:900;color:${item.valueColor || '#111827'};line-height:1.2;">${item.value}</div>
                          </div>
                        </td>
                      `
                    )
                    .join('')}
                </tr>
               </table>`
            : ''
        }
        ${
          sections.filter((section) => section && section.label && section.value).length > 0
            ? `<div style="border:1px solid #e5e7eb;border-radius:16px;padding:8px 16px;background:#f9fafb;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;">
                  <tbody>
                    ${sections
                      .filter((section) => section && section.label && section.value)
                      .map(
                        (section, index, list) => `
                          <tr>
                            <td style="padding:12px 0;border-bottom:${index === list.length - 1 ? '0' : '1px solid #e5e7eb'};vertical-align:top;width:34%;">
                              <div style="font-size:11px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;padding-right:12px;">
                                ${section.label}
                              </div>
                            </td>
                            <td style="padding:12px 0;border-bottom:${index === list.length - 1 ? '0' : '1px solid #e5e7eb'};vertical-align:top;">
                              <div style="font-size:14px;font-weight:700;color:#111827;line-height:1.6;word-break:break-word;">
                                ${section.value}
                              </div>
                            </td>
                          </tr>
                        `
                      )
                      .join('')}
                  </tbody>
                </table>
               </div>`
            : ''
        }
        ${
          primaryAction?.label && primaryAction?.url
            ? `<div style="margin:20px 0 0;text-align:left;">
                <a href="${primaryAction.url}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:14px 22px;border-radius:14px;">
                  ${primaryAction.label}
                </a>
               </div>`
            : ''
        }
        <p style="font-size:13px;line-height:1.7;color:#4b5563;margin:18px 0 0;">${closing}</p>
        ${
          support?.email || support?.url
            ? `<div style="margin-top:24px;padding-top:18px;border-top:1px solid #e5e7eb;">
                <div style="font-size:11px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Need help?</div>
                <div style="font-size:13px;line-height:1.7;color:#4b5563;">
                  ${
                    support?.email
                      ? `Support email: <a href="mailto:${support.email}" style="color:#2563eb;text-decoration:none;font-weight:700;">${support.email}</a><br/>`
                      : ''
                  }
                  ${
                    support?.url
                      ? `Contact us: <a href="${support.url}" style="color:#2563eb;text-decoration:none;font-weight:700;">${support.url}</a>`
                      : ''
                  }
                </div>
               </div>`
            : ''
        }
      </div>
    </div>
  </div>
`;
