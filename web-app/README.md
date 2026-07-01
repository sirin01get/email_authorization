# SIRINGET Web App

## Project

This folder contains the static landing page for SIRINGET to RARE BUILD.

## Objective

Add a sleek `Join in` button that collects an email address, asks Supabase Auth
to send a magic link through the already configured Resend SMTP provider, and
returns verified users to the landing page with an active Supabase session.

## Start Here

1. Read `PLAN.md` for the current implementation scope.
2. Read `ARCHITECTURE.md` for the auth flow and deployment shape.
3. Fill `config.js` with the Supabase project URL and public anon/publishable key.
4. In Supabase Auth redirect URLs, allow the deployed landing page URL.
5. Deploy this folder as a static Cloudflare Pages site.

## Current Status

Building: the UI and client-side Supabase magic-link request are implemented.
Live email delivery requires real values in `config.js` and matching Supabase
redirect URL settings.

## Already Accomplished

- Professional minimalist welcome page.
- Project-bound hero image asset.
- Client-side Join flow using Supabase magic links.
- Planning and test documentation for the auth-flow change.

## How To Work In This Repo

- Do not commit Supabase service-role keys or Resend API keys.
- Browser code may use only the Supabase public anon/publishable key.
- Keep the page static unless a backend becomes necessary.
- Preserve the visual tone: minimal, professional, quiet, and readable.

## Important Files

- `index.html`: landing page markup and Join form.
- `styles.css`: responsive visual system.
- `app.js`: Supabase magic-link behavior.
- `config.js`: public runtime config placeholders.
- `PLAN.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `WORKING_STATE.md`, `ROADMAP.md`: planning state.
- `test_cases.md`, `test_run.md`: verification record.

## Skills To Load Before Starting

- `supabase`
- `software-planning`
- `test-case-runner`

## Verification

Use a browser to verify desktop and mobile layouts, then perform a real magic
link test after `config.js` and Supabase redirect URLs are configured.
