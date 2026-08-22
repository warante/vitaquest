const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#18352f"/>
  <path d="M18 19h10v10h8V19h10v26H36V37h-8v8H18z" fill="#f7f4ed"/>
</svg>`

export function GET(): Response {
  return new Response(favicon, {
    headers: {
      "cache-control": "public, max-age=86400",
      "content-type": "image/svg+xml",
    },
  })
}
