import { chromium } from "playwright"

const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
  const baseUrl = process.env.VITAQUEST_URL ?? "http://127.0.0.1:3024"
  await page.goto(baseUrl, { waitUntil: "networkidle" })

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

  console.log(JSON.stringify({ selectedBefore, selectedAfter, summaryBefore, summaryAfter }))
} finally {
  await browser.close()
}
