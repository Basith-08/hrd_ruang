import { computed, ref } from "vue"

import translations from "../../lang"

export type SupportedLocale = "en" | "id"
type TranslationEntry = {
  en?: string
  id?: string
}
type TranslationParams = Record<string, string | number>

const localeStorageKey = "hrd_ruang_locale"
const locale = ref<SupportedLocale>("en")
const translationMap = translations as Record<string, TranslationEntry>
const reportedIssues = new Set<string>()
const isDevEnvironment = (import.meta as ImportMeta & { dev?: boolean }).dev === true
let hasInitialized = false

function reportTranslationIssue(issue: string, detail: string) {
  const message = `[i18n] ${issue}: ${detail}`

  if (!reportedIssues.has(message)) {
    reportedIssues.add(message)
    console.error(message)
  }

  if (isDevEnvironment) {
    throw new Error(message)
  }
}

function normalizeLocale(value: unknown): SupportedLocale {
  return String(value ?? "").trim().toLowerCase().startsWith("id") ? "id" : "en"
}

function syncDocumentLanguage(nextLocale: SupportedLocale) {
  if (typeof document === "undefined") {
    return
  }

  document.documentElement.lang = nextLocale === "id" ? "id" : "en"
}

function detectInitialLocale(): SupportedLocale {
  if (typeof window === "undefined") {
    return "en"
  }

  const savedLocale = window.localStorage.getItem(localeStorageKey)
  if (savedLocale) {
    return normalizeLocale(savedLocale)
  }

  return normalizeLocale(window.navigator.language)
}

function ensureLocaleInitialized() {
  if (hasInitialized) {
    return
  }

  locale.value = detectInitialLocale()
  syncDocumentLanguage(locale.value)
  hasInitialized = true
}

export function translateText(key: string, params: TranslationParams = {}) {
  ensureLocaleInitialized()

  const entry = translationMap[key]
  if (!entry) {
    reportTranslationIssue("Missing translation key", key)
    return key
  }

  const sourceText = entry[locale.value] || entry.en
  if (!sourceText) {
    reportTranslationIssue("Missing locale value", `${key} (${locale.value})`)
    return key
  }

  return sourceText.replace(/\{(\w+)\}/g, (_match, paramKey: string) =>
    Object.prototype.hasOwnProperty.call(params, paramKey)
      ? String(params[paramKey])
      : (() => {
          reportTranslationIssue("Missing translation param", `${key} -> ${paramKey}`)
          return `{${paramKey}}`
        })(),
  )
}

export function useLocale() {
  ensureLocaleInitialized()

  const isIndonesian = computed(() => locale.value === "id")

  function setLocale(nextLocale: SupportedLocale) {
    locale.value = normalizeLocale(nextLocale)

    if (typeof window !== "undefined") {
      window.localStorage.setItem(localeStorageKey, locale.value)
    }

    syncDocumentLanguage(locale.value)
  }

  function toggleLocale() {
    setLocale(locale.value === "id" ? "en" : "id")
  }

  function text(key: string, params: TranslationParams = {}) {
    return translateText(key, params)
  }

  function formatDateTime(
    value: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
      dateStyle: "medium",
    },
  ) {
    if (!value) {
      return "-"
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }

    const {
      timeStyle: _timeStyle,
      hour: _hour,
      minute: _minute,
      second: _second,
      dayPeriod: _dayPeriod,
      timeZoneName: _timeZoneName,
      ...dateOnlyOptions
    } = options

    return new Intl.DateTimeFormat(isIndonesian.value ? "id-ID" : "en-US", dateOnlyOptions).format(date)
  }

  return {
    formatDateTime,
    isIndonesian,
    locale,
    setLocale,
    text,
    toggleLocale,
  }
}
