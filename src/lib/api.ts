import { getStoredToken } from "@/lib/auth";
import { getCacheEntry, setCacheEntry } from "@/lib/indexedDbCache";

const DQA_BASE_URL =
  import.meta.env.VITE_DQA_BASE_URL;

export const DEFAULT_DISTRICT = import.meta.env.VITE_DEFAULT_DISTRICT;
const SERVICES_CACHE_TTL_MS = 1000 * 60 * 5;
const LIST_CACHE_TTL_MS = 1000 * 60 * 10;
const DEBUG_API = import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === "true";

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

  if (typeof data === "string") {
    const parsed = Number(data);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;

  // Check generic "count" property which might be a number, string, or object (nested count)
  if (record.count) {
    if (typeof record.count === "number") {
      return record.count;
    }
    if (typeof record.count === "string") {
      const parsed = Number(record.count);
      if (Number.isFinite(parsed)) return parsed;
    }
    if (typeof record.count === "object" && record.count !== null) {
      // Handle case: { count: { count: "123" } }
      const nestedCount = (record.count as Record<string, unknown>).count;
      if (nestedCount) {
        const parsed = Number(nestedCount);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
  }

  const candidates = [
    record.total,
    record.totalCount,
    record.total_count,
    record.totalVcaCount,
    record.total_vca_count,
    record.data,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number") {
      return candidate;
    }

    if (typeof candidate === "string") {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
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
      nestedRecord.totalVcaCount,
      nestedRecord.total_vca_count,
    ];

    for (const candidate of nestedCandidates) {
      if (typeof candidate === "number") {
        return candidate;
      }

      if (typeof candidate === "string") {
        const parsed = Number(candidate);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
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
  const keysToCheck = [
    "data",
    "results",
    "records",
    "referrals",
    "referral",
    "caregiver_referrals",
    "caregiver_referral",
    "caregiver_services",
    "caregiver_services_by_district",
    "household_services",
    "services",
    "caseplans",
    "members",
    "vca_services",
    "vca_services_by_district",
    "household_services_by_district",
  ];

  // 1. Check direct keys
  for (const key of keysToCheck) {
    const val = record[key];
    if (Array.isArray(val)) {
      return val as Array<Record<string, unknown>>;
    }
  }

  // 2. Check depth-1 nested keys (e.g. { data: { caregiver_services: [...] } })
  for (const key of keysToCheck) {
    const val = record[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const nested = val as Record<string, unknown>;
      for (const nKey of keysToCheck) {
        if (Array.isArray(nested[nKey])) {
          return nested[nKey] as Array<Record<string, unknown>>;
        }
      }
    }
  }

  // 3. Fallback: Find the FIRST non-empty array property in the root record
  for (const key of Object.keys(record)) {
    const val = record[key];
    if (Array.isArray(val) && val.length > 0) {
      return val as Array<Record<string, unknown>>;
    }
  }

  // 4. Final attempt: any array even if empty (find any list named anything)
  for (const key of Object.keys(record)) {
    const val = record[key];
    if (Array.isArray(val)) {
      return val as Array<Record<string, unknown>>;
    }
  }

  return [];
};

const dqaGet = async (path: string) => {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated.");
  }
  if (DEBUG_API) {
    console.log("[DQA] Request", `${DQA_BASE_URL}${path}`);
    console.log("[DQA] Access token present:", Boolean(token));
  }
  const response = await fetch(`${DQA_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(response);
  if (DEBUG_API) {
    console.log("[DQA] Response", data);
  }

  if (!response.ok) {
    throw new Error(data?.message ?? "DQA request failed");
  }

  return data;
};

const getListFromApiWithCache = async (
  cacheKey: string,
  path: string,
  ttlMs: number
): Promise<Array<Record<string, unknown>>> => {
  const now = Date.now();
  const cached = await getCacheEntry<Array<Record<string, unknown>>>(cacheKey);

  if (cached && now - cached.updatedAt <= ttlMs) {
    return cached.value;
  }

  try {
    const data = await dqaGet(path);
    const list = getListValue(data);
    void setCacheEntry(cacheKey, list);
    return list;
  } catch (error) {
    if (cached) {
      console.warn(`[DQA] Using stale IndexedDB cache for ${cacheKey} after fetch error.`);
      return cached.value;
    }
    throw error;
  }
};

export const getTotalVcasCount = async (district?: string) => {
  const path = district
    ? `/child/vcas-count/${encodeURIComponent(district)}`
    : "/child/vcas-count";
  const data = await dqaGet(path);
  return getCountValue(data);
};

export const getTotalHouseholdsCount = async (district?: string) => {
  const path = district
    ? `/household/households-count/${encodeURIComponent(district)}`
    : "/household/households-count";
  const data = await dqaGet(path);
  return getCountValue(data);
};

export const getTotalMothersCount = async (district?: string) => {
  const path = district
    ? `/household/members-count/${encodeURIComponent(district)}`
    : "/household/members-count";
  const data = await dqaGet(path);
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
  const normalizedDistrict = district || "ALL";
  return getListFromApiWithCache(
    `households_by_district:${normalizedDistrict}`,
    `/household/all-households/${encodeURIComponent(district)}`,
    LIST_CACHE_TTL_MS
  );
};

export const getHouseholdMembers = async (hhId: string) => {
  const data = await dqaGet(`/household/members/${encodeURIComponent(hhId)}`);
  return getListValue(data);
};

export const getHouseholdArchivedRegister = async (
  district: string,
  params?: { de_registration_reason?: string }
) => {
  const queryParams = new URLSearchParams();
  if (params?.de_registration_reason) {
    queryParams.append("de_registration_reason", params.de_registration_reason);
  }

  const queryString = queryParams.toString();
  const url = `/household/all-households-archived/${encodeURIComponent(district)}${queryString ? `?${queryString}` : ""
    }`;

  const data = await dqaGet(url);
  return getListValue(data);
};

export const getMothersByDistrict = async (district: string) => {
  const data = await dqaGet(`/mother/district/${encodeURIComponent(district)}`);
  return getListValue(data);
};

export const getChildrenByDistrict = async (district: string) => {
  const normalizedDistrict = district || "ALL";
  return getListFromApiWithCache(
    `children_by_district:${normalizedDistrict}`,
    `/child/vcas-assessed-register/${encodeURIComponent(district)}`,
    LIST_CACHE_TTL_MS
  );
};

export const getVcaProfileById = async (uniqueId: string) => {
  const data = await dqaGet(`/child/vca-profile/${encodeURIComponent(uniqueId)}`);
  return data; // Individual object, not a list
};

export const getChildrenArchivedRegister = async (
  district: string,
  params?: { reason?: string }
) => {
  const queryParams = new URLSearchParams();
  if (params?.reason) {
    queryParams.append("reason", params.reason);
  }

  const queryString = queryParams.toString();
  const url = `/child/vcas-archived-register/${encodeURIComponent(district)}${queryString ? `?${queryString}` : ""
    }`;

  const data = await dqaGet(url);
  return getListValue(data);
};

export const getCaregiverServicesByDistrict = async (district: string) => {
  const normalizedDistrict = district || "ALL";
  return getListFromApiWithCache(
    `caregiver_services_by_district:${normalizedDistrict}`,
    `/household/caregiver-services-by-district/${encodeURIComponent(district)}`,
    SERVICES_CACHE_TTL_MS
  );
};

export const getHouseholdServicesByDistrict = async (district: string) => {
  const normalizedDistrict = district || "ALL";
  return getListFromApiWithCache(
    `household_services_by_district:${normalizedDistrict}`,
    `/household/household-services-by-district/${encodeURIComponent(district)}`,
    SERVICES_CACHE_TTL_MS
  );
};

export const getHTSRegisterByDistrict = async (district: string) => {
  // Backend route: /household/hts-register-by-district/:district(*)
  const data = await dqaGet(`/household/hts-register-by-district/${encodeURIComponent(district)}`);
  if (DEBUG_API) {
    console.log("[HTS] Raw API response for district:", district, data);
  }
  return getListValue(data);
};

export const getCaregiverServicesByHousehold = async (hhId: string) => {
  const data = await dqaGet(`/household/caregiver-services/${encodeURIComponent(hhId)}`);
  return getListValue(data);
};

export const getVcaServicesByDistrict = async (district: string) => {
  const normalizedDistrict = district || "ALL";
  return getListFromApiWithCache(
    `vca_services_by_district:${normalizedDistrict}`,
    `/child/vca-services-by-district/${encodeURIComponent(district)}`,
    SERVICES_CACHE_TTL_MS
  );
};

export const getVcaServicesByChildId = async (childId: string) => {
  const data = await dqaGet(`/child/vca-services/${encodeURIComponent(childId)}`);
  return getListValue(data);
};

export const getCaregiverServicesByMonth = async (district: string) => {
  const data = await dqaGet(
    `/household/caregiver-services-by-month/${encodeURIComponent(district)}`
  );
  return getListValue(data);
};

export const getVcaServicesByMonth = async (district: string) => {
  const data = await dqaGet(
    `/child/vca-services-by-month/${encodeURIComponent(district)}`
  );
  return getListValue(data);
};

export const getCaregiverReferralsByMonth = async (district: string) => {
  const data = await dqaGet(
    `/household/caregiver-referrals-by-month/${encodeURIComponent(district)}`
  );
  return getListValue(data);
};

export const getVcaReferralsByMonth = async (district: string) => {
  const data = await dqaGet(
    `/child/vca-referrals-by-month/${encodeURIComponent(district)}`
  );
  return getListValue(data);
};

export const getCaregiverCasePlansByDistrict = async (district: string) => {
  const path = district
    ? `/household/caregiver-caseplans/${encodeURIComponent(district)}`
    : "/household/caregiver-caseplans";
  const data = await dqaGet(path);
  return getListValue(data);
};

export const getCaregiverCasePlansByHousehold = async (hhId: string) => {
  const data = await dqaGet(`/household/caregiver-caseplans/${encodeURIComponent(hhId)}`);
  return getListValue(data);
};

export const getHouseholdReferralsById = async (household_id: string) => {
  const data = await dqaGet(`/household/caregiver-referrals/${encodeURIComponent(household_id)}`);
  return getListValue(data);
};

export const getVcaReferralsById = async (vcaId: string) => {
  const data = await dqaGet(`/child/vca-referrals/${encodeURIComponent(vcaId)}`);
  return getListValue(data);
};

export const getVcaCasePlansByDistrict = async (district: string) => {
  // The backend route is /vca-caseplans and does not accept a district parameter
  const data = await dqaGet("/child/vca-caseplans");
  return getListValue(data);
};

export const getVcaCasePlansById = async (vcaId: string) => {
  const data = await dqaGet(`/child/vca-caseplans/${encodeURIComponent(vcaId)}`);
  return getListValue(data);
};
// ... existing code ...

export const getFlaggedRecords = async () => {
  const token = getStoredToken();
  if (!token) return [];

  try {
    const response = await fetch(
      `${import.meta.env.VITE_DIRECTUS_URL}/items/flagged_forms_ecapplus_pmp`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await safeJson(response);
    return getListValue(data);
  } catch (error) {
    console.error("Error fetching flagged records:", error);
    return [];
  }
};

export const createFlaggedRecord = async (payload: any) => {
  const token = getStoredToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(
    `${import.meta.env.VITE_DIRECTUS_URL}/items/flagged_forms_ecapplus_pmp`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await safeJson(response);
    throw new Error(errorData?.message || "Failed to create flagged record");
  }

  return safeJson(response);
};
// ─── ETL Pipeline API ───────────────────────────────────────────────

export interface EtlRun {
  run_id: string;
  pipeline: string;
  pipeline_name: string;
  status: "pending" | "running" | "success" | "failed" | "cancelled";
  triggered_by: string;
  started_at: string;
  completed_at: string | null;
  duration_sec: number | null;
  logs: string;
  error: string | null;
  created_at: string;
}

export interface EtlPipeline {
  id: string;
  name: string;
  downloadFiles: string[];
}

export interface EtlFile {
  name: string;
  exists: boolean;
  size: number | null;
  sizeFormatted: string | null;
  lastModified: string | null;
}

const dqaPost = async (path: string, body: Record<string, unknown> = {}) => {
  const token = getStoredToken();
  if (!token) throw new Error("Not authenticated");
  const url = `${DQA_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await safeJson(response);
  if (!response.ok) throw new Error(data?.message || `Request failed: ${response.status}`);
  return data;
};

const dqaGetSkipCache = async (path: string) => {
  const token = getStoredToken();
  if (!token) throw new Error("Not authenticated");
  const url = `${DQA_BASE_URL}${path}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await safeJson(response);
  if (!response.ok) throw new Error(data?.message || `Request failed: ${response.status}`);
  return data;
};

export const triggerEtlPipeline = async (pipeline: string): Promise<EtlRun> => {
  const res = await dqaPost("/etl/run", { pipeline });
  return res.data;
};

export const getEtlRuns = async (params?: { limit?: number; pipeline?: string; status?: string }): Promise<EtlRun[]> => {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.pipeline) query.set("pipeline", params.pipeline);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const data = await dqaGetSkipCache(`/etl/runs${qs ? `?${qs}` : ""}`);
  return data?.data ?? [];
};

export const getEtlRunById = async (runId: string): Promise<EtlRun> => {
  const data = await dqaGetSkipCache(`/etl/runs/${runId}`);
  return data?.data;
};

export const cancelEtlRun = async (runId: string) => dqaPost(`/etl/cancel/${runId}`);

export const getEtlPipelines = async (): Promise<EtlPipeline[]> => {
  const data = await dqaGetSkipCache("/etl/pipelines");
  return data?.data ?? [];
};

export const getEtlFiles = async (pipeline: string): Promise<EtlFile[]> => {
  const data = await dqaGetSkipCache(`/etl/files/${pipeline}`);
  return data?.data ?? [];
};

export const getEtlDownloadUrl = (pipeline: string, fileName: string): string => {
  return `${DQA_BASE_URL}/etl/download/${pipeline}/${encodeURIComponent(fileName)}`;
};

export const sendEtlReport = async () => dqaPost("/etl/send-report");

// ─── Tablet Sync Status API ─────────────────────────────────────────
export interface TabletSyncProvider {
  provider: string;
  location_id: string;
  last_activity: string;
  total_events: number;
  status: "active" | "stale" | "inactive";
}

export interface TabletSyncStatus {
  total: number;
  active_7d: number;
  active_30d: number;
  stale: number;
  providers: TabletSyncProvider[];
}

export const getTabletSyncStatus = async (): Promise<TabletSyncStatus> => {
  const data = await dqaGetSkipCache("/etl/tablet-sync");
  return data?.data;
};

// ─── Facility Performance API ───────────────────────────────────────
export interface FacilityPerformance {
  facility: string;
  district: string;
  total_vcas: number;
  households: number;
}

export const getFacilityPerformance = async (): Promise<FacilityPerformance[]> => {
  const data = await dqaGetSkipCache("/etl/facility-performance");
  return data?.data ?? [];
};

// ─── Caseworker Journey API ─────────────────────────────────────────
export interface JourneyPoint {
  caseworker: string;
  visit_date: string;
  form_type: string;
  lat: string | null;
  lng: string | null;
}

export const getCaseworkerJourneys = async (params: {
  caseworker?: string;
  from?: string;
  to?: string;
}): Promise<JourneyPoint[]> => {
  const query = new URLSearchParams();
  if (params.caseworker) query.set("caseworker", params.caseworker);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const qs = query.toString();
  const data = await dqaGetSkipCache(`/etl/caseworker-journeys${qs ? `?${qs}` : ""}`);
  return data?.data ?? [];
};

export const getCaseworkerList = async (): Promise<{ caseworker: string; location_id: string }[]> => {
  const data = await dqaGetSkipCache("/etl/caseworker-list");
  return data?.data ?? [];
};

export const updateFlagStatus = async (flagId: string, status: string) => {
  const token = getStoredToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(
    `${import.meta.env.VITE_DIRECTUS_URL}/items/flagged_forms_ecapplus_pmp/${flagId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    const errorData = await safeJson(response);
    throw new Error(errorData?.message || "Failed to update flagged record");
  }

  return safeJson(response);
};

