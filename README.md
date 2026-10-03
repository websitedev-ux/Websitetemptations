# Website Temptations

A static website, with light (limestone) and dark (night tide) modes, where people request
a fully built website. No frameworks, no trackers, and no dependencies to install.

## Open it
Run the local preview server:
```
node tools/dev-server.js
```
Then open http://localhost:5173.

## Publishing to Hostinger (automatic)
Every push to `main` on GitHub rebuilds the site and uploads it to Hostinger
(`.github/workflows/deploy.yml`). Only the public files go up: the pages, `assets/`
and `.htaccess`. `src/`, `tools/` and this README stay private.

### One-time setup
1. **Get your FTP details from Hostinger.** In hPanel, open **Websites → your site →
   Files → FTP Accounts**. Note the **FTP IP/hostname**, the **FTP username** and the
   **Directory**. If you don't know the password, click **Change FTP password** there.
2. **Add them to GitHub.** In your repo, open **Settings → Secrets and variables → Actions**.
   - On the **Secrets** tab, add `FTP_SERVER` (the hostname or IP), `FTP_USERNAME` and
     `FTP_PASSWORD`. These are encrypted, and nobody (including Claude) can read them back.
   - On the **Variables** tab, add `FTP_SERVER_DIR`, the folder to upload into:
     - if the FTP account's Directory ends in `public_html`, use `./`
     - otherwise use `public_html/` (the default if you skip this)
3. **Clear Hostinger's placeholder page.** In hPanel's File Manager, delete `default.php`
   from `public_html` (the `.htaccess` already prefers `index.html`, so this is just tidying up).
4. **Deploy.** Push to `main`, or open the repo's **Actions** tab → **Deploy to Hostinger** →
   **Run workflow**. The first upload sends everything. Later ones send only changed files.

Until the three secrets are added, pushes still work. The deploy just skips itself with a
warning in the Actions tab.

### What `.htaccess` does on Hostinger
- Forces HTTPS. Turn on Hostinger's free SSL first: hPanel → **Security → SSL**.
- Shows `index.html` as the home page and the branded `404.html` for missing pages.
- Adds security headers, hides dotfiles and folder listings, and sets sensible caching.

### Uploading by hand instead
Run `node src/build.js` then `node tools/package.js`, and upload the contents of the new
`public/` folder into `public_html` with hPanel's File Manager.

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
