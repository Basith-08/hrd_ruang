export function defineNuxtPlugin<T>(plugin: T) {
  return plugin
}

export function defineNuxtRouteMiddleware<T>(middleware: T) {
  return middleware
}

export function definePageMeta(_meta: Record<string, unknown>) {}

export function navigateTo(target: unknown) {
  return target
}

type RuntimeConfigMock = {
  public: Record<string, unknown>
}

type RouteMock = {
  path: string
  fullPath: string
  params: Record<string, unknown>
  query: Record<string, unknown>
  meta: Record<string, unknown>
  name?: string
}

type RouterMock = {
  push: (target: unknown) => unknown
  replace: (target: unknown) => unknown
  back: () => unknown
}

const defaultRouteMock = (): RouteMock => ({
  path: '/',
  fullPath: '/',
  params: {},
  query: {},
  meta: {},
})

const defaultRouterMock = (): RouterMock => ({
  push: (target) => target,
  replace: (target) => target,
  back: () => undefined,
})

let routeMock: RouteMock = defaultRouteMock()
let routerMock: RouterMock = defaultRouterMock()
let runtimeConfigMock: RuntimeConfigMock = {
  public: {},
}

export function useRoute() {
  return routeMock
}

export function useRouter() {
  return routerMock
}

export function useRuntimeConfig() {
  return runtimeConfigMock
}

export function setNuxtRouteMock(nextRoute: Partial<RouteMock>) {
  routeMock = {
    ...defaultRouteMock(),
    ...nextRoute,
  }
}

export function setNuxtRouterMock(nextRouter: Partial<RouterMock>) {
  routerMock = {
    ...defaultRouterMock(),
    ...nextRouter,
  }
}

export function setNuxtRuntimeConfigMock(nextConfig: Partial<RuntimeConfigMock>) {
  runtimeConfigMock = {
    public: {
      ...(runtimeConfigMock.public ?? {}),
      ...(nextConfig.public ?? {}),
    },
  }
}

export function resetNuxtNavigationMocks() {
  routeMock = defaultRouteMock()
  routerMock = defaultRouterMock()
  runtimeConfigMock = {
    public: {},
  }
}

export function useNuxtApp() {
  return {}
}
