# Decisions

## 2026-07-01 - Static Supabase Magic-Link Join Flow

**Status:** Accepted

**Context:** The landing page needs registration without adding backend
infrastructure. Supabase Auth and Resend SMTP are already part of the prototype.

**Decision:** Keep the landing page static and call
`supabase.auth.signInWithOtp()` from browser JavaScript using the public
Supabase key.

**Alternatives:** Build a custom API route or Cloudflare Worker to initiate auth
emails.

**Consequences:** The implementation stays simple and deployable on Cloudflare
Pages. The page depends on correct public Supabase config and allowed redirect
URLs.
