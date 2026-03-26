/**
 * Superset Embedded Dashboard Utilities
 *
 * Handles authentication with the Superset server and generation of
 * guest tokens required by the @superset-ui/embedded-sdk.
 *
 * Flow:
 *  1. Login as the "embedder" service account → access_token
 *  2. Use access_token to request a guest token scoped to a dashboard
 *  3. Return the guest token to the SDK's fetchGuestToken callback
 */

const SUPERSET_DOMAIN = import.meta.env.VITE_SUPERSET_DOMAIN as string;
const SUPERSET_USERNAME = import.meta.env.VITE_SUPERSET_USERNAME as string;
const SUPERSET_PASSWORD = import.meta.env.VITE_SUPERSET_PASSWORD as string;

interface GuestTokenUser {
  username: string;
  first_name: string;
  last_name: string;
}

interface RlsRule {
  clause: string;
  dataset?: number;
}

/**
 * Authenticate with Superset using the embedder service account.
 */
async function loginToSuperset(): Promise<string> {
  const response = await fetch(`${SUPERSET_DOMAIN}/api/v1/security/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: SUPERSET_USERNAME,
      password: SUPERSET_PASSWORD,
      provider: "db",
      refresh: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Superset login failed (${response.status})`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Request a guest token scoped to a specific dashboard.
 */
async function requestGuestToken(
  accessToken: string,
  dashboardId: string,
  user: GuestTokenUser,
  rls: RlsRule[] = [],
): Promise<string> {
  const response = await fetch(
    `${SUPERSET_DOMAIN}/api/v1/security/guest_token/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        user,
        resources: [{ type: "dashboard", id: dashboardId }],
        rls,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Guest token request failed (${response.status})`);
  }

  const data = await response.json();
  return data.token;
}

/**
 * High-level helper – login + fetch guest token in one call.
 * Pass this to the `fetchGuestToken` callback of embedDashboard().
 */
export async function fetchGuestToken(
  dashboardId: string,
  user: GuestTokenUser = {
    username: "guest",
    first_name: "Guest",
    last_name: "User",
  },
  rls: RlsRule[] = [],
): Promise<string> {
  const accessToken = await loginToSuperset();
  return requestGuestToken(accessToken, dashboardId, user, rls);
}

export { SUPERSET_DOMAIN };
