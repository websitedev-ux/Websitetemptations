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

### Current setup (done)
websitetemptations.com is live and deploying automatically. GitHub has these settings under
**Settings → Secrets and variables → Actions**:

| Type | Name | What it holds |
|---|---|---|
| Secret | `FTP_SERVER` | The FTP IP/hostname from hPanel, without `ftp://` |
| Secret | `FTP_USERNAME` | The FTP username from hPanel |
| Secret | `FTP_PASSWORD` | The FTP password. Change it in hPanel, then update it here |
| Variable | `FTP_SERVER_DIR` | `./` |

Where to find these in Hostinger: hPanel → **Websites → websitetemptations.com → Files →
FTP Accounts**.

### Watch out: the upload folder
hPanel's FTP page says **"Folder to upload files: public_html"**, but this FTP account
already opens *inside* `public_html`. So `FTP_SERVER_DIR` must be `./`, meaning "upload
right where the account opens".
- If it's set to `public_html/` (or left empty, which falls back to that), the site uploads
  one level too deep, into `public_html/public_html/`. The live site then keeps showing the
  old page (or Hostinger's "Default page").
- **Quick check after any setup change:** `https://websitetemptations.com/public_html/`
  should show a 404. If it shows the site instead, the folder setting is wrong.

### Setting it up again (new site or new FTP account)
1. In hPanel, open **Files → FTP Accounts** for the site and copy the hostname and
   username. Click **Change FTP password** if you don't know the password.
2. Add the three secrets and the `FTP_SERVER_DIR` variable in GitHub (see the table above).
   Use `./` for any Hostinger FTP account that opens inside `public_html`, which is the
   usual case.
3. Make sure SSL is on: hPanel → **Security → SSL**.
4. Deploy: push to `main`, or open the repo's **Actions** tab → **Deploy to Hostinger** →
   **Run workflow**. Then load the live site to confirm.

Until the three secrets exist, pushes still work. The deploy just skips itself with a
warning in the Actions tab. Hostinger's `default.php` can stay in `public_html`, because
`.htaccess` makes `index.html` the home page.

### What `.htaccess` does on Hostinger
- Forces HTTPS. Turn on Hostinger's free SSL first: hPanel → **Security → SSL**.
- Shows `index.html` as the home page and the branded `404.html` for missing pages.
- Adds security headers, hides dotfiles and folder listings, and sets sensible caching.

### Uploading by hand instead
Run `node src/build.js` then `node tools/package.js`, and upload the *contents* of the new
`public/` folder (not the folder itself) into `public_html` with hPanel's File Manager.

## Before you launch: checklist
1. **Business details.** Done. The footer shows your Gmail, phone and hours.
2. **Emails.** Done. Every contact link uses scottyshopstore@gmail.com. To change it later,
   search for that address in `src/` and in the `CONFIG` block of `assets/main.js`.
3. **Prices.** Set your real package prices in `src/pages/index.html`, in both the pricing
   cards and the package dropdown.
4. **Form delivery.** Done. Both forms post to `send-request.php`, which runs on Hostinger
   and emails each submission to scottyshopstore@gmail.com (Reply goes straight to the
   visitor). To change the inbox, edit `MAIL_TO` at the top of that file. Locally, the dev
   server prints submissions in its terminal instead of emailing them.
   If emails don't arrive, check Gmail's Spam folder first, then create the mailbox
   `noreply@websitetemptations.com` in hPanel (Emails) so the sender address exists.
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
