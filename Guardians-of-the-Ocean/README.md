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
| `render.yaml` | Root blueprint. One Docker web service for https://harmony-immersive-learning.onrender.com |

Install uses `manifest.webmanifest` (`start_url` is the PWA).

## Deploy on Render

The public site and the knowledge engine are one Docker web service, defined in the repo-root `render.yaml` (`plan: starter`). A Static Site only publishes files, so `/api/search` and `/api/agent/command` return 404.

1. In the Render dashboard, open the blueprint for `IanDev-cmd/Harmony-immersive-learning-`.
2. The service `harmony-immersive-learning` must be a **Web Service** using the root `Dockerfile`, not a Static Site.
3. If a Static Site with that name is still listed, remove it and sync the blueprint so the Docker service keeps https://harmony-immersive-learning.onrender.com.
4. Set `GOOGLE_API_KEY`, `XAI_API_KEY`, and `AGENT_WEBHOOK_SECRET` on that service.
