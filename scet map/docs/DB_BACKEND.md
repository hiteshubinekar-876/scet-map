# DB/BACKEND — CampusPath

## Current state
The app currently uses demo graph data in `lib/graph.ts`. `supabase/schema.sql` is a starting schema; the frontend does not yet fetch graph data from Supabase. Do not assume the database is connected until that integration is implemented and tested.

## Core entities
- `floors`: floor identifier, display name/number, map asset URL and coordinate metadata.
- `nodes`: permanent checkpoint/room/junction IDs, floor, label, type, map coordinates and accessibility metadata.
- `edges`: walkable connection between nodes, distance, type (`walk`, `stairs`, `lift`), directionality and accessibility.
- `places`: searchable room/lab names and aliases mapped to a node.
- Optional future `arrival_events`: minimal verification logs only if the college has a valid need and privacy notice.

## Graph rules
- Each edge must connect two valid nodes.
- Edge distance must be positive.
- Edges must represent physically walkable routes; never cross walls, closed rooms or open-to-sky voids.
- Stairs/lifts must connect the correct floors at matching transition locations.
- Directed edges should only be used when one-way access is confirmed by college staff.
- Every intended destination should be reachable from an appropriate start point.
- Accessible routing must use verified accessible edges; do not infer accessibility from the presence of a lift alone.

## QR and API contract
- QR codes contain a stable node ID or a URL containing that ID.
- Validate all supplied IDs against published graph data.
- Unknown IDs must fail safely with a useful error.
- Do not trust a URL parameter as proof of identity or attendance.
- If arrival logs are implemented, minimize collected data, define retention, restrict access, and obtain college approval.

## Supabase setup
1. Create a Supabase project.
2. Run `supabase/schema.sql` in SQL Editor.
3. Copy `.env.example` to `.env.local` and fill the project URL and public anon key.
4. Add suitable Row Level Security policies before connecting the browser client.
5. Implement and test a typed graph-fetching layer; do not replace the working demo data until empty/loading/error states are handled.
6. Keep all administrative writes protected by authentication and authorization.

## Validation checklist
- Unique IDs and valid floor references.
- No orphan nodes unless explicitly intended.
- Positive edge distances and valid edge types.
- Every public room has a valid node and at least one route from the entrance.
- Accessibility routes are tested separately.
- QR URL IDs match the published graph and verification logic.
