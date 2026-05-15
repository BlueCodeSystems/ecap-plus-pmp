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

  // Don't set Content-Type for FormData (let browser set it with boundary)
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

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
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
  description?: string;
  title?: string;
  location?: string;
  avatar?: string; // File ID for profile picture
  last_access?: string;
};

export type DirectusRole = {
  id: string;
  name: string;
};


export const listUsers = async (status?: string) => {
  const params = new URLSearchParams({
    fields: "id,email,first_name,last_name,role.id,role.name,status,avatar,last_access",
    limit: "-1", // Fetch all users for chat list
  });
  if (DIRECTUS_USER_ROLE) {
    // If we filter by role ID, we might miss Support users if they have a different role ID. 
    // Usually DIRECTUS_USER_ROLE is the "ECAP+ User" role.
    // If we want ALL users (including support), we might need to remove this filter 
    // or ensure we are fetching multiple roles.
    // For now, let's assume we want to fetch all users to handle the cross-role chat logic
    // But strict security might prevent listing all. 
    // Let's rely on the user's permissions.
    // params.set("filter[role][_eq]", DIRECTUS_USER_ROLE); 
  }
  if (status) {
    params.set("filter[status][_eq]", status);
  }
  const data = await directusRequest(`/users?${params.toString()}`);
  return data?.data ?? [];
};

export const getUser = async (id: string) => {
  const data = await directusRequest(
    `/users/${encodeURIComponent(id)}?fields=id,email,first_name,last_name,role.id,role.name,status,avatar,last_access`,
  );
  return data?.data;
};

// ... existing listRoles, createUser, updateUser, deleteUser ...

export type ChatMessage = Notification & {
  sender_user?: DirectusUser; // We will populate this manually if needed
};


// Chat Messages using Directus Notifications
export const getChatMessages = async (userId: string) => {
  if (!userId) return [];

  const params = new URLSearchParams({
    "sort": "timestamp",
    "limit": "500",
    "fields": "id,status,timestamp,sender,recipient,subject,message,collection,item",
    "filter[recipient][_eq]": userId,
    "filter[sender][_nnull]": "true",
    "filter[collection][_in]": "support_chat,support_chat_outbox",
  });

  const data = await directusRequest(`/notifications?${params.toString()}`);
  return data?.data ?? [];
};

export const sendChatMessage = async (recipientId: string, message: string, priority: string = "Normal", fileId?: string, senderId?: string) => {
  let currentSenderId = senderId;

  // Get current user ID if not provided
  if (!currentSenderId) {
    const me = await directusRequest("/users/me?fields=id");
    currentSenderId = me?.data?.id;
  }

  if (!currentSenderId) {
    throw new Error("Could not determine sender ID");
  }

  // Send to recipient - CRITICAL: set sender field explicitly
  const payload: any = {
    recipient: recipientId,
    sender: currentSenderId, // ✅ Explicitly set sender
    subject: priority,
    message: message,
    collection: "support_chat",
    item: fileId || null,
  };

  const sent = await createNotification(payload);

  // Create outbox copy for sender
  try {
    await createNotification({
      recipient: currentSenderId,
      sender: currentSenderId, // Also set sender for outbox
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

// Delete a single chat notification (inbox or outbox) that the current user owns
export const deleteChatMessage = async (id: string) => {
  if (!id) return;
  await directusRequest(`/notifications/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};

// File Upload to Directus
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const data = await directusRequest("/files", {
    method: "POST",
    body: formData,
  });

  return data?.data;
};

// Update User Avatar
export const updateUserAvatar = async (userId: string, fileId: string | null) => {
  const data = await directusRequest(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ avatar: fileId }),
  });
  return data?.data;
};

// Get file URL (includes auth token for private assets)
export const getFileUrl = (fileId: string | null | undefined) => {
  if (!fileId) return "";
  const token = getStoredToken();
  const baseUrl = requireDirectusUrl().replace(/\/$/, "");
  const url = `${baseUrl}/assets/${fileId}`;
  return token ? `${url}?access_token=${token}` : url;
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
  description?: string;
  title?: string;
  location?: string;
  facility?: string;
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
    description?: string;
    title?: string;
    location?: string;
    facility?: string;
  }>,
) => {
  const data = await directusRequest(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data?.data;
};


// Sentinel error so the UI can show a friendly message when a hard delete
// is blocked by linked records (notifications, flagged forms, etc).
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

const isForeignKeyError = (msg: string) => {
  const m = msg.toLowerCase();
  return (
    m.includes("foreign key") ||
    m.includes("sqlite_constraint") ||
    m.includes("violates foreign key") ||
    m.includes("update or delete on table")
  );
};

// Wipes every row in `collection` that references the given user via any of
// `fields`. Tries DELETE first (so the row leaves the system entirely); falls
// back to PATCH-to-null per field if the collection doesn't allow item deletes.
const scrubUserReferences = async (
  userId: string,
  collection: string,
  fields: string[],
) => {
  for (const field of fields) {
    let cursor = 0;
    // Page through items where this user is referenced — Directus caps the
    // implicit page size, so keep fetching until nothing comes back.
    while (true) {
      let items: Array<{ id: string }>;
      try {
        const data = await directusRequest(
          `/items/${collection}?filter[${field}][_eq]=${encodeURIComponent(userId)}&fields=id&limit=100&offset=${cursor}`,
        );
        items = Array.isArray(data?.data) ? data.data : [];
      } catch {
        break; // collection might not exist on this Directus — skip silently
      }
      if (items.length === 0) break;

      for (const it of items) {
        // Try to delete the referencing row outright. If that's not allowed
        // (e.g. it has its own dependents), null out the field instead.
        let deleted = false;
        try {
          await directusRequest(`/items/${collection}/${it.id}`, { method: "DELETE" });
          deleted = true;
        } catch {
          // fall through to PATCH
        }
        if (!deleted) {
          try {
            await directusRequest(`/items/${collection}/${it.id}`, {
              method: "PATCH",
              body: JSON.stringify({ [field]: null }),
            });
          } catch {
            // ignore — best effort
          }
        }
      }

      // If we deleted everything, the next page starts at the same offset (rows
      // have shifted). Only advance when we did partial PATCH-style scrubs.
      if (items.length < 100) break;
    }
  }
};

const purgeUserNotifications = async (userId: string) => {
  for (const field of ["recipient", "sender"] as const) {
    try {
      const data = await directusRequest(
        `/notifications?filter[${field}][_eq]=${encodeURIComponent(userId)}&fields=id&limit=200`,
      );
      const items: Array<{ id: number | string }> = data?.data ?? [];
      for (const n of items) {
        try {
          await directusRequest(`/notifications/${n.id}`, { method: "DELETE" });
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore — endpoint or perms missing
    }
  }
};

// Hits a dedicated Directus endpoint (e.g. /shares, /presets, /activity,
// /revisions) that points at the user via the given field, and deletes
// every matching row. Falls back to /items/<sys_table> if the endpoint
// is private.
const purgeSystemRows = async (
  userId: string,
  endpoints: Array<{ path: string; field: string; mode?: "delete" | "patch_null" }>,
) => {
  for (const { path, field, mode = "delete" } of endpoints) {
    try {
      const data = await directusRequest(
        `${path}?filter[${field}][_eq]=${encodeURIComponent(userId)}&fields=id&limit=200`,
      );
      const items: Array<{ id: number | string }> = data?.data ?? [];
      for (const it of items) {
        try {
          if (mode === "delete") {
            await directusRequest(`${path}/${it.id}`, { method: "DELETE" });
          } else {
            await directusRequest(`${path}/${it.id}`, {
              method: "PATCH",
              body: JSON.stringify({ [field]: null }),
            });
          }
        } catch {
          // ignore individual failures
        }
      }
    } catch {
      // endpoint may not exist or be locked down — fine
    }
  }
};

export const deleteUser = async (id: string) => {
  // First pass: try a straight delete. Most archived users have no refs left.
  try {
    await directusRequest(`/users/${id}`, { method: "DELETE" });
    return;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!isForeignKeyError(msg)) throw err;
  }

  // Second pass: scrub everything the user touches that we can reach via the
  // Directus REST API, then retry the DELETE.
  await purgeUserNotifications(id);
  await scrubUserReferences(id, "flagged_forms_ecapplus_pmp", [
    "user_created",
    "created_by",
    "flagged_by",
    "caseworker",
  ]);
  await scrubUserReferences(id, "flagged_forms_ecapii", [
    "user_created",
    "created_by",
    "flagged_by",
    "caseworker",
  ]);
  await scrubUserReferences(id, "calendar_events", ["user_id", "user_created", "created_by"]);

  // Directus system collections that hold FKs to directus_users.id.
  // Most of these are deletable by admins via REST; the few that aren't
  // (older Directus versions lock revisions/activity) are best-effort.
  await purgeSystemRows(id, [
    { path: "/shares", field: "user_created" },
    { path: "/presets", field: "user" },
    { path: "/comments", field: "user_created" },
    { path: "/comments", field: "user_updated", mode: "patch_null" },
    { path: "/dashboards", field: "user_created", mode: "patch_null" },
    { path: "/panels", field: "user_created", mode: "patch_null" },
    { path: "/flows", field: "user_created", mode: "patch_null" },
    { path: "/operations", field: "user_created", mode: "patch_null" },
    // Files reference user via uploaded_by + modified_by; null them so the
    // file itself stays available to other users.
    { path: "/files", field: "uploaded_by", mode: "patch_null" },
    { path: "/files", field: "modified_by", mode: "patch_null" },
    // Sessions and activity log — older Directus exposes /items/directus_*.
    { path: "/items/directus_sessions", field: "user" },
    { path: "/items/directus_activity", field: "user" },
    { path: "/items/directus_revisions", field: "user" },
  ]);

  try {
    await directusRequest(`/users/${id}`, { method: "DELETE" });
    return;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!isForeignKeyError(msg)) throw err;
    // Last-resort fallback: still keep the row but mark suspended so the UI
    // hides it. Surface the actual FK error in the message so we can see
    // which Directus system table is still holding the reference.
    try {
      await directusRequest(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "suspended" }),
      });
    } catch {
      // ignore
    }
    throw new UserHasLinkedRecordsError(msg);
  }
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

export const getNotifications = async (userId?: string) => {
  if (!userId) {
    // SECURITY: Return empty if no userId is provided to prevent accidental data leakage
    return [];
  }
  const params = new URLSearchParams({
    "filter[status][_eq]": "inbox",
    "filter[recipient][_eq]": userId, // SECURITY: Strictly filter by recipient
    "sort": "-timestamp",
    "limit": "100",
    "fields": "id,subject,message,timestamp,collection,sender,recipient,item",
  });

  const data = await directusRequest(`/notifications?${params.toString()}`);
  return (data?.data ?? []).filter((n: any) => n.recipient === userId); // Secondary check
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
  sender?: string; // Added sender field
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


/**
 * Batch-archive every inbox notification for a user with a single Directus
 * PATCH. Avoids the N+1 race where new notifications arriving mid-clear
 * survived the loop, and removes the prior 20-item pagination cap.
 */
export const clearAllNotifications = async (userId: string) => {
  if (!userId) return 0;
  const params = new URLSearchParams({
    "filter[recipient][_eq]": userId,
    "filter[status][_eq]": "inbox",
  });
  const data = await directusRequest(`/notifications?${params.toString()}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "archived" }),
  });
  return Array.isArray(data?.data) ? data.data.length : 0;
};

/**
 * Batch-mark every inbox notification for a user as read (status: archived
 * in this app's semantics is used for dismissal; "read" maps to archived
 * for the dashboard bell badge).
 */
export const markAllNotificationsReadForUser = clearAllNotifications;

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
      sent: "Queued",
      emailsSent: "Queued",
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

// Roles that should be notified when a record is flagged / a flag is
// resolved. Anything else (caseworkers, viewers) gets filtered out so we
// stop blasting a notification to every active user in the system.
const FLAG_NOTIFY_ROLE_KEYWORDS = ["admin", "administrator", "supervisor", "qa", "data quality", "manager"];

const isFlagNotifyRecipient = (u: DirectusUser) => {
  const roleName =
    typeof u.role === "object" && u.role !== null
      ? String((u.role as { name?: string }).name ?? "")
      : "";
  if (!roleName) return false;
  const lower = roleName.toLowerCase();
  return FLAG_NOTIFY_ROLE_KEYWORDS.some((k) => lower.includes(k));
};

export const notifyUsersOfFlag = async (hhId: string, verifier: string, comment: string, vcaId?: string) => {
  const users = (await listUsers("active")) as DirectusUser[];
  const recipients = users.filter(isFlagNotifyRecipient);
  const entityId = vcaId && vcaId !== "Not Available" ? `VCA ${vcaId} (HH ${hhId})` : `Household ${hhId}`;
  const subject = `Record Flagged: ${entityId}`;
  const message = `A record for ${entityId} has been flagged by ${verifier}. \n\nComment: ${comment}`;

  return Promise.allSettled(
    recipients.map((u) =>
      createNotification({
        recipient: u.id,
        subject,
        message,
        collection: "flagged_forms_ecapplus_pmp",
      })
    )
  );
};

export const notifyUsersOfFlagResolution = async (hhId: string, resolver: string, comment: string, vcaId?: string) => {
  const users = (await listUsers("active")) as DirectusUser[];
  const recipients = users.filter(isFlagNotifyRecipient);
  const entityId = vcaId && vcaId !== "Not Available" ? `VCA ${vcaId} (HH ${hhId})` : `Household ${hhId}`;
  const subject = `Flag Resolved: ${entityId}`;
  const message = `The flag for ${entityId} has been resolved by ${resolver}. \n\nResolution/Comment: ${comment}`;

  return Promise.allSettled(
    recipients.map((u) =>
      createNotification({
        recipient: u.id,
        subject,
        message,
        collection: "flagged_forms_ecapplus_pmp",
      })
    )
  );
};

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

export const getCalendarEvents = async (userId: string) => {
  const params = new URLSearchParams({
    "filter[user_id][_eq]": userId,
    "fields": "id,title,description,start_time,end_time,category,user_id,status",
    "sort": "start_time",
  });
  const data = await directusRequest(`/items/calendar_events?${params.toString()}`);
  return data?.data ?? [];
};

export const createCalendarEvent = async (payload: Partial<CalendarEvent>) => {
  const data = await directusRequest("/items/calendar_events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data?.data;
};

export const updateCalendarEvent = async (id: string, payload: Partial<CalendarEvent>) => {
  const data = await directusRequest(`/items/calendar_events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data?.data;
};

export const deleteCalendarEvent = async (id: string) => {
  await directusRequest(`/items/calendar_events/${id}`, {
    method: "DELETE",
  });
};

