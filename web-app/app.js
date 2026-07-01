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

const SEND_TIMEOUT_MS = 12000;

const isConfigured =
  Boolean(config.supabaseUrl) &&
  Boolean(config.supabaseAnonKey) &&
  !config.supabaseUrl.includes("YOUR_PROJECT_REF") &&
  !config.supabaseAnonKey.includes("YOUR_SUPABASE");

let supabaseClient = null;

function getSupabaseClient() {
  if (!isConfigured || !window.supabase?.createClient) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return supabaseClient;
}

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

  const supabase = getSupabaseClient();

  if (!supabase) {
    const message = isConfigured
      ? "Supabase client library did not load. Check the network or vendor the script."
      : "Add your Supabase URL and public key in config.js before sending links.";
    setStatus(message, "error");
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

  let result;
  try {
    result = await withTimeout(
      supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: config.magicLinkRedirectUrl || window.location.href,
          shouldCreateUser: true,
        },
      }),
      SEND_TIMEOUT_MS
    );
  } catch (error) {
    setLoading(false);
    setStatus(readErrorMessage(error), "error");
    return;
  }

  setLoading(false);

  if (result?.error) {
    setStatus(readErrorMessage(result.error), "error");
    return;
  }

  const successMessage = `Verification email sent to ${email}. Check your inbox and open the link to continue.`;
  setStatus(successMessage, "success");
  setPageNotice(successMessage, "success");

  window.setTimeout(() => {
    closeJoinPanel();
    elements.joinForm.reset();
  }, 1200);
});

elements.signOut?.addEventListener("click", async () => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
  renderSession(null);
});

if (!isConfigured) {
  setStatus("Configure Supabase in config.js to enable magic-link registration.", "neutral");
}

window.addEventListener("load", () => {
  void initializeSession();
});

async function initializeSession() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    if (isConfigured) {
      setStatus("Supabase client library did not load. Check the network or vendor the script.", "error");
    }
    return;
  }

  const url = new URL(window.location.href);
  const urlError = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (urlError) {
    openJoinPanel();
    setStatus(urlError, "error");
  }

  const { data } = await supabase.auth.getSession();
  renderSession(data.session);

  supabase.auth.onAuthStateChange((event, session) => {
    renderSession(session);
    if (event === "SIGNED_IN" && session) {
      window.history.replaceState({}, document.title, config.magicLinkRedirectUrl || "/");
    }
  });
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

function readErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error_description) {
    return error.error_description;
  }

  return "Email could not be sent. Please check the address and try again.";
}
