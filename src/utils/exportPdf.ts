import type { Post } from '../types/index.js';

export function exportPostToPdf(post: Post, siteName = 'نسمة شتاء') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بفتح النوافذ المنبثقة لتصدير ملف الـ PDF');
    return;
  }

  const formattedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const contentHtml = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8">
      <title>${post.title} — ${siteName}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4;
          margin: 25mm 20mm 25mm 20mm;
        }
        body {
          font-family: 'Amiri', serif;
          direction: rtl;
          color: #1a202c;
          line-height: 2;
          font-size: 16pt;
          background: #fff;
          margin: 0;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #cbd5e1;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-family: 'Tajawal', sans-serif;
          font-size: 14pt;
          color: #0284c7;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .title {
          font-size: 26pt;
          font-weight: bold;
          color: #0f172a;
          margin: 15px 0 10px;
          line-height: 1.4;
        }
        .meta {
          font-family: 'Tajawal', sans-serif;
          font-size: 11pt;
          color: #64748b;
          display: flex;
          justify-content: center;
          gap: 20px;
        }
        .category {
          background: #f1f5f9;
          padding: 3px 10px;
          border-radius: 4px;
          color: #334155;
        }
        .content {
          white-space: pre-line;
          text-align: justify;
          text-justify: inter-word;
          margin-top: 30px;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px dashed #cbd5e1;
          text-align: center;
          font-family: 'Tajawal', sans-serif;
          font-size: 10pt;
          color: #94a3b8;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">❄️ ${siteName}</div>
        <div class="title">${post.title}</div>
        <div class="meta">
          <span class="category">${post.category}</span>
          <span>📅 ${formattedDate}</span>
          ${!post.isPublic ? '<span>🔒 مسودة خاصة</span>' : ''}
        </div>
      </div>
      <div class="content">
        ${post.content.replace(/\n/g, '<br/>')}
      </div>
      <div class="footer">
        طُبعت من منصة «${siteName}» — ملاذك الشخصي الدافئ في عالم رقمي بارد.
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(contentHtml);
  printWindow.document.close();
}
