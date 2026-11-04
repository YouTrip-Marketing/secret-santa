// Headless end-to-end check. Usage: node scripts/e2e.mjs <baseUrl> [outDir]
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] ?? 'http://localhost:4173/secret-santa/';
const OUT = process.argv[3] ?? 'qa';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const NAMES = ['Kelicia', 'Cass', 'Sandra', 'Terry', 'Charla', 'Zoë Tan'];
const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const baseOrigin = new URL(BASE).origin;
const external = new Set();
const watch = (page) => {
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith('http') && u.origin !== baseOrigin) external.add(u.origin);
  });
  page.on('pageerror', (e) => check(`no page error: ${e.message}`, false));
};

const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
watch(page);
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(BASE, { waitUntil: 'networkidle0' });
await page.screenshot({ path: `${OUT}/1-organiser-375.png`, fullPage: true });

const draw = async () => { await page.click('button[type=submit]'); await new Promise((r) => setTimeout(r, 300)); };
const errorText = () => page.$eval('.error', (e) => e.textContent).catch(() => null);

// validation
const setValue = (sel, v) => page.$eval(sel, (e, v) => {
  const proto = e instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(e, v);
  e.dispatchEvent(new Event('input', { bubbles: true }));
}, v);
await page.type('textarea', 'Amy\nBen');
await draw();
check('blocks < 3 names', (await errorText())?.includes('at least 3') === true, await errorText());
await setValue('textarea', 'Amy\n\n amy \nBen');
await draw();
check('blocks duplicates (case-insensitive)', (await errorText())?.includes('Duplicate') === true, await errorText());
await setValue('textarea', '');

// real draw
await page.type('textarea', NAMES.join('\n') + '\n\n');
await page.type('input[placeholder^=YouTrip]', 'YouTrip Marketing Secret Santa 2026');
const budgetVal = await page.$eval('input[maxlength="20"]', (e) => e.value);
check('no date picker on form', (await page.$('input[type=date]')) === null);
check('budget defaults to S$30', budgetVal === 'S$30', budgetVal);
await draw();
await page.waitForSelector('.links__row', { timeout: 5000 }).catch(async (e) => { console.log('error on page:', await errorText()); throw e; });
const organiserUrl = page.url();
check('navigates to organiser route', organiserUrl.includes('#/o/'));
const rows = await page.$$eval('.links__row', (rs) => rs.map((r) => r.querySelector('.links__name').textContent));
check('one row per participant', JSON.stringify(rows) === JSON.stringify(NAMES), rows.join(','));
const bodyText = await page.$eval('body', (b) => b.innerText);
check('share page leads with a group link', (await page.$eval('.share code', (e) => e.textContent)).includes('#/g/'));
check('individual links are collapsed by default', (await page.$eval('details.more', (d) => d.open)) === false);
await page.screenshot({ path: `${OUT}/2-share-375.png`, fullPage: true });
await page.click('details.more summary');
const openText = await page.$eval('body', (b) => b.innerText);
check('individual links section shows warning', openText.includes("Don't open these links"));
check('budget banner shown, no date or countdown', (await page.$eval('.banner', (e) => e.innerText)).includes('S$30') && (await page.$('.countdown, input[type=date]')) === null && !bodyText.includes('exchange'));

// copy group link + message (read back from clipboard)
await ctx.overridePermissions(baseOrigin, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
await page.click('.share .organiser-link .btn');
await new Promise((r) => setTimeout(r, 200));
const groupUrl = await page.evaluate(() => navigator.clipboard.readText());
check('Copy copies the group link', groupUrl.startsWith(`${BASE}#/g/`), `${groupUrl.length} chars`);
await page.click('.share > .btn');
await new Promise((r) => setTimeout(r, 200));
const msg = await page.evaluate(() => navigator.clipboard.readText());
check('Copy message is paste-ready', msg === `🎅 YouTrip Marketing Secret Santa 2026\nBudget: S$30\nTap your name to draw: ${groupUrl}`, JSON.stringify(msg.slice(0, 60)));
check('no names readable in group token', NAMES.every((n) => !decodeURIComponent(groupUrl).includes(n)));

// copy all (read back from clipboard)
await page.click('.more .card__head .btn');
await new Promise((r) => setTimeout(r, 200));
const clip = await page.evaluate(() => navigator.clipboard.readText());
const lines = clip.split('\n');
const linkOk = lines.length === NAMES.length && lines.every((l, i) => l.startsWith(`${NAMES[i]}: ${BASE}#/r/`));
check('Copy all produces "Name: link" lines', linkOk, `${lines.length} lines`);
const copiedLabel = await page.$eval('.more .card__head .btn', (b) => b.textContent);
check('Copy all button confirms', copiedLabel.includes('Copied'), copiedLabel);
const links = lines.map((l) => l.slice(l.indexOf(': ') + 2));
check('no names readable in link tokens', links.every((u) => NAMES.every((n) => !decodeURIComponent(u).includes(n))));
const maxLen = Math.max(...links.map((u) => u.length));
console.log(`      personal link: ${maxLen} chars; group link: ${groupUrl.length} chars; organiser link: ${organiserUrl.length} chars`);

// localStorage safety net
const stored = await page.evaluate(() => localStorage.getItem('secret-santa:last-organiser-link'));
check('last draw saved in localStorage', stored === organiserUrl);

// organiser link reopened in a fresh context regenerates the same links
const ctx2 = await browser.createBrowserContext();
const p2 = await ctx2.newPage();
watch(p2);
await p2.goto(organiserUrl, { waitUntil: 'networkidle0' });
await p2.waitForSelector('.links__row');
const urls2 = await p2.$$eval('.links__url', (es) => es.map((e) => e.textContent));
check('organiser link regenerates identical links', JSON.stringify(urls2) === JSON.stringify(links.map((u) => u.replace(/^https?:\/\//, ''))));
await ctx2.close();

// home shows "Open last draw"
await page.goto(BASE, { waitUntil: 'networkidle0' });
check('home shows "Open last draw"', (await page.$('a.link')) !== null);

// reveal every link in fresh incognito contexts; collect assignment
const assignment = {};
for (let i = 0; i < links.length; i++) {
  const c = await browser.createBrowserContext();
  const p = await c.newPage();
  watch(p);
  await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(links[i], { waitUntil: 'networkidle0' });
  await p.waitForSelector('.gift-btn');
  const pre = await p.$eval('body', (b) => b.innerText);
  if (i === 0) {
    await p.screenshot({ path: `${OUT}/3-reveal-wrapped-375.png` });
    check('reveal shows group and budget, no date', pre.includes('YouTrip Marketing Secret Santa 2026') && pre.includes('S$30') && !/exchange|days|dec/i.test(pre));
  }
  const othersBefore = NAMES.filter((n) => n !== NAMES[i] && pre.includes(n));
  await p.tap('.gift-btn');
  await p.waitForSelector('.result__name', { timeout: 3000 });
  if (i === 0) {
    await new Promise((r) => setTimeout(r, 500));
    await p.screenshot({ path: `${OUT}/4-reveal-open-375.png` });
    const confetti = await p.$('.confetti-canvas');
    check('confetti canvas fires on unwrap', confetti !== null);
  }
  const giftee = await p.$eval('.result__name', (e) => e.textContent);
  const post = await p.$eval('body', (b) => b.innerText);
  assignment[NAMES[i]] = giftee;
  const othersShown = NAMES.filter((n) => n !== NAMES[i] && n !== giftee && post.includes(n));
  if (othersBefore.length || othersShown.length) check(`reveal ${i} leaks other names`, false, [...othersBefore, ...othersShown].join(','));
  if (i === 0) check('reveal shows "Keep it secret"', post.includes('Keep it secret'));
  await c.close();
}
const giftees = Object.values(assignment);
check('every reveal is a valid derangement', new Set(giftees).size === NAMES.length && NAMES.every((n) => assignment[n] !== n && NAMES.includes(assignment[n])));
check('reveal pages list no other pairs', !results.some((r) => !r.ok && r.name.includes('leaks')));

// ---------- group link flow ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mobile = { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
for (let i = 0; i < NAMES.length; i++) {
  const c = await browser.createBrowserContext();
  const p = await c.newPage();
  watch(p);
  await p.setViewport(mobile);
  await p.goto(groupUrl, { waitUntil: 'networkidle0' });
  await p.waitForSelector('.chip');
  const chips = await p.$$eval('.chip__name', (es) => es.map((e) => e.textContent));
  const html = await p.content();
  const pre = await p.$eval('body', (b) => b.innerText);
  if (i === 0) {
    check('group page lists every name as a chip', JSON.stringify(chips) === JSON.stringify(NAMES));
    check('group page shows group and budget', pre.includes('YouTrip Marketing Secret Santa 2026') && pre.includes('S$30') && pre.includes('Who are you?'));
    await p.screenshot({ path: `${OUT}/5-group-pick-375.png` });
  }
  const leaked = html.includes('Secret Santa for') || (await p.$('.result, .gift-btn')) !== null;
  if (leaked) check(`group page ${i} shows a pair before tapping`, false);
  const chip = (await p.$$('.chip'))[i];
  await chip.tap();
  await p.waitForSelector('.confirm');
  const q = await p.$eval('.confirm__q', (e) => e.innerText);
  if (i === 0) check('confirm step names the person', q.includes(NAMES[0]) && (await p.$eval('.confirm', (e) => e.innerText)).includes('Yes, draw!'));
  if (i === 0) {
    // Back returns to the picker without saving anything
    await p.tap('.confirm .btn--soft');
    await p.waitForSelector('.chip');
    const savedAfterBack = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('secret-santa:group:')).length);
    check('Back returns to picker without remembering', savedAfterBack === 0);
    await (await p.$$('.chip'))[0].tap();
    await p.waitForSelector('.confirm');
  }
  await p.tap('.confirm .btn--primary');
  await p.waitForSelector('.hat');
  if (i === 0) check('shuffle shows names from the hat', (await p.$eval('.hat__name', (e) => e.textContent)).length > 0);
  await p.waitForSelector('.gift-btn', { timeout: 5000 });
  await p.tap('.gift-btn');
  await p.waitForSelector('.result__name', { timeout: 3000 });
  const giftee = await p.$eval('.result__name', (e) => e.textContent);
  if (giftee !== assignment[NAMES[i]]) check(`group reveal ${i} matches personal link`, false, `${giftee} vs ${assignment[NAMES[i]]}`);
  const post = await p.$eval('body', (b) => b.innerText);
  const others = NAMES.filter((n) => n !== NAMES[i] && n !== giftee && post.includes(n));
  if (others.length) check(`group reveal ${i} leaks other names`, false, others.join(','));
  if (i === 0) {
    await sleep(500);
    await p.screenshot({ path: `${OUT}/6-group-reveal-375.png` });
    check('group reveal fires confetti', (await p.$('.confetti-canvas')) !== null);
    // device memory: reload goes straight to own reveal
    await p.reload({ waitUntil: 'networkidle0' });
    await p.waitForSelector('.result__name', { timeout: 3000 });
    const again = await p.$eval('.result__name', (e) => e.textContent);
    check('return visit goes straight to own reveal', again === giftee && (await p.$('.chip')) === null);
    const sw = await p.$eval('.switch .link', (e) => e.textContent);
    check('return visit offers "Not <Name>? Switch"', sw === `Not ${NAMES[0]}? Switch`, sw);
    await p.tap('.switch .link');
    await p.waitForSelector('.chip');
    const savedAfterSwitch = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('secret-santa:group:')).length);
    check('Switch returns to picker and forgets the device', savedAfterSwitch === 0 && (await p.$('.result')) === null);
  }
  await c.close();
}
check('group reveals match personal links for everyone', !results.some((r) => !r.ok && r.name.startsWith('group reveal')));
check('group page never shows a pair before tapping', !results.some((r) => !r.ok && r.name.includes('before tapping')));

// broken link
const p3 = await (await browser.createBrowserContext()).newPage();
await p3.goto(links[0].slice(0, -10), { waitUntil: 'networkidle0' });
const broken = await p3.$eval('body', (b) => b.innerText);
check('damaged link shows error page', broken.includes("This link doesn't work"));

// horizontal overflow at 375
for (const [label, url] of [['organiser', BASE], ['share', organiserUrl], ['reveal', links[1]], ['group', groupUrl]]) {
  const p = await (await browser.createBrowserContext()).newPage();
  await p.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await p.goto(url, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  check(`no horizontal scroll at 375px (${label})`, sw <= 375, `scrollWidth=${sw}`);
}

check('no external network requests', external.size === 0, [...external].join(','));
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
