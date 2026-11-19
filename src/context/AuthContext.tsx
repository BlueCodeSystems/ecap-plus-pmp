import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/auth";
import { getStrapiBaseUrl } from "@/lib/env";

export type AuthUser = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string | { id: string; name?: string };
  location?: string;
  avatar?: string;
  description?: string;
  title?: string;
  password_change_required?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const safeJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const requireStrapiUrl = () => {
  const strapiUrl = getStrapiBaseUrl();
  if (!strapiUrl) {
    throw new Error("VITE_STRAPI_API_URL is not set");
  }
  return strapiUrl;
};

// Strapi's stock GET /api/users/me strips the `role` relation via its field
// sanitizer no matter what you pass to ?populate — a small custom endpoint
// (/api/my-profile/me) returns the same caller's own record with role
// actually populated, so we use that instead.
const fetchProfile = async (token: string): Promise<AuthUser | null> => {
  const response = await fetch(`${requireStrapiUrl()}/api/my-profile/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(response);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Failed to load profile");
  }

  if (!data) return null;

  return {
    id: String(data.id),
    email: data.email,
    first_name: data.first_name ?? undefined,
    last_name: data.last_name ?? undefined,
    role: data.role ? { id: String(data.role.id), name: data.role.name } : undefined,
    location: data.location ?? undefined,
    avatar: data.avatar ?? undefined,
    description: data.description ?? undefined,
    title: data.title ?? undefined,
    password_change_required: !!data.password_change_required,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      return;
    }

    const profile = await fetchProfile(token);
    setUser(profile);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await fetchProfile(token);
        setUser(profile);
      } catch (err) {
        clearStoredToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${requireStrapiUrl()}/api/auth/local`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(data?.error?.message ?? "Login failed");
      }

      const token = data?.jwt;
      if (!token) {
        throw new Error("No access token returned from Strapi");
      }

      setStoredToken(token);
      const profile = await fetchProfile(token);
      setUser(profile);
      return profile;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      clearStoredToken();
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      error,
      login,
      logout,
      refreshProfile,
    }),
    [user, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
