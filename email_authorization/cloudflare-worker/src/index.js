const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

export default {
  async fetch(request, env) {
    const corsHeaders = buildCorsHeaders(env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/health" && request.method === "GET") {
        return json({ ok: true, service: "email-auth-edge-gate" }, 200, corsHeaders);
      }

      if (url.pathname === "/v1/items" && request.method === "POST") {
        return await createFreeItem(request, env, corsHeaders);
      }

      return json({ error: "not_found" }, 404, corsHeaders);
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          message: error instanceof Error ? error.message : "unknown error",
          path: url.pathname,
        })
      );

      return json({ error: "internal_error" }, 500, corsHeaders);
    }
  },
};

async function createFreeItem(request, env, corsHeaders) {
  assertConfig(env);

  const token = readBearerToken(request);
  if (!token) {
    return json({ error: "missing_bearer_token" }, 401, corsHeaders);
  }

  const user = await getSupabaseUser(env, token);
  if (!user?.id) {
    return json({ error: "invalid_supabase_token" }, 401, corsHeaders);
  }

  const existingCount = await countUserItems(env, token);
  const freeLimit = readPositiveInteger(env.FREE_ITEM_LIMIT, 3);

  if (existingCount >= freeLimit) {
    return json(
      {
        error: "upgrade_required",
        message: `Free users can create ${freeLimit} items.`,
        limit: freeLimit,
        count: existingCount,
      },
      402,
      corsHeaders
    );
  }

  const body = await readJson(request);
  const title = normalizeTitle(body?.title);

  if (!title) {
    return json({ error: "title_required" }, 400, corsHeaders);
  }

  const created = await insertItem(env, token, user.id, title);

  return json(
    {
      ok: true,
      item: created,
      remainingFreeItems: Math.max(freeLimit - existingCount - 1, 0),
    },
    201,
    corsHeaders
  );
}

async function getSupabaseUser(env, token) {
  const response = await fetch(`${trimTrailingSlash(env.SUPABASE_URL)}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function countUserItems(env, token) {
  const response = await fetch(buildRestUrl(env, env.SUPABASE_ITEMS_TABLE, "select=id"), {
    method: "HEAD",
    headers: supabaseRestHeaders(env, token, {
      prefer: "count=exact",
    }),
  });

  if (!response.ok) {
    throw new Error(`Supabase count failed with ${response.status}`);
  }

  const contentRange = response.headers.get("content-range") || "0-0/0";
  const [, total] = contentRange.split("/");
  return Number.parseInt(total || "0", 10) || 0;
}

async function insertItem(env, token, ownerId, title) {
  const response = await fetch(buildRestUrl(env, env.SUPABASE_ITEMS_TABLE, "select=id,owner_id,title,created_at"), {
    method: "POST",
    headers: supabaseRestHeaders(env, token, {
      "content-type": "application/json",
      prefer: "return=representation",
    }),
    body: JSON.stringify({
      owner_id: ownerId,
      title,
    }),
  });

  if (!response.ok) {
    const details = await safeResponseText(response);
    throw new Error(`Supabase insert failed with ${response.status}: ${details}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

function buildRestUrl(env, table, query) {
  const encodedTable = encodeURIComponent(table || "items");
  return `${trimTrailingSlash(env.SUPABASE_URL)}/rest/v1/${encodedTable}?${query}`;
}

function supabaseRestHeaders(env, token, extraHeaders = {}) {
  const schema = env.SUPABASE_SCHEMA || "prototypes";

  return {
    apikey: env.SUPABASE_ANON_KEY,
    authorization: `Bearer ${token}`,
    "accept-profile": schema,
    "content-profile": schema,
    ...extraHeaders,
  };
}

async function readJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function safeResponseText(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function readBearerToken(request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function normalizeTitle(value) {
  if (typeof value !== "string") {
    return "";
  }

  const title = value.trim();
  return title.length > 120 ? title.slice(0, 120) : title;
}

function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function assertConfig(env) {
  const missing = ["SUPABASE_URL", "SUPABASE_ANON_KEY"].filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing Worker config: ${missing.join(", ")}`);
  }
}

function buildCorsHeaders(env) {
  const origin = env.ALLOWED_ORIGIN || "*";

  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization,content-type",
    "access-control-max-age": "86400",
  };
}

function json(payload, status, corsHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...corsHeaders,
    },
  });
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
