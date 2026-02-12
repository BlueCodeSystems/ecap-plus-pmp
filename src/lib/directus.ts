import { getStoredToken } from "@/lib/auth";

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;
const DIRECTUS_USER_ROLE = import.meta.env.VITE_DIRECTUS_USER_ROLE;

const requireDirectusUrl = () => {
  if (!DIRECTUS_URL) {
    throw new Error("VITE_DIRECTUS_URL is not set");
  }
  return DIRECTUS_URL;
};

const safeJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const directusRequest = async (
  path: string,
  options: RequestInit = {},
) => {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated.");
  }
  const baseUrl = requireDirectusUrl().replace(/\/$/, "");
  const response = await fetch(`${baseUrl}${path}`, {

    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = await safeJson(response);

  if (!response.ok) {
    throw new Error(data?.errors?.[0]?.message ?? "Directus request failed");
  }

  return data;
};

export type DirectusUser = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string | { id: string; name?: string };
  status?: string;
};

export type DirectusRole = {
  id: string;
  name: string;
};

export const listUsers = async (status?: string) => {
  const params = new URLSearchParams({
    fields: "id,email,first_name,last_name,role,status",
    limit: "100",
  });
  if (DIRECTUS_USER_ROLE) {
    params.set("filter[role][_eq]", DIRECTUS_USER_ROLE);
  }
  if (status) {
    params.set("filter[status][_eq]", status);
  }
  const data = await directusRequest(`/users?${params.toString()}`);
  return data?.data ?? [];
};

export const getUser = async (id: string) => {
  const data = await directusRequest(
    `/users/${encodeURIComponent(id)}?fields=id,email,first_name,last_name,role,status`,
  );
  return data?.data;
};

export const listRoles = async () => {
  const data = await directusRequest("/roles?fields=id,name&limit=100");
  return data?.data ?? [];
};

export const createUser = async (payload: {
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  password?: string;
}) => {
  const data = await directusRequest("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data?.data;
};

export const updateUser = async (
  id: string,
  payload: Partial<{
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    status?: string;
    password?: string;
  }>,
) => {
  const data = await directusRequest(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data?.data;
};


export const deleteUser = async (id: string) => {
  await directusRequest(`/users/${id}`, {
    method: "DELETE",
  });
};

export type Notification = {
  id: string;
  status: string;
  timestamp: string;
  sender: string | null;
  recipient: string;
  subject: string;
  message: string;
  collection: string | null;
  item: string | null;
};

export const getNotifications = async () => {
  const data = await directusRequest(
    "/notifications?filter[status][_eq]=inbox&sort=-timestamp&limit=20"
  );
  return data?.data ?? [];
};

export const markNotificationRead = async (id: string) => {
  const data = await directusRequest(`/notifications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "archived" }),
  });
  return data?.data;
};

export const createNotification = async (payload: {
  recipient: string;
  subject: string;
  message?: string;
  collection?: string;
  item?: string;
}) => {
  const data = await directusRequest("/notifications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data?.data;
};

/**
 * Sends an email via the Directus /mail endpoint.
 */
export const sendMail = async (payload: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}) => {
  const data = await directusRequest("/mail", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
};


export const clearAllNotifications = async () => {
  const notifications = await getNotifications();
  await Promise.allSettled(
    notifications.map((n: Notification) => markNotificationRead(n.id))
  );
  return notifications.length;
};

/**
 * Manually triggers the Weekly Extract Notifications flow on the server.
 * This flow sends in-app notifications and emails to the full distribution list.
 * We trigger it by creating a record in the 'weekly_extracts' collection.
 */
export const triggerWeeklyFlow = async () => {
  try {
    // We create a minimal record to trigger the Flow
    // Using an empty object to avoid "field not found" errors if triggered_at doesn't exist
    await directusRequest("/items/weekly_extracts", {
      method: "POST",
      body: JSON.stringify({}),
    });

    return {
      sent: "Initiated",
      emailsSent: "Initiated",
      matched: "Server-side",
      subject: "Weekly Extracts"
    };
  } catch (error) {
    console.error("Error triggering weekly flow:", error);
    throw error;
  }
};

export const notifyAllUsers = async (subject: string, message: string) => {
  const users = await listUsers("active");
  const notificationResults = await Promise.allSettled(
    users.map((u: DirectusUser) =>
      createNotification({
        recipient: u.id,
        subject,
        message,
        collection: "weekly_extracts",
      })
    )
  );

  // Send emails to all active users (best effort, requires /mail permissions)
  const emailResults = await Promise.allSettled(
    users.map(async (u: DirectusUser) => {
      try {
        return await sendMail({
          to: u.email,
          subject,
          text: message,
        });
      } catch (e: any) {
        console.warn(`Failed to send email to ${u.email}:`, e.message);
        throw e;
      }
    })
  );

  const sent = notificationResults.filter((r) => r.status === "fulfilled").length;
  const emailsSent = emailResults.filter((r) => r.status === "fulfilled").length;

  return { sent, emailsSent, total: users.length };
};

