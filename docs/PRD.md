# PRD — CampusPath College Indoor Navigation

## 1. Product summary
CampusPath is a mobile-first web app that helps students find classrooms and labs inside a college building using QR checkpoints, a floor map, a blue route line, and destination QR verification. It is a QR-assisted navigation prototype, not continuous indoor positioning.

## 2. Problem
Students and visitors can struggle to find rooms in multi-floor college buildings. Outdoor GPS is generally not accurate enough to identify an indoor room or floor. CampusPath uses known QR checkpoint IDs to establish a starting point and verify arrival at a destination.

## 3. Goals
- Open in a phone browser after scanning a gate QR; no native app installation required.
- Let users search/select a destination room.
- Calculate a walkable route across corridors and connected floors.
- Render a floor-specific map and blue route overlay, with text directions.
- Allow users to scan a destination QR and compare it with the intended room.
- Support an accessibility preference to avoid stairs when an accessible route exists.
- Keep the first release small enough to pilot on one surveyed floor.

## 4. Non-goals for MVP
- Continuous live blue-dot tracking between QR scans.
- Attendance, identity proof, anti-cheat guarantees, or secure proof of presence.
- AR navigation, BLE/UWB positioning, or indoor GPS replacement.
- Emergency/fire-safety certification.
- Production admin portal and multi-college tenancy.

## 5. Primary users
- Students and freshers looking for rooms.
- Visitors and parents unfamiliar with the building.
- College staff/admin who maintain room and route data (future protected admin workflow).

## 6. Core user journey
1. Scan entrance QR with phone camera.
2. Browser opens CampusPath with a known start node ID.
3. Select/search a room.
4. App computes a route from the current checkpoint.
5. Follow the blue line and text steps; scan additional checkpoint QR codes if location needs updating.
6. Scan destination QR.
7. App compares scanned node ID with the selected destination and shows success or mismatch.

## 7. Functional requirements
- FR-1: Accept a known checkpoint from URL query parameter `node` (legacy `s` may be supported).
- FR-2: Offer a demo start-point selector if a QR is not scanned.
- FR-3: List searchable/selectable destination rooms.
- FR-4: Find a shortest path on the walkable graph using Dijkstra's algorithm.
- FR-5: Support corridor, stairs, and lift edges; avoid stairs when accessibility mode is selected if an alternative exists.
- FR-6: Draw route segments on the relevant floor map and show written steps.
- FR-7: Scan QR in-browser where camera permissions and secure context permit.
- FR-8: Verify the scanned destination node against the requested target and report match/mismatch.
- FR-9: Provide clear errors for unknown QR IDs and unreachable destinations.
- FR-10: Keep demo data visibly identified as fictional and unsurveyed.

## 8. Non-functional requirements
- Phone-first responsive layout and accessible labels/status messages.
- QR scanner only runs after user action and camera permission.
- No service-role database secret in client-side code.
- Route graph must be surveyed and validated before real campus deployment.
- Navigation should not imply that the phone is continuously tracking the user.

## 9. MVP success criteria
- A new user can scan a gate QR, choose a room, view a route, and complete a matching room-QR verification on a supported phone.
- Invalid/mismatched QR codes show an understandable message.
- A pilot tester can follow a surveyed one-floor route without crossing walls or closed areas.
- Route and map data can be updated without changing QR IDs when room labels change.

## 10. Risks and mitigations
- Incorrect plans or graph edges: survey on site and pilot with students before printing QR labels.
- Static QR copied/shared: treat as navigation verification only; do not use as secure attendance proof.
- Weak network: later cache published graph/map assets in a PWA.
- Camera unavailable: provide a manual/demo start selector and a clear permission explanation.
- Accessibility path missing: show that no accessible route is available instead of silently routing through stairs.

## 11. Assumptions and open decisions
- College grants permission to use floor plans and install QR signage.
- Real floor plans, room names, access restrictions, and walking distances are not yet supplied.
- First pilot is one floor; additional floors are added after the first is validated.
