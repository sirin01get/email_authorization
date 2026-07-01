# Roadmap

## Phase 0 - Setup and Discovery

- Confirm Supabase SMTP through Resend is configured.
- Confirm database schema exists in `prototypes`.

## Phase 1 - Minimal Working Version

- Add Join button.
- Add email capture form.
- Trigger Supabase magic link.
- Detect session after email verification.

## Phase 2 - Core Workflows

- Add item creation after verified sign-in.
- Connect to the `rare` Cloudflare Worker for free-limit gating.

## Phase 3 - Hardening and Tests

- Test real redirect URLs on Cloudflare Pages.
- Add error states for expired or invalid magic links.
- Verify mobile layout after auth states are visible.

## Phase 4 - Deployment and Operations

- Deploy `web-app/` to Cloudflare Pages.
- Deploy Worker `rare`.
- Record final URLs and Supabase redirect settings.

## Deferred Ideas

- Branded email template.
- Invite-only allowlist.
- User profile row after first login.
