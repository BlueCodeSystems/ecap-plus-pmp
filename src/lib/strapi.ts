import { getStoredToken, setStoredToken } from "@/lib/auth";
import { getStrapiBaseUrl } from "@/lib/env";

const requireStrapiUrl = () => {
  const url = getStrapiBaseUrl();
  if (!url) {
    throw new Error("VITE_STRAPI_API_URL is not set");
  }
  return url.replace(/\/$/, "");
};

const safeJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

// Strapi's error shape is {error:{message}}, not Directus's {errors:[{message}]}.
const strapiRequest = async (path: string, options: RequestInit = {}) => {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated.");
  }

  // Don't set Content-Type for FormData (let the browser set it with boundary).
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (options.headers) {
    const customHeaders = new Headers(options.headers);
    customHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${requireStrapiUrl()}${path}`, {
    ...options,
    headers,
  });

  const data = await safeJson(response);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Strapi request failed");
  }

  return data;
};

// Strapi media objects carry a `url` relative to the Strapi server (e.g.
// "/uploads/foo_abc123.jpg") rather than an opaque file id you build a path
// from like Directus's /assets/:id?access_token=... pattern. Strapi's local
// upload provider serves files publicly, so no auth token is appended.
export const strapiFileUrl = (
  file: { url?: string } | string | null | undefined,
): string => {
  if (!file) return "";
  const url = typeof file === "string" ? file : file.url;
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  // ASSUMPTION: anything that isn't already a URL (e.g. a bare Directus
  // asset UUID stored before this migration) can't be resolved against
  // Strapi — that binary lived in Directus's own file storage, which this
  // app no longer talks to. Returns "" rather than a broken/401'ing link.
  if (!url.startsWith("/")) return "";
  return `${requireStrapiUrl()}${url}`;
};

export const getFileUrl = (
  avatar: string | { url?: string } | null | undefined,
): string => strapiFileUrl(avatar);

export type StrapiUser = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string | { id: string; name?: string };
  status?: string;
  description?: string;
  title?: string;
  location?: string;
  district?: string;
  facility?: string;
  avatar?: string; // Strapi media URL (see strapiFileUrl) for the profile picture
  last_access?: string;
  password_change_required?: boolean;
};

export type StrapiRole = {
  id: string;
  name: string;
};

const normalizeUser = (u: any): StrapiUser => ({
  ...u,
  id: String(u.id),
  role:
    u.role && typeof u.role === "object"
      ? { id: String(u.role.id), name: u.role.name }
      : u.role,
});

/** Custom Strapi endpoints may return either an array or `{ data: array }`. */
const collectionFromResponse = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: T[] }).data;
  }
  return [];
};

// ─── User management ────────────────────────────────────────────────
// Backed by Strapi's /api/user-admin/* routes (a custom endpoint using
// Strapi's internal users-permissions service directly, since Strapi's real
// admin API requires an admin-panel session, not a regular user token).
export const listUsers = async (status?: string): Promise<StrapiUser[]> => {
  const data = await strapiRequest("/api/user-admin/users");
  const users = collectionFromResponse<any>(data).map(normalizeUser);
  return status ? users.filter((u) => u.status === status) : users;
};

export const getUser = async (id: string): Promise<StrapiUser> => {
  const data = await strapiRequest(`/api/user-admin/users/${encodeURIComponent(id)}`);
  return normalizeUser(data?.data ?? data);
};

export const getUserByEmail = async (email: string): Promise<StrapiUser | null> => {
  const params = new URLSearchParams({ email });
  const data = await strapiRequest(`/api/user-admin/users/by-email?${params.toString()}`);
  const list = collectionFromResponse<any>(data);
  return list.length > 0 ? normalizeUser(list[0]) : null;
};

export const listRoles = async (): Promise<StrapiRole[]> => {
  const data = await strapiRequest("/api/user-admin/roles");
  return collectionFromResponse<any>(data).map((r) => ({ id: String(r.id), name: r.name }));
};

export const createUser = async (payload: {
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  password?: string;
  password_change_required?: boolean;
  description?: string;
  title?: string;
  location?: string;
  facility?: string;
}): Promise<StrapiUser> => {
  const data = await strapiRequest("/api/user-admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeUser(data?.data ?? data);
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
    password_change_required?: boolean;
    description?: string;
    title?: string;
    location?: string;
    facility?: string;
    avatar?: string | null;
  }>,
): Promise<StrapiUser> => {
  const data = await strapiRequest(`/api/user-admin/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return normalizeUser(data?.data ?? data);
};

// Sentinel error so the UI can show a friendly message when a hard delete is
// blocked by linked records. Strapi's /user-admin delete route now does the
// archive-on-conflict fallback server-side (status 409), so the client-side
// FK-scrubbing this used to need against Directus's /items/* API is gone.
export class UserHasLinkedRecordsError extends Error {
  underlying?: string;
  constructor(underlying?: string) {
    super(
      underlying
        ? `Permanent delete blocked by a residual database reference: ${underlying}`
        : "This user is still referenced somewhere in the system and cannot be permanently deleted. The user remains archived.",
    );
    this.name = "UserHasLinkedRecordsError";
    this.underlying = underlying;
  }
}

export const deleteUser = async (id: string): Promise<void> => {
  const token = getStoredToken();
  if (!token) throw new Error("Not authenticated.");
  const response = await fetch(
    `${requireStrapiUrl()}/api/user-admin/users/${encodeURIComponent(id)}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
  );
  if (response.status === 409) {
    const body = await safeJson(response);
    throw new UserHasLinkedRecordsError(body?.error?.message);
  }
  if (!response.ok) {
    const body = await safeJson(response);
    throw new Error(body?.error?.message ?? "Delete failed");
  }
};

// Strapi has no equivalent of Directus's email-invite flow (a signup link
// sent before the account's password is set) — accounts are now always
// created with a password up front (see AddUser.tsx), and the "send setup
// email" action just triggers a normal forgot-password email afterwards.
export const inviteUser = async (..._args: unknown[]): Promise<unknown> => {
  throw new Error(
    "inviteUser isn't supported against Strapi — create the account directly with a temporary password, then call requestPasswordReset to send a setup email.",
  );
};

export const requestPasswordReset = async (email: string, _resetUrl?: string) => {
  // Strapi builds the reset link itself from its own email-template config
  // (Settings > Users & Permissions > Email Templates) — the reset_url this
  // app used to pass to Directus has no equivalent here. Kept as an
  // accepted-but-ignored param so existing call sites don't need to change.
  const response = await fetch(`${requireStrapiUrl()}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const data = await safeJson(response);
    throw new Error(data?.error?.message ?? "Password reset request failed");
  }

  return true;
};

// Strapi's reset link uses a `code` query param, not Directus's `token`.
export const resetPassword = async (code: string, password: string) => {
  const response = await fetch(`${requireStrapiUrl()}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, password, passwordConfirmation: password }),
  });

  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Reset failed");
  }
  return data;
};

// No Strapi equivalent of Directus's invite-by-email token flow exists, and
// nothing issues these links any more (see inviteUser above).
export const acceptUserInvite = async (_token: string, _password: string): Promise<void> => {
  throw new Error(
    "Invite links are no longer issued. Ask an administrator to create your account with a temporary password instead.",
  );
};

// Forced-password-change / self-service password change. Strapi requires the
// CURRENT password for this call (unlike Directus's old PATCH /users/me,
// which didn't) — every call site must now supply it.
export const updateCurrentUserPassword = async (password: string, currentPassword: string) => {
  const data = await strapiRequest("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      currentPassword,
      password,
      passwordConfirmation: password,
    }),
  });
  // Strapi rotates the JWT when a password changes — keep the replacement
  // token or the next request will use the now-invalid login token.
  if (data?.jwt) setStoredToken(data.jwt);
  return data?.user;
};

// ─── File upload (avatars, chat attachments) ──────────────────────────
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("files", file);
  const data = await strapiRequest("/api/upload", {
    method: "POST",
    body: formData,
  });
  // Strapi's /api/upload returns an array of uploaded file objects directly
  // (not Directus's {data: {...}} single-object shape).
  return Array.isArray(data) ? data[0] : data;
};

export const updateUserAvatar = async (userId: string, avatarUrl: string | null) => {
  const data = await strapiRequest(`/api/user-admin/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    body: JSON.stringify({ avatar: avatarUrl }),
  });
  return normalizeUser(data?.data ?? data);
};

// ─── Chat / notifications (generic Strapi "notifications" content-type) ──
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

export type ChatMessage = Notification & {
  sender_user?: StrapiUser;
};

const mapNotification = (n: any): Notification => ({
  id: String(n.documentId ?? n.id),
  status: n.status,
  timestamp: n.createdAt,
  sender: n.sender?.documentId ?? n.sender?.id ?? n.sender ?? null,
  recipient: n.recipient?.documentId ?? n.recipient?.id ?? n.recipient,
  subject: n.subject,
  message: n.message,
  collection: n.collection ?? null,
  item: n.item ?? null,
});

export const createNotification = async (payload: {
  recipient: string;
  sender?: string;
  subject: string;
  message?: string;
  collection?: string;
  item?: string;
}) => {
  const data = await strapiRequest("/api/notifications", {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });
  return mapNotification(data?.data);
};

export const getChatMessages = async (userId: string): Promise<Notification[]> => {
  if (!userId) return [];
  const params = new URLSearchParams({
    sort: "createdAt:asc",
    "pagination[limit]": "500",
    "filters[recipient][$eq]": userId,
    "filters[sender][$notNull]": "true",
  });
  params.append("filters[collection][$in][0]", "support_chat");
  params.append("filters[collection][$in][1]", "support_chat_outbox");
  const data = await strapiRequest(`/api/notifications?${params.toString()}`);
  return (data?.data ?? []).map(mapNotification);
};

export const sendChatMessage = async (
  recipientId: string,
  message: string,
  priority: string = "Normal",
  fileId?: string,
  senderId?: string,
) => {
  let currentSenderId = senderId;

  if (!currentSenderId) {
    const me = await strapiRequest("/api/my-profile/me");
    currentSenderId = me?.id != null ? String(me.id) : undefined;
  }

  if (!currentSenderId) {
    throw new Error("Could not determine sender ID");
  }

  const sent = await createNotification({
    recipient: recipientId,
    sender: currentSenderId,
    subject: priority,
    message,
    collection: "support_chat",
    item: fileId || undefined,
  });

  // Create outbox copy for sender
  try {
    await createNotification({
      recipient: currentSenderId,
      sender: currentSenderId,
      subject: priority,
      message: fileId ? `${message}|||FILE:${fileId}` : message,
      collection: "support_chat_outbox",
      item: recipientId, // ALWAYS store partner ID for conversation filtering
    });
  } catch (e) {
    console.warn("Failed to save outbox message", e);
  }

  return sent;
};

export const deleteChatMessage = async (id: string) => {
  if (!id) return;
  await strapiRequest(`/api/notifications/${encodeURIComponent(id)}`, { method: "DELETE" });
};

export const getNotifications = async (userId?: string): Promise<Notification[]> => {
  if (!userId) {
    // SECURITY: Return empty if no userId is provided to prevent accidental data leakage
    return [];
  }
  const params = new URLSearchParams({
    "filters[status][$eq]": "inbox",
    "filters[recipient][$eq]": userId,
    sort: "createdAt:desc",
    "pagination[limit]": "100",
  });
  const data = await strapiRequest(`/api/notifications?${params.toString()}`);
  return (data?.data ?? []).map(mapNotification).filter((n: Notification) => n.recipient === userId);
};

export const markNotificationRead = async (id: string) => {
  const data = await strapiRequest(`/api/notifications/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ data: { status: "archived" } }),
  });
  return mapNotification(data?.data);
};

// Strapi has no equivalent of Directus's bulk PATCH-by-filter — fetch
// matching ids first, then update each individually.
export const clearAllNotifications = async (userId: string): Promise<number> => {
  if (!userId) return 0;
  const params = new URLSearchParams({
    "filters[recipient][$eq]": userId,
    "filters[status][$eq]": "inbox",
    "pagination[limit]": "500",
    fields: "id",
  });
  const data = await strapiRequest(`/api/notifications?${params.toString()}`);
  const items: any[] = data?.data ?? [];
  await Promise.allSettled(
    items.map((n) =>
      strapiRequest(`/api/notifications/${n.documentId ?? n.id}`, {
        method: "PUT",
        body: JSON.stringify({ data: { status: "archived" } }),
      }),
    ),
  );
  return items.length;
};

/**
 * Marks every inbox notification for a user as read (status: archived in
 * this app's semantics is used for dismissal; "read" maps to archived for
 * the dashboard bell badge).
 */
export const markAllNotificationsReadForUser = clearAllNotifications;

// Deliver an announcement to each recipient's notification bell.
export const broadcastAnnouncement = async (
  recipientIds: string[],
  subject: string,
  message: string,
) => {
  const results = await Promise.allSettled(
    recipientIds.map((recipient) => createNotification({ recipient, subject, message })),
  );
  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { sent, failed: results.length - sent };
};

// Roles that should be notified when a record is flagged / a flag is
// resolved. Anything else (caseworkers, viewers) gets filtered out so we
// stop blasting a notification to every active user in the system.
//
// None of the FLAG_NOTIFY_ROLE_KEYWORDS below ever match a real Strapi role
// name ("ECAP+ Support/Users", "ECAPII Support/Users") — "Administrator"
// lives in `description`, not `role.name` — so this used to match nobody.
// Same elevated-visibility pattern already used correctly elsewhere in this
// app (e.g. Users.tsx's isSupport check): any Support role, or an
// Administrator by description.
const FLAG_NOTIFY_ROLE_KEYWORDS = [
  "admin",
  "administrator",
  "supervisor",
  "qa",
  "data quality",
  "manager",
];

const isFlagNotifyRecipient = (u: StrapiUser) => {
  const roleName =
    typeof u.role === "object" && u.role !== null
      ? String((u.role as { name?: string }).name ?? "")
      : "";
  const lower = roleName.toLowerCase();
  const isSupport = lower.includes("support");
  const isAdmin = String(u.description ?? "").trim().toLowerCase() === "administrator";
  return isSupport || isAdmin || FLAG_NOTIFY_ROLE_KEYWORDS.some((k) => lower.includes(k));
};

export const notifyUsersOfFlag = async (
  hhId: string,
  verifier: string,
  comment: string,
  vcaId?: string,
) => {
  const users = await listUsers("active");
  const recipients = users.filter(isFlagNotifyRecipient);
  const entityId =
    vcaId && vcaId !== "Not Available" ? `VCA ${vcaId} (HH ${hhId})` : `Household ${hhId}`;
  const subject = `Record Flagged: ${entityId}`;
  const message = `A record for ${entityId} has been flagged by ${verifier}. \n\nComment: ${comment}`;

  return Promise.allSettled(
    recipients.map((u) =>
      createNotification({
        recipient: u.id,
        subject,
        message,
        collection: "flagged_forms_ecapplus_pmp",
      }),
    ),
  );
};

export const notifyUsersOfFlagResolution = async (
  hhId: string,
  resolver: string,
  comment: string,
  vcaId?: string,
) => {
  const users = await listUsers("active");
  const recipients = users.filter(isFlagNotifyRecipient);
  const entityId =
    vcaId && vcaId !== "Not Available" ? `VCA ${vcaId} (HH ${hhId})` : `Household ${hhId}`;
  const subject = `Flag Resolved: ${entityId}`;
  const message = `The flag for ${entityId} has been resolved by ${resolver}. \n\nResolution/Comment: ${comment}`;

  return Promise.allSettled(
    recipients.map((u) =>
      createNotification({
        recipient: u.id,
        subject,
        message,
        collection: "flagged_forms_ecapplus_pmp",
      }),
    ),
  );
};

// ─── Calendar events ───────────────────────────────────────────────────
// ASSUMPTION: the "calendar-events" Strapi content-type is confirmed to
// exist (verified against the sibling iccms-pmp app on this same shared
// Strapi backend) and is reused here as-is for this app's calendar feature.
export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  category: "Meeting" | "Field Visit" | "Deadline" | "Personal";
  user_id: string;
  status: "scheduled" | "cancelled" | "completed";
};

const mapCalendarEvent = (e: any): CalendarEvent => ({
  ...e,
  id: String(e.documentId ?? e.id),
});

export const getCalendarEvents = async (userId: string): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams({
    "filters[user_id][$eq]": userId,
    sort: "start_time:asc",
    "pagination[limit]": "200",
  });
  const data = await strapiRequest(`/api/calendar-events?${params.toString()}`);
  return (data?.data ?? []).map(mapCalendarEvent);
};

export const createCalendarEvent = async (payload: Partial<CalendarEvent>) => {
  const data = await strapiRequest("/api/calendar-events", {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });
  return mapCalendarEvent(data?.data);
};

export const updateCalendarEvent = async (id: string, payload: Partial<CalendarEvent>) => {
  const data = await strapiRequest(`/api/calendar-events/${id}`, {
    method: "PUT",
    body: JSON.stringify({ data: payload }),
  });
  return mapCalendarEvent(data?.data);
};

export const deleteCalendarEvent = async (id: string) => {
  await strapiRequest(`/api/calendar-events/${id}`, { method: "DELETE" });
};

// ─── User activity / PMP users ─────────────────────────────────────────
export type StrapiActivityEntry = {
  id: number;
  action: string;
  collection: string;
  timestamp: string;
  user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    district?: string;
    facility?: string;
    location?: string;
    title?: string;
    description?: string;
  } | null;
};

// Strapi has no equivalent of Directus's directus_activity audit log —
// there's no built-in per-item change history to query here. Returns []
// rather than throwing so the PMP User Activity tab degrades to "no data"
// instead of crashing. Flagging this explicitly rather than faking data.
export const listUserActivity = async (_limit = 500): Promise<StrapiActivityEntry[]> => {
  return [];
};

export type PmpUser = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  title?: string;
  location?: string;
  district?: string;
  facility?: string;
  description?: string;
  last_access?: string | null;
  status?: string;
};

/**
 * Strapi roles whose members count as "PMP users" for this app. Expanded
 * from the old Directus behavior (a single hardcoded "ECAP+ User" role id
 * via VITE_DIRECTUS_USER_ROLE) to cover BOTH ECAP+ and ECAP II end users,
 * per explicit instruction when pointing this app at Strapi.
 */
const ECAP_PLUS_USERS_ROLE_NAME = "ECAP+ Users";
const ECAPII_USERS_ROLE_NAME = "ECAPII Users";
const ECAP_PLUS_USERS_ROLE_ID_FALLBACK = String(
  import.meta.env.VITE_STRAPI_ECAP_PLUS_USERS_ROLE_ID ?? "",
).trim();
const ECAPII_USERS_ROLE_ID_FALLBACK = String(
  import.meta.env.VITE_STRAPI_ECAPII_USERS_ROLE_ID ?? "",
).trim();

const resolvePmpUserRoleIds = async (): Promise<Set<string>> => {
  const roles = await listRoles();
  const ids = new Set<string>();
  const ecapPlusId =
    roles.find((r) => r.name === ECAP_PLUS_USERS_ROLE_NAME)?.id || ECAP_PLUS_USERS_ROLE_ID_FALLBACK;
  const ecapiiId =
    roles.find((r) => r.name === ECAPII_USERS_ROLE_NAME)?.id || ECAPII_USERS_ROLE_ID_FALLBACK;
  if (ecapPlusId) ids.add(String(ecapPlusId));
  if (ecapiiId) ids.add(String(ecapiiId));
  return ids;
};

export const listPmpUsers = async (): Promise<PmpUser[]> => {
  const roleIds = await resolvePmpUserRoleIds();
  if (roleIds.size === 0) {
    throw new Error(
      `Could not resolve the "${ECAP_PLUS_USERS_ROLE_NAME}" / "${ECAPII_USERS_ROLE_NAME}" Strapi roles`,
    );
  }
  const users = await listUsers();
  return users
    .filter((u) => {
      const roleId = typeof u.role === "object" ? u.role?.id : u.role;
      return roleId != null && roleIds.has(String(roleId));
    })
    .map((u) => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      title: u.title,
      location: u.location,
      district: u.district,
      facility: u.facility,
      description: u.description,
      last_access: u.last_access ?? null,
      status: u.status,
    }));
};

// Facility users are not referenced by id on flagged forms — the link is the
// flag's facility name. Fetch just enough to count flags per facility.
export type FlaggedFormFacilityRef = { id: string; facility?: string | null };

// Confirmed against the live pmp-strapi schema (src/api/ecap-flag):
// singularName "ecap-flag" / pluralName "ecap-flags", migrated from Directus
// `flagged_forms_ecapii`.
const FLAGGED_FORMS_ECAPII_PATH = "ecap-flags";

export const listFlaggedFormFacilities = async (): Promise<FlaggedFormFacilityRef[]> => {
  const params = new URLSearchParams({ fields: "facility", "pagination[limit]": "1000" });
  const data = await strapiRequest(`/api/${FLAGGED_FORMS_ECAPII_PATH}?${params.toString()}`);
  return (data?.data ?? []).map((r: any) => ({
    id: String(r.documentId ?? r.id),
    facility: r.facility ?? null,
  }));
};
