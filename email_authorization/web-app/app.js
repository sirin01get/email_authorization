const config = window.SIRINGET_CONFIG || {};
const elements = {
  openJoin: document.querySelector("[data-open-join]"),
  closeJoin: document.querySelector("[data-close-join]"),
  joinPanel: document.querySelector("[data-join-panel]"),
  joinForm: document.querySelector("[data-join-form]"),
  emailInput: document.querySelector("[data-email-input]"),
  submitJoin: document.querySelector("[data-submit-join]"),
  status: document.querySelector("[data-auth-status]"),
  pageNotice: document.querySelector("[data-page-notice]"),
  guestActions: document.querySelector("[data-guest-actions]"),
  memberPanel: document.querySelector("[data-member-panel]"),
  userEmail: document.querySelector("[data-user-email]"),
  signOut: document.querySelector("[data-sign-out]"),
};

const SLOW_SEND_NOTICE_MS = 3500;
const SEND_TIMEOUT_MS = 20000;

const isConfigured =
  Boolean(config.supabaseUrl) &&
  Boolean(config.supabaseAnonKey) &&
  !config.supabaseUrl.includes("YOUR_PROJECT_REF") &&
  !config.supabaseAnonKey.includes("YOUR_SUPABASE");

elements.openJoin?.addEventListener("click", () => {
  openJoinPanel();
});

elements.closeJoin?.addEventListener("click", () => {
  closeJoinPanel();
});

elements.joinPanel?.addEventListener("click", (event) => {
  if (event.target === elements.joinPanel) {
    closeJoinPanel();
  }
});

elements.joinForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isConfigured) {
    setStatus("Add your Supabase URL and public key in config.js before sending links.", "error");
    return;
  }

  const email = elements.emailInput.value.trim();
  if (!email) {
    setStatus("Enter an email address to continue.", "error");
    return;
  }

  setLoading(true);
  clearPageNotice();
  setStatus("Sending your secure magic link...", "neutral");

  let slowSendNoticeShown = false;
  const slowSendTimer = window.setTimeout(() => {
    slowSendNoticeShown = true;
    setPageNotice(
      "Still sending your verification email. You can stay on this page while we finish.",
      "success"
    );
    closeJoinPanel();
  }, SLOW_SEND_NOTICE_MS);

  let result;
  try {
    result = await withTimeout(sendMagicLink(email), SEND_TIMEOUT_MS);
  } catch (error) {
    window.clearTimeout(slowSendTimer);
    setLoading(false);
    const message = readErrorMessage(error);
    setStatus(message, "error");
    setPageNotice(message, "error");
    return;
  }

  window.clearTimeout(slowSendTimer);
  setLoading(false);

  const successMessage = `Verification email sent to ${email}. Check your inbox and open the link to continue.`;
  setStatus(successMessage, "success");
  setPageNotice(successMessage, "success");

  window.setTimeout(() => {
    if (!slowSendNoticeShown) {
      closeJoinPanel();
    }
    elements.joinForm.reset();
  }, 1200);
});

elements.signOut?.addEventListener("click", () => {
  window.localStorage.removeItem("siringet-session");
  renderSession(null);
});

if (!isConfigured) {
  setStatus("Configure Supabase in config.js to enable magic-link registration.", "neutral");
}

window.addEventListener("load", () => {
  void initializeSession();
});

async function initializeSession() {
  const url = new URL(window.location.href);
  const urlError = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (urlError) {
    openJoinPanel();
    setStatus(urlError, "error");
  }

  const session = readSessionFromUrl() || readStoredSession();
  renderSession(session);
}

function openJoinPanel() {
  elements.joinPanel.hidden = false;
  window.setTimeout(() => {
    elements.emailInput?.focus();
  }, 0);
}

function closeJoinPanel() {
  elements.joinPanel.hidden = true;
  setLoading(false);
}

function renderSession(session) {
  const email = session?.user?.email || "";
  const signedIn = Boolean(email);

  if (elements.userEmail) {
    elements.userEmail.textContent = email;
  }

  elements.guestActions.hidden = signedIn;
  elements.memberPanel.hidden = !signedIn;

  if (signedIn) {
    closeJoinPanel();
  }
}

function setLoading(isLoading) {
  elements.submitJoin.disabled = isLoading;
  elements.submitJoin.textContent = isLoading ? "Sending..." : "Send link";
}

async function sendMagicLink(email) {
  const redirectTo = getMagicLinkRedirectUrl();
  const url = new URL(`${trimTrailingSlash(config.supabaseUrl)}/auth/v1/otp`);

  if (redirectTo) {
    url.searchParams.set("redirect_to", redirectTo);
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      authorization: `Bearer ${config.supabaseAnonKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      create_user: true,
    }),
  });

  if (!response.ok) {
    throw await readAuthError(response);
  }

  return true;
}

function setStatus(message, tone) {
  if (!elements.status) {
    return;
  }

  elements.status.textContent = message || "Something went wrong. Please try again.";
  elements.status.dataset.tone = tone;
}

function setPageNotice(message, tone) {
  if (!elements.pageNotice) {
    return;
  }

  elements.pageNotice.textContent = message;
  elements.pageNotice.dataset.tone = tone;
  elements.pageNotice.hidden = false;
}

function clearPageNotice() {
  if (!elements.pageNotice) {
    return;
  }

  elements.pageNotice.textContent = "";
  elements.pageNotice.hidden = true;
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(new Error("Email sending is taking too long. Please try again in a moment."));
      }, timeoutMs);
    }),
  ]);
}

async function readAuthError(response) {
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    try {
      payload = await response.text();
    } catch {
      payload = null;
    }
  }

  const message =
    payload?.msg ||
    payload?.message ||
    payload?.error_description ||
    payload?.error ||
    payload ||
    `${response.status} ${response.statusText}`;

  const errorId = payload?.error_id ? ` Reference: ${payload.error_id}` : "";
  return new Error(`${readErrorMessage(message)}${errorId}`);
}

function readErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return normalizeErrorMessage(error.message);
  }

  if (typeof error === "string" && error.trim()) {
    return normalizeErrorMessage(error);
  }

  if (error?.message) {
    return normalizeErrorMessage(error.message);
  }

  if (error?.error_description) {
    return normalizeErrorMessage(error.error_description);
  }

  return "Email could not be sent. Please check the address and try again.";
}

function normalizeErrorMessage(message) {
  const normalized = String(message || "").trim();
  const unhelpfulMessages = new Set(["{}", "[]", "null", "undefined", "[object Object]"]);

  if (!normalized || unhelpfulMessages.has(normalized)) {
    return "Email could not be sent. Please check the address and try again.";
  }

  if (normalized === "Failed to fetch") {
    return "The browser could not reach Supabase. Try the deployed Cloudflare page, or check network access.";
  }

  if (normalized.includes("Error sending magic link email")) {
    return normalized.replace(
      "Error sending magic link email",
      "Supabase reached the email service, but the verification email could not be sent. Check the Supabase SMTP/Resend sender and domain settings."
    );
  }

  return normalized;
}

function getMagicLinkRedirectUrl() {
  const configured = config.magicLinkRedirectUrl;

  if (configured && !String(configured).startsWith("file:")) {
    return configured;
  }

  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    return window.location.origin + window.location.pathname;
  }

  return "";
}

function readSessionFromUrl() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (!accessToken) {
    return null;
  }

  const user = decodeJwtPayload(accessToken);
  const session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      email: user?.email || "",
    },
  };

  window.localStorage.setItem("siringet-session", JSON.stringify(session));
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return session;
}

function readStoredSession() {
  try {
    return JSON.parse(window.localStorage.getItem("siringet-session") || "null");
  } catch {
    return null;
  }
}

function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split(".");
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalizedPayload));
  } catch {
    return null;
  }
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
