// ============================================================
// Vercel Domain API — Custom Domain Management
// ============================================================
// Wraps Vercel REST API for adding/removing/verifying domains
// on the TradeFeed project. Used by Pro plan sellers.
//
// Requires env vars: VERCEL_API_TOKEN, VERCEL_PROJECT_ID
// Docs: https://vercel.com/docs/rest-api/endpoints/projects
// ============================================================

const VERCEL_API = "https://api.vercel.com";

function getVercelConfig() {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return null;
  return { token, projectId };
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export interface DomainConfig {
  configuredBy: "CNAME" | "A" | "http" | "dns-01" | null;
  misconfigured: boolean;
}

export interface AddDomainResult {
  success: boolean;
  error?: string;
}

export interface VerifyDomainResult {
  configured: boolean;
  configuredBy: string | null;
  error?: string;
}

/**
 * Add a custom domain to the Vercel project.
 */
export async function addDomainToProject(domain: string): Promise<AddDomainResult> {
  const config = getVercelConfig();
  if (!config) {
    console.log("[vercel-domains] Not configured — would add:", domain);
    return { success: true };
  }

  try {
    const res = await fetch(
      `${VERCEL_API}/v10/projects/${config.projectId}/domains`,
      {
        method: "POST",
        headers: headers(config.token),
        body: JSON.stringify({ name: domain }),
      },
    );

    if (res.ok) return { success: true };

    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message || `Vercel API ${res.status}`;
    console.error("[vercel-domains] addDomain failed:", msg);
    return { success: false, error: msg };
  } catch (err) {
    console.error("[vercel-domains] addDomain error:", err);
    return { success: false, error: "Network error" };
  }
}

/**
 * Remove a custom domain from the Vercel project.
 */
export async function removeDomainFromProject(domain: string): Promise<{ success: boolean }> {
  const config = getVercelConfig();
  if (!config) {
    console.log("[vercel-domains] Not configured — would remove:", domain);
    return { success: true };
  }

  try {
    const res = await fetch(
      `${VERCEL_API}/v10/projects/${config.projectId}/domains/${encodeURIComponent(domain)}`,
      {
        method: "DELETE",
        headers: headers(config.token),
      },
    );
    return { success: res.ok || res.status === 404 };
  } catch (err) {
    console.error("[vercel-domains] removeDomain error:", err);
    return { success: false };
  }
}

/**
 * Check DNS configuration status for a domain via Vercel API.
 */
export async function verifyDomainConfig(domain: string): Promise<VerifyDomainResult> {
  const config = getVercelConfig();
  if (!config) {
    console.log("[vercel-domains] Not configured — would verify:", domain);
    return { configured: true, configuredBy: "CNAME" };
  }

  try {
    const res = await fetch(
      `${VERCEL_API}/v6/domains/${encodeURIComponent(domain)}/config?projectIdOrName=${config.projectId}`,
      {
        method: "GET",
        headers: headers(config.token),
      },
    );

    if (!res.ok) {
      return { configured: false, configuredBy: null, error: `API ${res.status}` };
    }

    const data: DomainConfig = await res.json();
    return {
      configured: !data.misconfigured,
      configuredBy: data.configuredBy,
    };
  } catch (err) {
    console.error("[vercel-domains] verifyDomain error:", err);
    return { configured: false, configuredBy: null, error: "Network error" };
  }
}
