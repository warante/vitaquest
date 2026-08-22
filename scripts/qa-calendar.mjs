import { chromium } from "playwright"

const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
  const baseUrl = process.env.VITAQUEST_URL ?? "http://127.0.0.1:3024"
  await page.goto(baseUrl, { waitUntil: "networkidle" })

  const manifestResponse = await page.request.get(`${baseUrl}/manifest.webmanifest`)
  const manifest = await manifestResponse.json()
  const serviceWorkerResponse = await page.request.get(`${baseUrl}/sw.js`)

  if (!manifestResponse.ok() || manifest.display !== "standalone" || !serviceWorkerResponse.ok()) {
    throw new Error("PWA manifest or service worker is not available")
  }

  if ((await page.locator(".skip-link").count()) !== 1) {
    throw new Error("Skip link is missing")
  }

  const selectedBefore = await page
    .locator('.calendar-day[aria-pressed="true"]')
    .getAttribute("aria-label")
  const summaryBefore = await page.locator(".calendar-summary").textContent()

  await page.locator(".calendar-day").nth(1).click()

  const selectedAfter = await page
    .locator('.calendar-day[aria-pressed="true"]')
    .getAttribute("aria-label")
  const summaryAfter = await page.locator(".calendar-summary").textContent()

  if (selectedBefore === selectedAfter || summaryBefore === summaryAfter) {
    throw new Error("Calendar selection did not update its state and summary")
  }

  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Exportar resumen" }).click()
  const download = await downloadPromise
  if (!/^vitaquest-\d{4}-\d{2}-\d{2}\.json$/.test(download.suggestedFilename())) {
    throw new Error("Export filename is not date-specific")
  }

  console.log(
    JSON.stringify({
      manifestDisplay: manifest.display,
      serviceWorkerStatus: serviceWorkerResponse.status(),
      selectedBefore,
      selectedAfter,
      summaryBefore,
      summaryAfter,
      exportFilename: download.suggestedFilename(),
    }),
  )
} finally {
  await browser.close()
}
