const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const downloadCsv = (filename: string, rows: Array<Record<string, string | number>>) => {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? '').replaceAll('"', '""')}"`)
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const printPdfDocument = (title: string, bodyHtml: string) => {
  const safeBodyHtml =
    String(bodyHtml || '').trim().length > 0
      ? bodyHtml
      : `<div class="page"><div class="card"><div class="card-label">Document</div><div class="card-value">${escapeHtml(
          title
        )}</div><p class="muted">No printable data was available for this document.</p></div></div>`;

  const documentHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #111827;
        --muted: #6b7280;
        --line: #e5e7eb;
        --panel: #f8fafc;
        --accent: #ea580c;
        --accent-soft: #fff7ed;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #ffffff;
        color: var(--ink);
        font-family: "Segoe UI", Arial, sans-serif;
      }
      .page {
        width: 100%;
        max-width: 980px;
        margin: 0 auto;
        padding: 36px 32px 48px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        align-items: flex-start;
        border-bottom: 2px solid var(--line);
        padding-bottom: 20px;
        margin-bottom: 28px;
      }
      .brand {
        font-size: 26px;
        font-weight: 800;
        letter-spacing: 0.02em;
      }
      .brand span { color: var(--accent); }
      .subtitle {
        color: var(--muted);
        font-size: 13px;
        margin-top: 8px;
      }
      .meta {
        text-align: right;
        font-size: 12px;
        color: var(--muted);
        line-height: 1.6;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 24px;
      }
      .card {
        border: 1px solid var(--line);
        background: var(--panel);
        border-radius: 18px;
        padding: 16px;
      }
      .card-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
        margin-bottom: 8px;
      }
      .card-value {
        font-size: 22px;
        font-weight: 800;
      }
      .section {
        margin-top: 24px;
      }
      .section-title {
        font-size: 16px;
        font-weight: 800;
        margin: 0 0 12px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid var(--line);
        border-radius: 16px;
        overflow: hidden;
      }
      th, td {
        padding: 12px 14px;
        text-align: left;
        border-bottom: 1px solid var(--line);
        font-size: 12px;
        vertical-align: top;
      }
      th {
        background: var(--accent-soft);
        color: var(--ink);
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      tr:last-child td { border-bottom: none; }
      .muted { color: var(--muted); }
      .right { text-align: right; }
      .pill {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 11px;
        font-weight: 700;
      }
      .footer {
        margin-top: 28px;
        border-top: 1px solid var(--line);
        padding-top: 12px;
        color: var(--muted);
        font-size: 11px;
      }
      @media print {
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .page { padding: 16px 18px 24px; }
      }
    </style>
  </head>
  <body>
    ${safeBodyHtml}
    <script>
      window.addEventListener('load', function () {
        setTimeout(function () {
          window.print();
        }, 150);
      });
    </script>
  </body>
</html>`;
  // Primary strategy: dedicated print tab.
  try {
    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow pop-ups and try again.');
    }

    printWindow.document.open();
    printWindow.document.write(documentHtml);
    printWindow.document.close();
    return;
  } catch {
    // Fallback strategy: print from an invisible iframe in the current page.
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!frameDoc) {
      document.body.removeChild(iframe);
      throw new Error('Unable to render printable document.');
    }

    frameDoc.open();
    frameDoc.write(documentHtml);
    frameDoc.close();

    window.setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      window.setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  }
};

export const renderTableRows = (rows: Array<Array<string | number>>) =>
  rows
    .map(
      (columns) =>
        `<tr>${columns
          .map((column, index) => `<td class="${index > 0 ? '' : ''}">${escapeHtml(column)}</td>`)
          .join('')}</tr>`
    )
    .join('');

export const html = {
  escape: escapeHtml
};
