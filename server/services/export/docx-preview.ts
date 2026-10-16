import mammoth from 'mammoth'

import { createHttpError } from '~~/server/lib/errors.js'

function wrapPreviewHtml(content: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        color-scheme: light;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 40px 24px 56px;
        background:
          radial-gradient(circle at top, rgba(255,255,255,0.7), rgba(255,255,255,0) 34%),
          linear-gradient(180deg, #dbe4f0 0%, #cfd9e6 100%);
        color: #111827;
        font-family: "Calibri", "Arial", sans-serif;
      }

      .docx-preview-stage {
        width: 100%;
        overflow: auto;
      }

      .docx-preview-page {
        width: min(100%, 210mm);
        min-height: 297mm;
        margin: 0 auto;
        padding: 22mm 18mm 24mm;
        background: #ffffff;
        border: 1px solid rgba(148, 163, 184, 0.38);
        border-radius: 8px;
        box-shadow:
          0 22px 56px rgba(15, 23, 42, 0.18),
          0 2px 10px rgba(15, 23, 42, 0.06);
      }

      p {
        margin: 0 0 0.95em;
        font-size: 15px;
        line-height: 1.58;
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        margin: 0 0 0.7em;
        line-height: 1.32;
        color: #0f172a;
      }

      ul,
      ol {
        margin: 0 0 1em 1.4em;
        padding: 0;
      }

      li {
        margin-bottom: 0.35em;
        line-height: 1.55;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 0.75em 0 1.15em;
      }

      td,
      th {
        padding: 6px 8px;
        vertical-align: top;
        line-height: 1.5;
      }

      th {
        text-align: left;
      }

      img {
        max-width: 100%;
        height: auto;
      }

      hr {
        border: 0;
        border-top: 1px solid #cbd5e1;
        margin: 1.25em 0;
      }

      @media (max-width: 960px) {
        body {
          padding: 20px 12px 28px;
        }

        .docx-preview-page {
          width: 100%;
          min-height: auto;
          padding: 20px 16px 24px;
          border-radius: 0;
        }

        p,
        li,
        td,
        th {
          font-size: 14px;
        }
      }
    </style>
  </head>
  <body>
    <div class="docx-preview-stage">
      <div class="docx-preview-page">${content}</div>
    </div>
  </body>
</html>`
}

export async function renderDocxPreviewHtml(templateBuffer: Buffer) {
  try {
    const result = await mammoth.convertToHtml({ buffer: templateBuffer })
    return wrapPreviewHtml(result.value || '<p></p>')
  } catch (error) {
    throw createHttpError(
      400,
      error instanceof Error
        ? `Failed to render DOCX preview: ${error.message}`
        : 'Failed to render DOCX preview.',
    )
  }
}
