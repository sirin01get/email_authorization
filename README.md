# Email Authorization Prototype Guide

This is a step-by-step guide for a small end-to-end onboarding prototype:

1. Visitor enters an email.
2. Supabase Auth sends a magic link through Resend SMTP.
3. User clicks the link and receives a Supabase session.
4. The app writes one protected row to Postgres.
5. A Cloudflare Worker checks the Supabase JWT before allowing premium actions.
6. The first feature is: create 3 free items, block the 4th.

Sources checked on 2026-07-01:

- Resend Supabase SMTP guide: https://resend.com/docs/send-with-supabase-smtp
- Resend pricing/free plan: https://resend.com/pricing
- Resend domain guide: https://resend.com/docs/dashboard/domains/introduction
- Supabase custom SMTP guide: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase RLS guide: https://supabase.com/docs/guides/database/postgres/row-level-security
- Cloudflare Workers docs: https://developers.cloudflare.com/workers/

## 0. What Resend Free Gives You

Resend can be used for this prototype on the free plan.

Current free-plan limits shown by Resend:

- $0/month
- 3,000 emails/month
- 100 emails/day
- 1 custom domain
- SMTP relay included

Important: Resend requires a domain you own and verify before normal sending. For this prototype, use a subdomain such as `auth.yourdomain.com` if you do not want to mix auth mail with your main domain reputation.

## 1. Create The GitHub Repo

You already have:

```text
https://github.com/sirin01get/email_authorization.git
```

Keep the project boring:

```text
web-app/
supabase/
cloudflare-worker/
resend/
README.md
```

Suggested first commit:

```bash
git clone https://github.com/sirin01get/email_authorization.git
cd email_authorization
mkdir web-app supabase cloudflare-worker resend
git add .
git commit -m "Add email authorization prototype structure"
git push origin main
```

## 2. Set Up Resend For Free

1. Go to https://resend.com and create a free account.
2. Open the Resend dashboard.
3. Add a domain you own.
4. Copy the DNS records Resend gives you.
5. In Cloudflare DNS, add those records exactly.
6. Wait until Resend marks the domain as verified.
7. Create an API key in Resend.
8. Save the key somewhere secure. You will use it as the SMTP password in Supabase.

Use these SMTP values in Supabase:

```text
Host: smtp.resend.com
Port: 465
Username: resend
Password: your Resend API key
Sender email: no-reply@your-verified-domain.com
Sender name: Your App Name
```

Do not add the Resend API key to frontend code or commit it to GitHub.

## 3. Configure Supabase Auth

1. Create or open your Supabase project.
2. Go to Authentication.
3. Enable email sign-in / magic-link sign-in.
4. Go to Authentication > Email or SMTP settings.
5. Enable custom SMTP.
6. Enter the Resend SMTP settings:

```text
Host: smtp.resend.com
Port: 465
Username: resend
Password: RESEND_API_KEY
Sender email: no-reply@your-verified-domain.com
Sender name: Your App Name
```

7. Add your app URL to allowed redirect URLs.

For local development, add:

```text
http://localhost:5173
http://localhost:5173/auth/callback
```

After deployment, add your production URL too, for example:

```text
https://your-app.pages.dev
https://your-app.pages.dev/auth/callback
```

## 4. Create The Protected Table With RLS

In Supabase SQL editor, run:

```sql
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

alter table public.items enable row level security;

create policy "Users can read their own items"
on public.items
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Users can create their own items"
on public.items
for insert
to authenticated
with check ((select auth.uid()) = owner_id);
```

The frontend must insert rows with:

```js
{
  owner_id: session.user.id,
  title: "Example item"
}
```

This proves data ownership. A logged-in user can create and read only their own rows.

## 5. Add The "3 Free Items, Block The 4th" Rule

The clean prototype rule is:

- Supabase RLS protects item ownership.
- Cloudflare Worker checks the JWT.
- Worker counts existing items for that user.
- If count is 0, 1, or 2, forward the request.
- If count is 3 or more, return `402` or `403` with an upgrade message.

For the Worker, do not use the Supabase service role unless the endpoint absolutely needs it. For the MVP, the Worker can call Supabase using the user's JWT so RLS still applies.

Worker environment variables:

```text
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your Supabase publishable/anon key
```

Minimal Worker behavior:

```js
export default {
  async fetch(request, env) {
    const auth = request.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }

    const countResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/items?select=id`,
      {
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          authorization: `Bearer ${token}`,
          prefer: "count=exact",
        },
      }
    );

    if (!countResponse.ok) {
      return new Response("Unauthorized", { status: 401 });
    }

    const contentRange = countResponse.headers.get("content-range") || "";
    const count = Number(contentRange.split("/")[1] || "0");

    if (count >= 3) {
      return new Response("Upgrade required: free users can create 3 items.", {
        status: 402,
      });
    }

    return fetch(request);
  },
};
```

Later, replace `return fetch(request)` with forwarding to your actual premium endpoint.

## 6. Build The Web App

Use the smallest possible frontend:

- Email input
- "Send magic link" button
- Auth callback route
- Create item form
- List current user's items
- Button that calls the Cloudflare-protected action

Frontend environment variables:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your Supabase publishable/anon key
VITE_EDGE_GATE_URL=https://your-worker.your-subdomain.workers.dev
```

Magic link call:

```js
await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

Create item call:

```js
const { data: sessionData } = await supabase.auth.getSession();
const user = sessionData.session.user;

await supabase.from("items").insert({
  owner_id: user.id,
  title,
});
```

Cloudflare-protected call:

```js
const { data } = await supabase.auth.getSession();

await fetch(import.meta.env.VITE_EDGE_GATE_URL, {
  method: "POST",
  headers: {
    authorization: `Bearer ${data.session.access_token}`,
  },
});
```

## 7. Deploy Through GitHub

Recommended simple path:

1. Push `web-app/` and `cloudflare-worker/` to GitHub.
2. Deploy the frontend from GitHub using Cloudflare Pages.
3. Set frontend environment variables in Cloudflare Pages.
4. Deploy the Worker with Wrangler or from the Cloudflare dashboard.
5. Set Worker secrets/variables in Cloudflare:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

6. Add the deployed Cloudflare Pages URL to Supabase Auth redirect URLs.
7. Test the full flow:

```text
open app -> enter email -> receive Resend magic link -> click link
-> session exists -> create item 1 -> create item 2 -> create item 3
-> try item 4/premium action -> blocked by Worker
```

## 8. Success Checklist

You are done when all of these pass:

- Resend domain is verified.
- Supabase custom SMTP sends the magic link through Resend.
- User can click the magic link and get a Supabase session.
- User can create one row in `public.items`.
- A second user cannot read the first user's row.
- Cloudflare Worker accepts requests with a valid Supabase access token.
- Cloudflare Worker blocks the 4th free action.
- No secret keys are committed to GitHub.

## 9. Keep These Boundaries

- Resend is only SMTP for auth email.
- Supabase is the only identity system.
- RLS is the source of database ownership protection.
- Cloudflare is the edge gate for premium actions.
- Do not add billing, roles, teams, or marketing emails until this flow works.
