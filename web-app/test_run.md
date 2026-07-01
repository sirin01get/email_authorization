# Test Run

## 2026-07-01

Project folder: `C:\SIRINGET\makers\Prototype\EmailAuth\email_authorization\web-app`

Commit before this run: `2ae6193`

Environment:

- Browser QA via local Chrome where available.
- Supabase config has public project values.
- Live magic-link email was not re-sent during automated QA; success behavior was verified with a mocked Supabase response to avoid sending another email.

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
| TC-004 | Join Form Success Closes Popup | Pass | Mocked successful Supabase response; popup closed after 1.5 seconds and page notice showed `Verification email sent to qa@example.com...`. | Regression check for stuck sending popup and `{}`-style unclear feedback. |
| TC-005 | Missing Config Is Safe | Pass | Submitting with placeholder config showed: `Add your Supabase URL and public key in config.js before sending links.` | No page errors were reported. |
| TC-006 | Live Magic Link | Fail | Not re-run in automated QA to avoid sending another real email. | User reported the live attempt reached sending state but feedback/autoclose was poor; this commit fixes the UI handling around that response. |
