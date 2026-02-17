import { getStoredToken } from "@/lib/auth";

const DQA_BASE_URL =
  import.meta.env.VITE_DQA_BASE_URL ?? "https://api.achieve.bluecodeltd.com";

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

  console.log("[API Debug] getListValue input:", data);
  const record = data as Record<string, unknown>;
  const candidates = [
    record.data,
    record.results,
    record.records,
    record.referrals,
    record.referral,
    record.caregiver_referrals,
    record.caregiver_referral,
    record.services,
    record.caseplans,
    record.members
  ];

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
  const data = await dqaGet(`/household/all-households/${encodeURIComponent(district)}`);
  return getListValue(data);
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
  const data = await dqaGet(`/child/vcas-assessed-register/${encodeURIComponent(district)}`);
  return getListValue(data);
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
  const path = district
    ? `/household/district/caregiver-services/${encodeURIComponent(district)}`
    : "/household/caregiver-services";
  const data = await dqaGet(path);
  return getListValue(data);
};

export const getCaregiverServicesByHousehold = async (hhId: string) => {
  const data = await dqaGet(`/household/caregiver-services/${encodeURIComponent(hhId)}`);
  return getListValue(data);
};

export const getVcaServicesByDistrict = async (district: string) => {
  const path = district
    ? `/child/district/vcaservices/${encodeURIComponent(district)}`
    : "/child/vcaservices";
  const data = await dqaGet(path);
  return getListValue(data);
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
