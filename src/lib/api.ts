import { getStoredToken } from "@/lib/auth";

const DQA_BASE_URL =
  import.meta.env.VITE_DQA_BASE_URL ?? "https://server.dqa.bluecodeltd.com";

export const DEFAULT_DISTRICT = import.meta.env.VITE_DEFAULT_DISTRICT;

const safeJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getCountValue = (data: unknown): number | null => {
  if (typeof data === "number") {
    return data;
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  const candidates = [
    record.count,
    record.total,
    record.totalCount,
    record.total_count,
    record.data,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number") {
      return candidate;
    }
  }

  const nested = record.data;
  if (Array.isArray(nested)) {
    return nested.length;
  }

  if (nested && typeof nested === "object") {
    const nestedRecord = nested as Record<string, unknown>;
    const nestedCandidates = [
      nestedRecord.count,
      nestedRecord.total,
      nestedRecord.totalCount,
      nestedRecord.total_count,
    ];

    for (const candidate of nestedCandidates) {
      if (typeof candidate === "number") {
        return candidate;
      }
    }
  }

  return null;
};

const getListValue = (data: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(data)) {
    return data as Array<Record<string, unknown>>;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const record = data as Record<string, unknown>;
  const candidates = [record.data, record.results, record.records];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as Array<Record<string, unknown>>;
    }

    if (candidate && typeof candidate === "object") {
      const nested = (candidate as Record<string, unknown>).data;
      if (Array.isArray(nested)) {
        return nested as Array<Record<string, unknown>>;
      }
    }
  }

  return [];
};

const dqaGet = async (path: string) => {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated.");
  }
  console.log("[DQA] Request", `${DQA_BASE_URL}${path}`);
  console.log("[DQA] Access token present:", Boolean(token));
  const response = await fetch(`${DQA_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(response);
  console.log("[DQA] Response", data);

  if (!response.ok) {
    throw new Error(data?.message ?? "DQA request failed");
  }

  return data;
};

export const getTotalVcasCount = async () => {
  const data = await dqaGet("/child/total/vcas/count");
  return getCountValue(data);
};

export const getTotalHouseholdsCount = async () => {
  const data = await dqaGet("/household/hh/total/count");
  return getCountValue(data);
};

export const getTotalMothersCount = async () => {
  const data = await dqaGet("/household/mothers/total/count");
  return getCountValue(data);
};

export const getCaseworkerCountByDistrict = async (district: string) => {
  const data = await dqaGet(`/child/caseworker/count/${encodeURIComponent(district)}`);
  return getCountValue(data);
};

export const getHouseholdCountByDistrict = async (district: string) => {
  const data = await dqaGet(`/household/district/count/${encodeURIComponent(district)}`);
  return getCountValue(data);
};

export const getVcaCountByDistrict = async (district: string) => {
  const data = await dqaGet(`/child/district/count/${encodeURIComponent(district)}`);
  return getCountValue(data);
};

export const getHouseholdsByDistrict = async (district: string) => {
  const data = await dqaGet(`/household/district/${encodeURIComponent(district)}`);
  return getListValue(data);
};

export const getHouseholdArchivedRegister = async (district: string) => {
  const data = await dqaGet(`/household/archived-register/${encodeURIComponent(district)}`);
  return getListValue(data);
};

export const getMothersByDistrict = async (district: string) => {
  const data = await dqaGet(`/mother/district/${encodeURIComponent(district)}`);
  return getListValue(data);
};

export const getChildrenByDistrict = async (district: string) => {
  const data = await dqaGet(`/child/district/${encodeURIComponent(district)}`);
  return getListValue(data);
};

export const getChildrenArchivedRegister = async (district: string) => {
  const data = await dqaGet(`/child/vcas-archived-register/${encodeURIComponent(district)}`);
  return getListValue(data);
};

export const getCaregiverServicesByDistrict = async (district: string) => {
  const data = await dqaGet(`/household/district/caregiver-services/${encodeURIComponent(district)}`);
  return getListValue(data);
};

export const getVcaServicesByDistrict = async (district: string) => {
  const data = await dqaGet(`/child/district/vcaservices/${encodeURIComponent(district)}`);
  return getListValue(data);
};
