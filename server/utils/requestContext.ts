import { getRequestHeader, type H3Event } from "h3"

import { getRequestContext } from "~~/server/lib/context.js"

export async function requireRequestContext(event: H3Event) {
  return getRequestContext({
    authorization: getRequestHeader(event, "authorization") ?? undefined,
  })
}
