import { NextResponse, type NextRequest } from "next/server"
import { parseDocsRoute } from "@code-altas/ui/config"
import siteConfig from "./codealtas.config"

export function proxy(request: NextRequest) {
  const route = parseDocsRoute(
    request.nextUrl.pathname.slice(5),
    siteConfig.docs?.i18n
  )
  if (route.prefixed && route.locale === siteConfig.docs?.i18n?.defaultLocale) {
    const url = request.nextUrl.clone()
    url.pathname = `/docs${route.slug === "/" ? "" : route.slug}`
    return NextResponse.redirect(url, 308)
  }
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-codeatlas-locale", route.locale ?? "en")
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = { matcher: "/docs/:path*" }
