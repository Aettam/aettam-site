# AETTAM — Static Community Site

> *We Are All Mattea.*

A pure HTML/CSS/JS site for GitHub Pages. Public recruiting page +
password-gated members sanctuary.

## Files

| File          | Purpose |
| ------------- | ------- |
| `index.html`  | Public recruiting page (Hero, Manifesto, Rituals, Teachings, CTAs, Footer) |
| `private.html`| Members-only sanctuary (devotionals, Discord, rites, gallery, resources) |
| `styles.css`  | All custom styling (loaded after Tailwind CDN) |
| `script.js`   | Reveal-on-scroll, smooth-scroll, password gate logic |
| `README.md`   | This file |

## Change the password

Edit one line in `script.js`:

```js
const SANCTUARY_PASSWORD = "wearemattea";   // ← change me
```

> Client-side gate only. Keeps casual visitors out of the members area;
> not a security boundary. Don't store anything truly sensitive behind it.

## Add new content

- **Manifesto / Rituals / Teachings** — edit the matching `<section>` in `index.html`.
- **Devotionals / Resources / Discord link** — edit `private.html`. Replace `https://discord.gg/REPLACE-ME` with the real invite.
- **Colors / fonts** — defined in `:root` of `styles.css` and the `tailwind.config` block in `script.js`.

## Deploy to GitHub Pages

1. Create a new repo (e.g. `aettam-site`) and push these files to `main`.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)`**.
3. Wait ~1 min. Site goes live at `https://<username>.github.io/aettam-site/`.

### Custom domain (e.g. `aettam.org`)

1. Buy the domain (Namecheap / Cloudflare / Porkbun, etc.).
2. In the repo, **Settings → Pages → Custom domain → enter `aettam.org`** and save.
3. At the registrar, add DNS records pointing at GitHub Pages:
   - `A` records for the apex `@`:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - `CNAME` for `www` → `<username>.github.io`
4. Tick **Enforce HTTPS** once the cert provisions.

## Local preview

Just open `index.html` in a browser, or:

```bash
cd aettam-site
python -m http.server 8000
# → http://localhost:8000
```
