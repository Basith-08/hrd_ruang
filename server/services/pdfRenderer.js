import { execFile } from "node:child_process"
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { promisify } from "node:util"

import { GOOGLE_CHROME_BIN } from "~~/server/config/env.js"
import { createHttpError } from "~~/server/lib/errors.js"

const execFileAsync = promisify(execFile)
const chromeCandidates = [
  GOOGLE_CHROME_BIN,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean)

async function resolveChromeBinary() {
  for (const candidate of chromeCandidates) {
    try {
      await access(candidate)
      return candidate
    } catch {
      continue
    }
  }

  throw createHttpError(500, "Google Chrome is required to generate PDF attachments.", {
    expose: true,
  })
}

export async function renderHtmlToPdfBuffer(html, options = {}) {
  const normalizedHtml = String(html ?? "").trim()
  if (!normalizedHtml) {
    throw createHttpError(400, "PDF renderer received an empty HTML document.")
  }

  const chromeBinary = await resolveChromeBinary()
  const tempDir = await mkdtemp(join(tmpdir(), "hrd-ruang-contract-pdf-"))
  const htmlPath = join(tempDir, "document.html")
  const pdfPath = join(tempDir, "document.pdf")

  try {
    await writeFile(htmlPath, normalizedHtml, "utf8")

    await execFileAsync(
      chromeBinary,
      [
        "--headless=new",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--allow-file-access-from-files",
        "--print-to-pdf-no-header",
        `--print-to-pdf=${pdfPath}`,
        pathToFileURL(htmlPath).href,
      ],
      {
        timeout: options.timeoutMs ?? 20000,
        maxBuffer: 10 * 1024 * 1024,
      },
    )

    return await readFile(pdfPath)
  } catch (error) {
    throw createHttpError(500, "Failed to generate PDF attachment.", {
      expose: true,
      cause: error,
    })
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}
