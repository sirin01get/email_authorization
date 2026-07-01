# Test Run

## 2026-07-01

Project folder: `C:\SIRINGET\makers\Prototype\EmailAuth\email_authorization\web-app`

Commit before this run: `2ae6193`

Environment:

- Browser QA via local Chrome where available.
- Supabase config currently uses placeholders.
- Live magic-link email cannot be fully tested until real public Supabase values and redirect URLs are set.

## UI Screenshots

- Guest - views landing page (`TC-002`): `test-artifacts/guest-landing-desktop.png`
- Guest - opens Join form on desktop (`TC-003`, `TC-004`): `test-artifacts/join-form-desktop.png`
- Guest - opens Join form on mobile (`TC-002`, `TC-003`): `test-artifacts/join-form-mobile.png`

## Results

| ID | Name | Result | Evidence | Notes |
| --- | --- | --- | --- | --- |
| TC-001 | JavaScript Syntax | Pass | `node --check web-app\app.js` exited successfully. | Worker syntax was also checked with `node --check cloudflare-worker\src\index.js`. |
| TC-002 | Guest Landing Page | Pass | Browser screenshots saved in `test-artifacts/`; desktop and mobile had no horizontal overflow. | Chrome rendered the local static page. |
| TC-003 | Join Form Opens | Pass | Clicked `Join in`; Join panel became visible on desktop and mobile. | Email input was fillable on desktop. |
| TC-004 | Missing Config Is Safe | Pass | Submitting with placeholder config showed: `Add your Supabase URL and public key in config.js before sending links.` | No page errors were reported. |
| TC-005 | Live Magic Link | Fail | Requires real Supabase public config and redirect URL. | Cannot pass in this local placeholder state. |
