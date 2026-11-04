// Screenshots of organiser + reveal at 375 and 1440. Usage: node scripts/screens.mjs <baseUrl> <outDir>
import puppeteer from 'puppeteer-core';
const [BASE, OUT] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const setVal = (p, sel, v) => p.$eval(sel, (e, v) => {
  const proto = e instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(e, v);
  e.dispatchEvent(new Event('input', { bubbles: true }));
}, v);
let reveal;
for (const [w, h] of [[375, 812], [1440, 900]]) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: w < 500, hasTouch: w < 500 });
  await p.goto(BASE, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  await p.screenshot({ path: `${OUT}/organiser-${w}.png` });
  if (!reveal) {
    await setVal(p, 'input[placeholder^=YouTrip]', 'YouTrip Marketing Secret Santa 2026');
    await setVal(p, 'textarea', 'Kelicia\nCass\nSandra\nTerry\nCharla');
    await p.click('button[type=submit]');
    await p.waitForSelector('.links__row');
    await p.screenshot({ path: `${OUT}/links-${w}.png`, fullPage: true });
    reveal = await p.$eval('.links__url', (e) => 'http://' + e.textContent);
    if (BASE.startsWith('https')) reveal = reveal.replace('http://', 'https://');
  }
  const r = await (await browser.createBrowserContext()).newPage();
  await r.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: w < 500, hasTouch: w < 500 });
  await r.goto(reveal, { waitUntil: 'networkidle0' });
  await new Promise((res) => setTimeout(res, 400));
  await r.screenshot({ path: `${OUT}/reveal-wrapped-${w}.png` });
  await r.click('.gift-btn');
  await r.waitForSelector('.result__name');
  await new Promise((res) => setTimeout(res, 3600));
  await r.screenshot({ path: `${OUT}/reveal-open-${w}.png` });
}
await browser.close();
console.log('done');
