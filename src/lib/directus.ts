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
  const response = await fetch(`${requireDirectusUrl()}${path}`, {
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

export const clearAllNotifications = async () => {
  const notifications = await getNotifications();
  await Promise.allSettled(
    notifications.map((n: Notification) => markNotificationRead(n.id))
  );
  return notifications.length;
};

/**
 * Manually triggers the same logic as the Monday scheduled flow:
 * sends in-app notifications to distribution list members who are Directus users.
 * Emails are handled by the scheduled Directus flow (requires SMTP on server).
 */
export const triggerWeeklyFlow = async () => {
  const DISTRIBUTION_LIST = [
    "jphiri@bluecodeltd.com",
    "bkapamulomo@bluecodeltd.com",
    "robinsdev2@gmail.com",
  ];

  // Fetch all active users
  const usersData = await directusRequest(
    "/users?filter[status][_eq]=active&fields[]=id,email&limit=-1",
  );
  const allUsers: { id: string; email: string }[] = usersData?.data ?? [];

  // Filter to distribution list members
  const listEmails = new Set(DISTRIBUTION_LIST.map((e) => e.toLowerCase()));
  const matched = allUsers.filter(
    (u) => u.email && listEmails.has(u.email.toLowerCase()),
  );

  // Build subject with ordinal date (same format as the scheduled flow)
  const now = new Date();
  const day = now.getDate();
  const suffixes = ["th", "st", "nd", "rd"];
  const s =
    day % 100 >= 11 && day % 100 <= 13
      ? "th"
      : suffixes[day % 10] || "th";
  const month = now.toLocaleDateString("en-GB", { month: "long" });
  const year = now.getFullYear();
  const subject = `ECAP+ weekly data extracts - ${day}${s} ${month}, ${year}`;

  const message =
    "The weekly data extracts are ready for download. Go to Data Pipeline > Weekly Extracts to get the latest CSV files for your district.";

  // Send in-app notifications
  const results = await Promise.allSettled(
    matched.map((u) =>
      createNotification({
        recipient: u.id,
        subject,
        message,
        collection: "weekly_extracts",
      }),
    ),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { sent, matched: matched.length, subject };
};

export const notifyAllUsers = async (subject: string, message: string) => {
  const users = await listUsers("active");
  const results = await Promise.allSettled(
    users.map((u: DirectusUser) =>
      createNotification({
        recipient: u.id,
        subject,
        message,
        collection: "weekly_extracts",
      })
    )
  );
  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { sent, total: users.length };
};

