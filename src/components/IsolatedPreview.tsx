"use client";

import React, { useMemo } from "react";

type PreviewProps = {
  html: string; // HTML body
  js: string; // JS ที่พร้อมรันแล้ว (หลัง compile TS แล้ว)
  tailwind?: boolean;
};

export function IsolatedPreview({ html, js, tailwind = true }: PreviewProps) {
  const srcDoc = useMemo(() => {
    // ✅ CSP กันหลุด/กันโหลดมั่ว (ปรับได้ตามต้องการ)
    const csp = `
      default-src 'none';
      script-src 'unsafe-inline' https://cdn.tailwindcss.com;
      style-src 'unsafe-inline' https://fonts.googleapis.com;
      img-src data: https:;
      font-src https: data:;
      connect-src https:;
    `
      .replace(/\s+/g, " ")
      .trim();

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    ${tailwind ? `<script src="https://cdn.tailwindcss.com"></script>` : ""}
    <style>
      html, body { height: 100%; margin: 0; }
    </style>
  </head>
  <body>
    ${html}
    <script>
      // ✅ จับ error ให้ส่งกลับออกไปดูใน console ฝั่งแม่ได้ (optional)
      window.addEventListener('error', (e) => {
        parent?.postMessage({ type: 'preview:error', message: String(e.message) }, '*');
      });
      window.addEventListener('unhandledrejection', (e) => {
        parent?.postMessage({ type: 'preview:rejection', message: String(e.reason) }, '*');
      });

      ${js}
    </script>
  </body>
</html>`;
  }, [html, js, tailwind]);

  return (
    <iframe
      title="preview"
      className="h-full w-full rounded-xl border"
      // ✅ ไม่มี allow-same-origin = แยก origin แน่น ๆ
      sandbox="allow-scripts allow-forms allow-modals"
      srcDoc={srcDoc}
    />
  );
}
