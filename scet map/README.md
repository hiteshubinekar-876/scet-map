# CampusPath — College Indoor Navigation (prototype)

Phone-first Next.js prototype for QR-assisted indoor wayfinding. Includes a browser QR scanner, sample multi-floor graph, Dijkstra shortest path, floor-by-floor SVG route, and destination QR comparison.

## 1) Requirements
- Node.js 20.9+ (LTS recommended)
- VS Code or any editor
- Android phone camera/browser for testing QR scanning
- For camera access, deploy over HTTPS or test on `localhost`. Browser camera permission is required.

## 2) Run on laptop
Open this folder in VS Code terminal:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Use the dropdown demo start point or scan a QR. The camera may work on localhost; for phone testing, deploy to an HTTPS host or expose your dev server securely on the same Wi-Fi with HTTPS.

## 3) Demo QR URLs
Use your deployed URL in place of `https://YOUR-DOMAIN`:

- Gate: `https://YOUR-DOMAIN/?node=GATE`
- First-floor checkpoint: `https://YOUR-DOMAIN/?node=F1_STAIRS`
- Room S-34: `https://YOUR-DOMAIN/verify?target=F1_S34&node=F1_S34`
- Room S-36: `https://YOUR-DOMAIN/verify?target=F1_S36&node=F1_S36`

The scanner reads the `node` query parameter. The verification page compares the scanned node ID to the selected/saved destination.

## 4) Replace demo college map/data
Edit `lib/graph.ts`:
- `nodes`: ID, floor, name, x/y position and node type.
- `edges`: walkable connections and approximate distances.
- Use unique permanent IDs; encode only IDs in QR URLs, not room names.
- Coordinates are demo positions, not a surveyed drawing. The current SVG is schematic and must not be used as a real navigation map until replaced.
- Ensure every edge is physically walkable. Never connect through walls or courtyards. Add stairs/lift links between corresponding floors.

## 5) Add actual floor plans
For the prototype, map drawings are schematic SVGs. For a real deployment, obtain an approved plan, confirm scale and doors/corridors on-site, then update `FloorMap` in `app/page.tsx` to render each floor's surveyed SVG/image and transform surveyed coordinates consistently.

## 6) Supabase (optional next step)
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local`, then set the project URL and anon key.
4. This starter currently uses in-code demo data; it does not yet fetch graph data from Supabase. Connect `lib/graph.ts` to Supabase only after the prototype flow is tested.
5. Keep write permissions admin-only. Never put a service-role key in browser code.

## 7) Important limitations
- A QR scan gives a known checkpoint only at scan time. The blue route line is a route overlay, not a continuously moving live-location dot.
- GPS indoors is not reliable for room-level positioning. For position updates, scan QR checkpoints at junctions/stairs/lifts, or later investigate BLE beacons/UWB/Wi-Fi RTT with a measured test.
- Static QR codes can be photographed/copied. This verifies the QR ID, not the person's identity or secure attendance. Attendance needs authentication and stronger anti-replay checks.
- The sample route graph, floor numbers, distances and rooms are fictitious demo data. Survey and get college permission before printing/installing signs.

## Suggested build order
1. Run locally and test demo flow.
2. Survey one floor and correct its map/graph.
3. Test route with 5–10 students and correct wrong paths.
4. Add real Supabase reads and a protected admin editor.
5. Print QR labels only after the college approves the surveyed route.
