import { apiUrl } from './apiConfig';

type ClientErrorSource = 'window_error' | 'unhandled_rejection' | 'react_error_boundary' | 'api_error';

type ClientErrorReport = {
  source: ClientErrorSource;
  message: string;
  stack?: string;
  route?: string;
  requestId?: string;
  statusCode?: number;
};

const recentReports = new Map<string, number>();
const REPORT_DEDUPE_WINDOW_MS = 60_000;

const sanitizeText = (value: unknown, maxLength: number) =>
  String(value || '')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/em_tk_[a-z0-9]+/gi, '[redacted-token]')
    .replace(/([?&](?:token|code|key|secret|password)=)[^&\s]+/gi, '$1[redacted]')
    .slice(0, maxLength);

const shouldSend = (report: ClientErrorReport) => {
  const key = `${report.source}:${report.statusCode || 0}:${report.message}:${report.route || ''}`;
  const now = Date.now();
  const previous = recentReports.get(key) || 0;
  recentReports.set(key, now);

  for (const [entry, timestamp] of recentReports) {
    if (now - timestamp > REPORT_DEDUPE_WINDOW_MS) {
      recentReports.delete(entry);
    }
  }

  return now - previous > REPORT_DEDUPE_WINDOW_MS;
};

const report = async (input: ClientErrorReport) => {
  const reportPayload: ClientErrorReport = {
    source: input.source,
    message: sanitizeText(input.message, 1000) || 'Unknown frontend error',
    stack: sanitizeText(input.stack, 3000),
    route: sanitizeText(input.route || window.location.pathname, 300).split('?')[0],
    requestId: sanitizeText(input.requestId, 120),
    statusCode: input.statusCode
  };

  if (!shouldSend(reportPayload)) return;

  const token = localStorage.getItem('emalla_token');
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    await fetch(apiUrl('/monitoring/client-error'), {
      method: 'POST',
      headers,
      body: JSON.stringify(reportPayload),
      keepalive: true
    });
  } catch {
    // Monitoring must never interrupt the user experience.
  }
};

const toErrorDetails = (value: unknown) => {
  if (value instanceof Error) {
    return { message: value.message, stack: value.stack };
  }
  return { message: String(value || 'Unknown frontend error'), stack: '' };
};

export const monitoringService = {
  report,

  reportApiError(params: { path: string; statusCode?: number; message: string; requestId?: string }) {
    void report({
      source: 'api_error',
      message: params.message,
      route: params.path,
      statusCode: params.statusCode,
      requestId: params.requestId
    });
  },

  installGlobalHandlers() {
    const handleWindowError = (event: ErrorEvent) => {
      void report({
        source: 'window_error',
        message: event.message,
        stack: event.error instanceof Error ? event.error.stack : ''
      });
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const details = toErrorDetails(event.reason);
      void report({
        source: 'unhandled_rejection',
        ...details
      });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }
};
