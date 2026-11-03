# FRONTEND_GUIDELINES — CampusPath

## UX principles
- Phone-first: primary controls must be comfortable on a small screen and usable with one hand.
- One clear next action per step: scan/start, choose destination, follow route, verify arrival.
- Use plain language and bilingual-friendly labels; keep room IDs exactly as used on campus.
- Show current checkpoint and destination separately.
- Label all schematic or unverified maps as demo data.
- Never represent the route line as a live position dot.

## Visual system
- Blue: route line and navigation focus.
- Green: current/confirmed start or successful verification.
- Amber: rooms/destination markers.
- Red or neutral warning treatment: invalid QR, mismatch, no route, permission issue.
- Maintain adequate contrast, visible focus styles, and readable text at mobile sizes.

## Map behavior
- Render only the relevant floor map(s) for the route.
- Show stairs/lift transitions clearly and state which floor to go to next.
- Keep room labels readable; avoid overlapping labels where possible.
- Route lines must follow surveyed walkable corridors and must not cross walls.
- Use the same coordinate transformation for nodes and route geometry.
- Provide written directions so the map is not the only source of guidance.

## Accessibility and input
- Use semantic headings, labels, buttons, and status regions.
- Ensure the QR scanner is opened by explicit user action and can be closed.
- Explain camera permissions and offer a fallback when scanning is unavailable.
- Do not rely on color alone to communicate success or errors.
- Accessibility mode must only advertise routes supported by verified accessible graph edges.

## States to design and test
- Initial/no checkpoint selected.
- Camera permission denied or camera not available.
- QR scanned and recognized.
- Unknown/malformed QR.
- Destination selected and route available.
- No path available.
- Floor transition.
- Correct destination QR.
- Wrong destination QR.
- Loading/error state for future Supabase requests.
