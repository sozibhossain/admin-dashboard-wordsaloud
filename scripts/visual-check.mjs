import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

await mkdir(".screenshots", { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/login");
  await page.fill("input[name=email]", process.env.TEST_EMAIL);
  await page.fill("input[name=password]", process.env.TEST_PASSWORD);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `.screenshots/dashboard-${viewport.name}.png`, fullPage: true });
  const metrics = await page.evaluate(() => ({
    viewport: innerWidth,
    bodyScroll: document.body.scrollWidth,
    heading: document.querySelector("h1")?.textContent,
    sidebarVisible: [...document.querySelectorAll("aside")].some(
      (element) => getComputedStyle(element).display !== "none",
    ),
  }));
  console.log(`${viewport.name}: ${JSON.stringify(metrics)}`);
  for (const route of ["users", "advertisements", "settings", "logout"]) {
    await page.goto(`http://localhost:3000/${route}`);
    await page.waitForLoadState("networkidle");
    const routeMetrics = await page.evaluate(() => ({
      bodyScroll: document.body.scrollWidth,
      viewport: innerWidth,
      heading: document.querySelector("h1")?.textContent,
    }));
    console.log(`${viewport.name}/${route}: ${JSON.stringify(routeMetrics)}`);
    if (viewport.name !== "tablet") {
      await page.screenshot({ path: `.screenshots/${route}-${viewport.name}.png`, fullPage: true });
    }
  }
  await context.close();
}

await browser.close();
