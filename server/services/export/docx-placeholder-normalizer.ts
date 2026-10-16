import PizZip from 'pizzip'

const docxXmlPattern = /^word\/(document|header\d+|footer\d+)\.xml$/
const fragmentedPlaceholderPattern = /{{[\s\S]*?}}/g
const xmlTagPattern = /<[^>]+>/g

export function normalizeXmlPlaceholderMarkup(xmlContent: string) {
  return xmlContent.replace(fragmentedPlaceholderPattern, (fragment) => {
    if (!fragment.includes('<')) {
      return fragment
    }

    return fragment.replace(xmlTagPattern, '')
  })
}

export function normalizeDocxPlaceholderMarkup(zip: PizZip) {
  for (const fileName of Object.keys(zip.files)) {
    if (!docxXmlPattern.test(fileName)) {
      continue
    }

    const file = zip.file(fileName)
    if (!file) {
      continue
    }

    const originalXml = file.asText()
    const normalizedXml = normalizeXmlPlaceholderMarkup(originalXml)

    if (normalizedXml !== originalXml) {
      zip.file(fileName, normalizedXml)
    }
  }

  return zip
}
