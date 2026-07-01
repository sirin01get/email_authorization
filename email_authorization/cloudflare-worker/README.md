# Cloudflare Worker Edge Gate

Cloudflare project name: `rare`.

This Worker protects the prototype item creation endpoint:

- Validates the Supabase access token with Supabase Auth.
- Counts the current user's rows in the `prototypes.items` table.
- Allows creation for the first 3 items.
- Blocks the 4th item with `402 upgrade_required`.
- Sends Supabase REST requests with the user's JWT so Postgres RLS remains active.

## Required Supabase Table

The Worker assumes this table shape in the `prototypes` schema:

```sql
create table prototypes.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);
```

RLS should allow authenticated users to select and insert only their own rows.

## Environment Variables

Set these in Cloudflare:

```text
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your Supabase publishable/anon key
```

These are already defaulted in `wrangler.jsonc`, but you can change them:

```text
SUPABASE_SCHEMA=prototypes
SUPABASE_ITEMS_TABLE=items
FREE_ITEM_LIMIT=3
ALLOWED_ORIGIN=*
```

For production, replace `ALLOWED_ORIGIN=*` with your frontend URL.

## Local Development

Create `cloudflare-worker/.dev.vars` locally:

```text
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your Supabase publishable/anon key
ALLOWED_ORIGIN=http://localhost:5173
```

Then run:

```bash
cd cloudflare-worker
npm install
npm run dev
```

## Deploy

```bash
cd cloudflare-worker
npm install
npx wrangler deploy
```

Wrangler will deploy this Worker as `rare`, matching the `name` in
`wrangler.jsonc`.

After deploy, call:

```http
POST https://rare.YOUR_WORKERS_SUBDOMAIN.workers.dev/v1/items
Authorization: Bearer SUPABASE_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "First item"
}
```

Expected results:

- Items 1, 2, and 3 return `201`.
- Item 4 returns `402`.
- Missing or invalid token returns `401`.
