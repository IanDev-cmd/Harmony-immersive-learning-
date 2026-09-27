# Immersive Learning

Coastal restoration web app plus a complementary PWA (Global Impact Ledger). Ten pilot cities, a Three.js globe, Leaflet shoreline maps, GPS compass, install/share, and a first-visit tutorial.

## Run locally

Serve the repo root over HTTP (not `file://`):

```bash
python -m http.server 8765
```

Then open `http://127.0.0.1:8765/`. Mobile / standalone sessions land on the PWA; desktop opens the globe app.

## Layout

| Path | Role |
| --- | --- |
| `index.html` | Device-aware entry redirect. Desktop lands on `save-the-earth (4).html` (the live desktop URL); that filename is kept on purpose. |
| `save-the-earth (4).html` | Desktop / embed shell (markup + styles) |
| `js/boot.js` | Lazy-loads Three.js + Leaflet when globe/map are needed |
| `js/goo-core.js` | Device, sound, notifications |
| `js/goo-compass.js` | GPS heading, elevation, map-ring HUD |
| `js/goo-shell.js` | Install, share, tutorial, service worker |
| `js/goo-globe.js` | Three.js globe (hardware LOD, deferred GPU init) |
| `js/goo-config.js` | Public Stripe API origin (`GOO_API`) |
| `js/goo-stripe.js` | Checkout session create + live balances |
| `js/goo-cards.js` | Sidebar cards and globe chrome |
| `success.html` / `cart.html` | Stripe return pages |
| `server/` | Express + Prisma Stripe API |
| `stripe-ui/` | Typed React/Next.js Checkout copies |
| `js/goo-map.js` | Leaflet overlays and phase roadmap |
| `js/pwa-app.js` | PWA clock and tile → 3D/2D loader |
| `css/goo.css` | Shared chrome (toasts, compass, tutorial) |
| `assets/3d/` | Globe preview sprite used before the canvas boots |
| `assets/maps/` | City + school GeoJSON / JSON, loaded with the map |
| `assets/images/` | Card and city photos (JPEG + WebP + small WebP) |
| `assets/content/` | Static content indexes |
| `pwa/island-weather-pwa/` | Ledger PWA shell |
| `sw.js` | App-shell cache (network-first navigations, cache-first tiles/images) |
| `render.yaml` | Render blueprint for https://harmony-immersive-learning.onrender.com |

Install uses `manifest.webmanifest` (`start_url` is the PWA). Hosted as a static site — not the weott-proposal-engine Render service.

## Deploy on Render (Static Site)

This is **not** a Web Service. There is no `yarn start`.

1. **New → Static Site** (URL should be `dashboard.render.com/static/new`).
2. Connect `IanDev-cmd/Harmony-immersive-learning-`, branch `main`. The public site is https://harmony-immersive-learning.onrender.com.
3. Fields:
   - **Build Command:** `true`  
     (`true` is a no-op. Do **not** type `static` — Render will try to run it as a program and fail.)
   - **Publish Directory:** `.`
4. Leave environment variables empty.
5. Create / save, then **Manual Deploy → Deploy latest commit**.

If a deploy already failed with `static: command not found`: open the service **Settings**, set Build Command to `true`, Publish Directory to `.`, save, and redeploy. Do not create a new Web Service.
