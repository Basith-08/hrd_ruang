const previewWindowFeatures = 'width=960,height=1200'

export function openPdfPreviewWindow(
  errorMessage: string,
  existingWindow?: Window | null,
) {
  if (existingWindow && !existingWindow.closed) {
    return existingWindow
  }

  const previewWindow = window.open('about:blank', '_blank', previewWindowFeatures)

  if (!previewWindow) {
    throw new Error(errorMessage)
  }

  return previewWindow
}

export function renderPdfPreviewWindow(previewWindow: Window, html: string) {
  previewWindow.document.open()
  previewWindow.document.write(html)
  previewWindow.document.close()
}

export function closePdfPreviewWindow(previewWindow?: Window | null) {
  if (!previewWindow || previewWindow.closed) {
    return
  }

  previewWindow.close()
}
