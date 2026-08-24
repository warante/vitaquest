import type { NextConfig } from "next"

const baseSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
]

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ")

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["sql.js"],
  async headers() {
    const isProduction = process.env.NODE_ENV === "production"
    const headers = [
      ...baseSecurityHeaders,
      ...(isProduction
        ? [
            {
              key: "Content-Security-Policy",
              value: cspDirectives,
            },
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains",
            },
          ]
        : []),
    ]
    return [
      {
        source: "/(.*)",
        headers,
      },
    ]
  },
}

export default nextConfig
