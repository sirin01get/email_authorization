# Working State

## Current Status

Building. The Join UI and client-side Supabase magic-link behavior are present.

## Known Good Checkpoint

Prior pushed UI commit: `bc52776 Add SIRINGET welcome page`.

## Verification

Current change should pass:

- JavaScript syntax check for `web-app/app.js`.
- Browser rendering for guest state.
- Browser rendering for configured/unconfigured form state.
- Manual live magic-link test after real Supabase values are inserted.

## Rollback Path

Revert the commit that adds the Join flow, or restore `web-app/index.html` and
`web-app/styles.css` to commit `bc52776`.

## Do Not Break

- The minimalist welcome page visual tone.
- Static Cloudflare Pages deployability.
- No private secrets in client code.

## Next Safe Step

Fill `config.js`, add the deployed Pages URL to Supabase Auth redirect URLs, and
perform a real email-link test.
