import { readFileSync, writeFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const rootDir = resolve(import.meta.dirname, '..')
const targets = [
  'node_modules/@jledentu/vue-finder/dist/vue-finder.es.js',
  'node_modules/@jledentu/vue-finder/dist/vue-finder.cjs.js',
  'node_modules/@jledentu/vue-finder/dist/vue-finder.umd.js',
]

let patchedFiles = 0

for (const relativePath of targets) {
  const filePath = resolve(rootDir, relativePath)

  if (!existsSync(filePath)) {
    continue
  }

  const original = readFileSync(filePath, 'utf8')
  const patched = original.replaceAll('ref:"ghost",', '')

  if (patched !== original) {
    writeFileSync(filePath, patched)
    patchedFiles += 1
  }
}

if (patchedFiles > 0) {
  console.log(`[patch-vue-finder] patched ${patchedFiles} file(s)`)
}
