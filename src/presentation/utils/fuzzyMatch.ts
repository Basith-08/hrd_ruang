export function levenshteinDistance(left: string, right: string) {
  const rows = left.length + 1
  const cols = right.length + 1
  const distances: number[][] = Array.from({ length: rows }, (_, row) => {
    const line = new Array<number>(cols).fill(0)
    line[0] = row
    return line
  })

  for (let col = 1; col < cols; col += 1) {
    distances[0]![col] = col
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const substitutionCost = left[row - 1] === right[col - 1] ? 0 : 1
      distances[row]![col] = Math.min(
        distances[row - 1]![col]! + 1,
        distances[row]![col - 1]! + 1,
        distances[row - 1]![col - 1]! + substitutionCost,
      )
    }
  }

  return distances[rows - 1]![cols - 1]!
}

export function stringSimilarity(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length)
  if (maxLength === 0) return 1

  return 1 - levenshteinDistance(left, right) / maxLength
}

export const fuzzyMatchSimilarityThreshold = 0.82

export type FuzzyMatchOption = {
  value: string | number | null
  label: string
}

/**
 * Resolves free text (e.g. a value typed by hand into an uploaded document)
 * against a list of known options. Tries exact match, then substring
 * containment, then falls back to Levenshtein similarity so small typos
 * (extra/missing letters, spacing) still resolve instead of being flagged
 * as a mismatch — while staying conservative enough to avoid matching
 * genuinely different values.
 */
export function findOptionByLabel<TOption extends FuzzyMatchOption>(
  options: TOption[],
  rawValue: string,
): TOption | null {
  const normalized = rawValue.trim().toLowerCase()
  if (!normalized) return null

  const exactMatch = options.find((option) => option.label.trim().toLowerCase() === normalized)
  if (exactMatch) return exactMatch

  const substringMatch = options.find((option) => {
    const optionLabel = option.label.trim().toLowerCase()
    return optionLabel.includes(normalized) || normalized.includes(optionLabel)
  })
  if (substringMatch) return substringMatch

  let bestMatch: TOption | null = null
  let bestScore = 0

  for (const option of options) {
    const optionLabel = option.label.trim().toLowerCase()
    if (!optionLabel) continue

    const score = stringSimilarity(normalized, optionLabel)
    if (score > bestScore) {
      bestScore = score
      bestMatch = option
    }
  }

  return bestScore >= fuzzyMatchSimilarityThreshold ? bestMatch : null
}
