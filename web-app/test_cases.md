# Test Cases

## TC-001 - JavaScript Syntax

**Description:** Ensure the client auth script parses before deployment.

**How to test:** Run `node --check web-app/app.js` from the repo root.

**Verification:** Command exits successfully.

**Expected result:** Pass with no syntax errors.

## TC-002 - Guest Landing Page

**Description:** Guest users should see the welcome page and `Join in` button.

**How to test:** Open `web-app/index.html` in desktop and mobile browser sizes.

**Verification:** Hero, headline, intro copy, `Join in`, and principles render without overlap or horizontal overflow.

**Expected result:** Guest landing page is polished and readable.

## TC-003 - Join Form Opens

**Description:** The `Join in` button should reveal the email capture panel.

**How to test:** Click `Join in`.

**Verification:** Email field, `Send link` button, and explanatory copy appear.

**Expected result:** User can enter an email address.

## TC-004 - Missing Config Is Safe

**Description:** Placeholder Supabase config should not crash the page.

**How to test:** Submit the form while `config.js` contains placeholders.

**Verification:** A friendly configuration message appears.

**Expected result:** No network request is attempted and no secret is required.

## TC-005 - Live Magic Link

**Description:** With real Supabase public config and redirect URL, submitting the form should send a magic-link email.

**How to test:** Fill real `config.js`, deploy, submit an email, and click the email link.

**Verification:** The landing page returns with a session and shows verified access.

**Expected result:** User is registered/signed in and sees the landing page.
