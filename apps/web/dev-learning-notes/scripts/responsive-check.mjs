import { chromium, devices } from "playwright";

async function capture(page, url, outputPath, waitForSelector) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout: 120000 });
  }
  await page.screenshot({ path: outputPath, fullPage: false });
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const mobileContext = await browser.newContext({
    ...devices["iPhone 12 Pro Max"],
  });
  const mobile = await mobileContext.newPage();

  await capture(desktop, "http://127.0.0.1:3000", "tmp-home-desktop.png", "text=Available Topics");
  await capture(mobile, "http://127.0.0.1:3000", "tmp-home-mobile.png", "text=Available Topics");
  await capture(desktop, "http://127.0.0.1:3000/notes/egov-sample", "tmp-note-desktop.png", "article");
  await capture(mobile, "http://127.0.0.1:3000/notes/egov-sample", "tmp-note-mobile.png", "article");

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
