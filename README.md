# Website Temptations

A static website, with light (limestone) and dark (night tide) modes, where people request
a fully built website. No frameworks, no trackers, and no dependencies to install.

## Open it
Run the local preview server:
```
node tools/dev-server.js
```
Then open http://localhost:5173. To publish, upload the whole folder (except `src/` and `tools/`) to any static host, such as Netlify, Cloudflare Pages, GitHub Pages or your own server.

## Before you launch: checklist
1. **Business details.** Done. The footer shows your Gmail, phone and hours.
2. **Emails.** Done. Every contact link uses scottyshopstore@gmail.com. To change it later,
   search for that address in `src/` and in the `CONFIG` block of `assets/main.js`.
3. **Prices.** Set your real package prices in `src/pages/index.html`, in both the pricing
   cards and the package dropdown.
4. **Form delivery.** By default the forms open the visitor's email app (mailto).
   To receive submissions directly, set `CONFIG.formEndpoint` in `assets/main.js` to a
   URL that accepts JSON POSTs. That can be your own server or a form service such as
   Formspree or Basin. **If you use a third-party service, add it to the provider table
   in `privacy.html` and to `credits.html`.**
5. **Legal review.** The policies are thorough templates, not legal advice. Have a lawyer
   check them for your country and state.
6. **Refund percentages.** Adjust `refunds.html` to your real policy.

## Editing pages
Edit files in `src/pages/` (and the shared header/footer/cookie banner in
`src/template.html`), then rebuild:

```
node src/build.js
```

## Optional: remove the last third party (Google Fonts)
Download Cormorant Garamond and Montserrat (both licensed under the SIL OFL) from
fonts.google.com. Put the `.woff2` files in `assets/fonts/` and add `@font-face` rules
to `styles.css`. Then delete the three Google Fonts `<link>` lines in `src/template.html`,
rebuild, and remove Google Fonts from `privacy.html`, `cookies.html` and `credits.html`.

## Adding analytics later (with consent)
Load it like this, and it will only run after the visitor accepts Analytics cookies:
```html
<script type="text/plain" data-consent="analytics" src="https://..."></script>
```
Then list it in `cookies.html`, `privacy.html` and `credits.html`, and change
`CONFIG.policyVersion` in `main.js` so that every visitor is asked again.

## Adding a project to "Our Work"
1. Get your client's permission to show their site (your Terms of Service promise this).
2. Make the watermarked preview picture (needs Chrome or Edge installed):
   ```
   node tools/make-preview.js https://their-site.com their-site
   ```
   This saves `assets/work/their-site.jpg`. It dismisses welcome pop-ups and cookie banners
   automatically. Open the picture and check it before publishing.
3. Add an entry at the **top** of `src/projects.json`. The first entry is shown as the large
   featured project, and the home page shows the newest 3:
   ```json
   { "name": "Their Business", "url": "https://their-site.com/", "image": "assets/work/their-site.jpg",
     "type": "Online store", "location": "City, State", "summary": "One or two factual sentences." }
   ```
4. Rebuild: `node src/build.js`
