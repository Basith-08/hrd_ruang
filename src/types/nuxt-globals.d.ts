declare global {
  const definePageMeta: (meta: Record<string, unknown>) => void
}

export {}

declare module "#imports" {
  export const definePageMeta: (meta: Record<string, unknown>) => void
}
