# Architecture

## Overview

The landing page is a static client application. Supabase Auth owns identity.
Supabase sends magic-link email through its configured Resend SMTP provider.

## Components

- `index.html`: welcome page, Join button, email form, verified-user panel.
- `styles.css`: responsive minimalist design system.
- `app.js`: Supabase client, magic-link request, session detection, sign-out.
- `config.js`: public deployment-time Supabase values.
- Supabase Auth: registration, magic links, session issuance.
- Resend SMTP: email delivery path configured inside Supabase.

## Runtime Flow

```mermaid
flowchart TD
  Guest[Guest opens landing page] --> Join[Clicks Join in]
  Join --> Email[Enters email address]
  Email --> Supabase[Supabase signInWithOtp]
  Supabase --> Resend[Resend SMTP sends magic link]
  Resend --> Click[User clicks email link]
  Click --> Landing[Landing page loads]
  Landing --> Session[Supabase client detects session]
  Session --> Verified[Verified access panel appears]
```

## Sequence

```mermaid
sequenceDiagram
  participant U as User
  participant UI as Landing Page
  participant SA as Supabase Auth
  participant R as Resend SMTP
  U->>UI: Enter email and submit
  UI->>SA: signInWithOtp(email, redirect URL)
  SA->>R: Send magic-link email
  R-->>U: Email arrives
  U->>UI: Open magic link redirect
  UI->>SA: Detect and load session
  SA-->>UI: Session
  UI-->>U: Show verified access
```

## Security and Permissions

- The frontend uses only the Supabase public anon/publishable key.
- Resend API credentials stay inside Supabase SMTP configuration.
- Service-role keys must never be added to `config.js`.
- Database ownership and premium gates remain separate from this UI flow.

## Deployment

Deploy `web-app/` as a static Cloudflare Pages project. Set Supabase Auth redirect
URLs to the final Pages URL. If the deployed path changes, update
`magicLinkRedirectUrl` in `config.js`.
