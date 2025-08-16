declare module 'next-pwa' {
  import { NextConfig } from 'next'

  interface PWAConfig {
    dest?: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    sw?: string
    runtimeCaching?: Array<{
      urlPattern: RegExp | string
      handler: string
      options?: {
        cacheName?: string
        expiration?: {
          maxEntries?: number
          maxAgeSeconds?: number
        }
        cacheKeyWillBeUsed?: any
        cacheWillUpdate?: any
        fetchDidFail?: any
        fetchDidSucceed?: any
        requestWillFetch?: any
        responseWillBeCached?: any
      }
    }>
    buildExcludes?: Array<string | RegExp>
    publicExcludes?: Array<string | RegExp>
    cacheOnFrontEndNav?: boolean
    reloadOnOnline?: boolean
    scope?: string
    fallbacks?: {
      document?: string
      image?: string
      audio?: string
      video?: string
      font?: string
    }
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig
  export default withPWA
}
