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
    "filter[sender][_nnull]": "true", // Only messages from someone
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

export const getNotifications = async (userId?: string) => {
  if (!userId) {
    // SECURITY: Return empty if no userId is provided to prevent accidental data leakage
    return [];
  }
  const params = new URLSearchParams({
    "filter[status][_eq]": "inbox",
    "filter[recipient][_eq]": userId, // SECURITY: Strictly filter by recipient
    "sort": "-timestamp",
    "limit": "20",
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


export const clearAllNotifications = async (userId: string) => {
  if (!userId) return 0;
  const notifications = await getNotifications(userId);
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

export const notifyUsersOfFlag = async (hhId: string, verifier: string, comment: string, vcaId?: string) => {
  const users = await listUsers("active");
  const entityId = vcaId && vcaId !== "Not Available" ? `VCA ${vcaId} (HH ${hhId})` : `Household ${hhId}`;
  const subject = `Record Flagged: ${entityId}`;
  const message = `A record for ${entityId} has been flagged by ${verifier}. \n\nComment: ${comment}`;

  return Promise.allSettled(
    users.map((u: DirectusUser) =>
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
  const users = await listUsers("active");
  const entityId = vcaId && vcaId !== "Not Available" ? `VCA ${vcaId} (HH ${hhId})` : `Household ${hhId}`;
  const subject = `Flag Resolved: ${entityId}`;
  const message = `The flag for ${entityId} has been resolved by ${resolver}. \n\nResolution/Comment: ${comment}`;

  return Promise.allSettled(
    users.map((u: DirectusUser) =>
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

