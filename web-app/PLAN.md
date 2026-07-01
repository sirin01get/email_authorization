# Plan

## Objective

Create a sleek `Join in` button on the landing page where a user enters an
email address to register. Supabase should trigger a magic-link email through
the configured Resend SMTP provider. After the user verifies the email link, the
landing page appears with an active authenticated session.

## Success Criteria

- Guest users see a polished `Join in` button.
- Clicking `Join in` opens an email capture form.
- Submitting a valid email calls `supabase.auth.signInWithOtp`.
- The magic link redirects back to the landing page.
- The page detects the Supabase session and shows verified access.
- No secret keys are exposed in client code.

## Scope

In scope:

- Static frontend changes under `web-app/`.
- Runtime public Supabase configuration.
- Planning and test documentation.

Out of scope:

- Changing Supabase SMTP settings.
- Changing database schema or RLS.
- Creating billing, roles, or entitlement logic.

## Assumptions

- Supabase email auth is enabled.
- Resend SMTP is already configured in Supabase.
- The deployed Cloudflare Pages URL will be added to Supabase Auth redirect URLs.
- `config.js` will be filled with public Supabase values before live testing.

## Constraints

- This must remain deployable as a static Cloudflare Pages site.
- The browser must not contain service-role secrets or Resend API keys.
- The root `README.md` currently has unrelated local edits and should not be touched.

## Implementation Phases

1. Document the plan change in `web-app/` docs.
2. Add public Supabase runtime config.
3. Add Join form markup and styling.
4. Add Supabase magic-link behavior.
5. Verify static rendering and JavaScript syntax.
6. Push changes after tests pass.

## Risks and Mitigations

- Redirect URL mismatch: document that Supabase must allow the deployed URL.
- Missing config: show a friendly configuration status instead of a broken form.
- Secret exposure: use only public Supabase browser credentials.
- CDN dependency: use pinned major `@supabase/supabase-js@2` from jsDelivr for static deployment.

## Open Questions

- Final Cloudflare Pages URL is needed for the exact `magicLinkRedirectUrl`.
