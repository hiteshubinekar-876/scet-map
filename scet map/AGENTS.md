# AGENTS.md — Working Agreement for Coding Agents

## Project goal
Maintain CampusPath, a mobile-first QR-assisted college indoor navigation prototype. The product uses checkpoint scans, a graph-based route and destination QR comparison. It does not currently provide continuous live indoor tracking.

## Read first
Before changing code, read these files in order:
1. `docs/PRD.md`
2. `docs/APP_FLOW.md`
3. `docs/TECH_STACK.md`
4. `docs/DB_BACKEND.md`
5. `docs/FRONTEND_GUIDELINES.md`
6. `docs/IMPLEMENTATION_PLAN.md`
7. `AGENTS.md`
8. `PROGRESS.md`

## Engineering rules
- Use TypeScript and follow the existing Next.js App Router structure.
- Keep changes small and aligned with the current implementation phase.
- Do not invent real college room data, coordinates, dimensions or routes. Mark all unverified values as demo data.
- Do not claim that QR checkpoints provide continuous tracking.
- Never describe static QR scans as secure identity or attendance proof.
- Do not expose Supabase service-role keys or other secrets in client code.
- Preserve accessible labels, clear status messages and camera permission fallbacks.
- Do not advertise an accessible route unless the graph explicitly marks and verifies its edges.
- Keep QR payloads based on permanent IDs, not mutable room names.
- Do not install new dependencies unless needed; explain why in the implementation notes.

## Validation before marking work complete
- Run `npm run build` for meaningful code changes.
- Run `npm run lint` if the repository's lint setup is functional; report any pre-existing failure accurately.
- Test route success, unreachable destination, unknown node, QR mismatch and floor transitions where relevant.
- Inspect mobile layout and camera flow when changing scanning or navigation UI.
- Update `PROGRESS.md` with completed work, tests actually run, known issues and next step.

## Data and security
- Treat URL parameters and QR contents as untrusted input.
- Validate node IDs against known published graph data.
- Keep admin writes protected by authentication and database policies.
- Collect no personal data unless explicitly required, approved and documented.
