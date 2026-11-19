const env = import.meta.env as Record<string, string | undefined>;

const pickFirstEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
};

export const getStrapiBaseUrl = () =>
  pickFirstEnv("VITE_STRAPI_API_URL");

export const getBackendBaseUrl = () =>
  pickFirstEnv("REACT_PUBLIC_API_URL");
