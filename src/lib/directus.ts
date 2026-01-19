import { getStoredToken } from "@/lib/auth";

const DIRECTUS_URL = "/api/directus";
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

export const listUsers = async () => {
  const params = new URLSearchParams({
    fields: "id,email,first_name,last_name,role,status",
    limit: "100",
  });
  if (DIRECTUS_USER_ROLE) {
    params.set("filter[role][_eq]", DIRECTUS_USER_ROLE);
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
