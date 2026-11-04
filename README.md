# Secret Santa

Static Secret Santa site. The organiser enters names and the site draws. The organiser then shares one group link: each person taps their own name and unwraps their giftee. Individual personal links are still available. No backend, no database, no accounts, no analytics.

## Run

```bash
npm install
npm run dev          # local dev server
npm test             # unit tests (derangement, codec incl. group token, names)
npm run build        # typecheck + production build to dist/
npx vite preview --port 4173 &
node scripts/e2e.mjs http://localhost:4173/secret-santa/ qa      # headless e2e (needs Google Chrome)
node scripts/screens.mjs http://localhost:4173/secret-santa/ qa  # 375px + 1440px screenshots
```

## Deploy

GitHub Pages, project site at `/secret-santa/` (Vite `base` is set to that).

```bash
npm run deploy       # tests + build + gh-pages -d dist
```

## How it works

- **Routes** (hash-based, so GitHub Pages needs no rewrites): `#/` organiser form, `#/o/<token>` share page (organiser only), `#/g/<token>` group page (tap your name), `#/r/<token>` personal reveal page.
- **Draw**: uniform random derangement. Fisher-Yates with `crypto.getRandomValues`, rejected until no one draws themselves (~2.7 tries on average). `src/lib/derange.ts`.
- **Links**: each draw gets a random 128-bit AES-GCM key. A token is `base64url(version | kind | key | iv | ciphertext)`. A reveal token holds only giver, giftee, group and budget. Older tokens that also carry an exchange date still decode; the date is ignored. The organiser token holds all names and the assignment, deflated. `src/lib/codec.ts`.
- **Group token**: compact packing `n | assignment bytes | group\nbudget\nnames…`, deflated only when that is shorter. A group URL is about 290 characters for 10 names and about 500 for 30. It carries every pair, so it is no more private than the organiser link. The group page only ever renders the tapped person's giftee.
- **Device memory**: after "Yes, draw!", the chosen name is stored in localStorage under the draw's nonce. Return visits on that device go straight to that person's reveal, with a "Not <Name>? Switch" link that clears it. This is a soft peek deterrent, not enforcement.
- **Not secure, just not readable**: the key travels inside the link, so anyone who deliberately decodes a token can read it. It stops a giftee being visible in the URL bar or a Slack preview. The part after `#` is never sent to GitHub's servers.
- **Deterministic IVs** (`nonce(8) | index(4)`) mean the organiser link regenerates exactly the same personal links later, so links already sent stay valid.
- **Safety net**: the last organiser link is kept in localStorage and shown as "Open last draw" on the form.
