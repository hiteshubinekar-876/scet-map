# TECH_STACK — CampusPath

## Current prototype
- **Framework:** Next.js 15 App Router
- **Language:** TypeScript
- **UI:** React 19 and project CSS
- **QR camera scanning:** `html5-qrcode`
- **Routing:** local TypeScript graph and Dijkstra shortest-path implementation
- **Maps:** SVG floor-map rendering with route overlay
- **Database preparation:** Supabase schema SQL and `@supabase/supabase-js` dependency; live graph reads are not yet connected
- **Package manager:** npm

## Development requirements
- Node.js 20.9 or later (LTS recommended)
- VS Code or another editor
- Modern mobile/desktop browser
- Camera permission and a secure context (HTTPS, or localhost during local development)

## Proposed production architecture
- Next.js PWA frontend for mobile browser use.
- Supabase Postgres for floors, nodes, edges, places and published map metadata.
- Supabase Auth for authorized administrators if an admin editor is added.
- Public read-only access to approved published navigation data through tightly scoped RLS policies or a safe server endpoint.
- Admin-only write operations; never expose the Supabase service-role key to the browser.
- Static floor-plan assets hosted with appropriate access controls.

## Technical decisions
- Keep node IDs permanent so signage QR codes survive room-name changes.
- Store graph coordinates in surveyed map coordinates or meters, then map them consistently to SVG coordinates.
- Treat route distance as approximate until measured and validated on site.
- Run routing on the client for a small campus graph; consider server-side routing only if requirements grow.
- PWA/offline caching is a later enhancement, not a current guarantee.

## Deferred technology
- BLE/UWB/Wi-Fi RTT: evaluate only if continuous indoor positioning is a confirmed requirement and a measured pilot justifies hardware/cost.
- WebXR/AR: defer until ordinary QR + map + routing is reliable.
