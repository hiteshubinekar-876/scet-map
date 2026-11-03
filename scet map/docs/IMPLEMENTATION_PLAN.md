# IMPLEMENTATION_PLAN — CampusPath

## Phase 0 — Confirm the site and scope
- Get college permission and an approved floor plan.
- Select one pilot floor and list entrance, room doors, corridor junctions, stairs and lifts.
- Survey actual walkable connections, key distances, access restrictions and accessible paths.
- Confirm room labels and permanent IDs with the college.

**Exit criteria:** one reviewed floor plan and a survey sheet with nodes/edges.

## Phase 1 — Validate the current prototype
- Install dependencies and run locally.
- Test gate/checkpoint URL handling.
- Test room selection, Dijkstra route, floor display and written steps.
- Test correct, incorrect and unknown QR behavior.
- Test camera access on the target Android phone over HTTPS.

**Exit criteria:** demo flow works; known limitations are visible.

## Phase 2 — Replace demo graph with one surveyed floor
- Replace sample nodes/edges and schematic floor map.
- Calibrate map coordinates against surveyed dimensions.
- Add checkpoints only where they improve navigation decisions.
- Walk every route and fix wall-crossing or inaccessible edges.

**Exit criteria:** pilot routes are physically correct on one floor.

## Phase 3 — Add Supabase integration
- Apply schema and RLS policies.
- Implement typed reads for published floors, nodes, edges and places.
- Add loading, empty and error states.
- Keep a safe fallback or clear error if the graph cannot load.

**Exit criteria:** published graph drives the UI without client-side secrets.

## Phase 4 — Pilot test
- Test with 5–10 students/visitors who have not memorized the building.
- Record failed searches, wrong turns and checkpoint confusion without collecting unnecessary personal data.
- Update aliases, signs and directions from observed failures.
- Include a separate test of accessible routes.

**Exit criteria:** major route failures are resolved and testers can reach target rooms.

## Phase 5 — Expand and deploy
- Add remaining floors and stairs/lift links.
- Publish QR labels only after final ID/route checks and college approval.
- Deploy to an HTTPS domain and test supported mobile browsers.
- Document who owns map updates and QR replacement after room changes.

## Phase 6 — Optional enhancements
- PWA offline cache.
- Protected admin map editor and graph validator.
- Multilingual UI (English, Hindi, Marathi).
- Evaluate BLE/UWB or other positioning only if live tracking is a real requirement.

## Definition of done for MVP
- Gate QR → browser → destination → route → destination QR verification works on a real phone.
- Surveyed routes do not cross walls or closed areas.
- Unknown/mismatched QR codes cannot display false success.
- No claim of continuous indoor tracking or secure attendance.
