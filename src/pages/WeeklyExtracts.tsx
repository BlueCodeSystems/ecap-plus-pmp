import { useState, useCallback, useMemo } from "react";
import {
  Home, Users, HeartHandshake, Baby, Flag,
  Download, Loader2, RefreshCw, FolderDown, Clock, Send, CheckCircle2, Zap,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getHouseholdsByDistrict,
  getChildrenByDistrict,
  getVcaServicesByDistrict,
  getCaregiverServicesByDistrict,
  getFlaggedRecords,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { notifyAllUsers, triggerWeeklyFlow } from "@/lib/directus";
import { toast } from "sonner";

const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") return String(value);
  }
  return "";
};

import { downloadCsv } from "@/lib/exportUtils";


type ExtractConfig = {
  key: string;
  title: string;
  icon: React.ReactNode;
  headers: string[];
  mapRow: (record: Record<string, unknown>) => string[];
};

const extractConfigs: ExtractConfig[] = [
  {
    key: "households",
    title: "Households",
    icon: <Home className="h-5 w-5 text-blue-600" />,
    headers: [
      "household_id", "caregiver_name", "homeaddress", "facility",
      "district", "ward", "caseworker_name", "screened", "last_service_date",
    ],
    mapRow: (r) => [
      pickValue(r, ["household_id", "hhid", "hh_id", "id"]),
      pickValue(r, ["caregiver_name", "caregiverName", "caregiver"]),
      pickValue(r, ["homeaddress", "home_address", "address"]),
      pickValue(r, ["facility", "facility_name"]),
      pickValue(r, ["district", "district_name"]),
      pickValue(r, ["ward", "ward_name"]),
      pickValue(r, ["caseworker_name", "caseworkerName", "caseworker"]),
      pickValue(r, ["screened", "is_screened"]),
      pickValue(r, ["last_service_date", "lastServiceDate", "last_visit"]),
    ],
  },
  {
    key: "vcas",
    title: "VCAs",
    icon: <Baby className="h-5 w-5 text-violet-600" />,
    headers: [
      "uid", "firstname", "lastname", "gender", "birthdate",
      "facility", "district", "ward", "last_service_date", "virally_suppressed",
    ],
    mapRow: (r) => [
      pickValue(r, ["uid", "unique_id", "vca_id", "id"]),
      pickValue(r, ["firstname", "first_name", "firstName"]),
      pickValue(r, ["lastname", "last_name", "lastName"]),
      pickValue(r, ["gender", "sex"]),
      pickValue(r, ["birthdate", "birth_date", "dob", "date_of_birth"]),
      pickValue(r, ["facility", "facility_name"]),
      pickValue(r, ["district", "district_name"]),
      pickValue(r, ["ward", "ward_name"]),
      pickValue(r, ["last_service_date", "lastServiceDate", "last_visit"]),
      pickValue(r, ["virally_suppressed", "virallySupressed", "vl_suppressed"]),
    ],
  },
  {
    key: "vca-services",
    title: "VCA Services",
    icon: <Users className="h-5 w-5 text-emerald-600" />,
    headers: ["vca_id", "service_name", "service_date", "status"],
    mapRow: (r) => [
      pickValue(r, ["vca_id", "vcaid", "child_id", "unique_id", "id"]),
      pickValue(r, ["service_name", "serviceName", "service", "form_name"]),
      pickValue(r, ["service_date", "visit_date", "created_at", "date"]),
      pickValue(r, ["status", "state", "outcome"]),
    ],
  },
  {
    key: "caregiver-services",
    title: "Caregiver Services",
    icon: <HeartHandshake className="h-5 w-5 text-amber-600" />,
    headers: ["household_id", "service_name", "service_date", "status"],
    mapRow: (r) => [
      pickValue(r, ["household_id", "hhid", "hh_id", "id"]),
      pickValue(r, ["service_name", "serviceName", "service", "form_name"]),
      pickValue(r, ["service_date", "visit_date", "created_at", "date"]),
      pickValue(r, ["status", "state", "outcome"]),
    ],
  },
  {
    key: "flags",
    title: "Flagged Records",
    icon: <Flag className="h-5 w-5 text-red-600" />,
    headers: [
      "household_id", "caseworker_name", "caregiver_name", "facility",
      "comment", "verifier", "status", "date_created",
    ],
    mapRow: (r) => [
      pickValue(r, ["household_id", "hhid"]),
      pickValue(r, ["caseworker_name", "caseworkerName"]),
      pickValue(r, ["caregiver_name", "caregiverName"]),
      pickValue(r, ["facility"]),
      pickValue(r, ["comment", "comments"]),
      pickValue(r, ["verifier"]),
      pickValue(r, ["status"]),
      pickValue(r, ["date_created", "created_at"]),
    ],
  },
];

const EXTRACT_QUERY_KEYS = [
  "extract-households",
  "extract-vcas",
  "extract-vca-services",
  "extract-caregiver-services",
  "extract-flags",
];

const WeeklyExtracts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const district = user?.location ?? "";
  const [downloading, setDownloading] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [notified, setNotified] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const householdsQuery = useQuery({
    queryKey: ["extract-households", district],
    queryFn: () => getHouseholdsByDistrict(district),
    enabled: Boolean(district),
  });

  const vcasQuery = useQuery({
    queryKey: ["extract-vcas", district],
    queryFn: () => getChildrenByDistrict(district),
    enabled: Boolean(district),
  });

  const vcaServicesQuery = useQuery({
    queryKey: ["extract-vca-services", district],
    queryFn: () => getVcaServicesByDistrict(district),
    enabled: Boolean(district),
  });

  const caregiverServicesQuery = useQuery({
    queryKey: ["extract-caregiver-services", district],
    queryFn: () => getCaregiverServicesByDistrict(district),
    enabled: Boolean(district),
  });

  const flagsQuery = useQuery({
    queryKey: ["extract-flags"],
    queryFn: getFlaggedRecords,
  });

  const queries: Record<string, { data: Record<string, unknown>[] | undefined; isLoading: boolean; isFetching: boolean }> = {
    households: householdsQuery,
    vcas: vcasQuery,
    "vca-services": vcaServicesQuery,
    "caregiver-services": caregiverServicesQuery,
    flags: flagsQuery,
  };

  const anyLoading = Object.values(queries).some((q) => q.isLoading);
  const anyFetching = Object.values(queries).some((q) => q.isFetching);

  const totalRecords = useMemo(
    () => Object.values(queries).reduce((sum, q) => sum + (q.data?.length ?? 0), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [householdsQuery.data, vcasQuery.data, vcaServicesQuery.data, caregiverServicesQuery.data, flagsQuery.data]
  );

  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all(
        EXTRACT_QUERY_KEYS.map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] })
        )
      );
      setRefreshedAt(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const buildCsv = (config: ExtractConfig): string[][] | null => {
    const data = queries[config.key].data;
    if (!data || data.length === 0) return null;
    return data.map((record) => config.mapRow(record));
  };

  const handleDownload = (config: ExtractConfig) => {
    const rows = buildCsv(config);
    if (!rows) return;

    setDownloading(config.key);
    try {
      const filename = `${config.key}_${district || "all"}_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCsv(config.headers, rows, filename);
    } catch (error) {
      console.error(`Error exporting ${config.title}:`, error);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = () => {
    setDownloading("all");
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      for (const config of extractConfigs) {
        const rows = buildCsv(config);
        if (!rows) continue;
        const filename = `${config.key}_${district || "all"}_${dateStr}.csv`;
        downloadCsv(config.headers, rows, filename);
      }
    } catch (error) {
      console.error("Error exporting all extracts:", error);
    } finally {
      setDownloading(null);
    }
  };

  const handleNotifyTeam = useCallback(async () => {
    setIsNotifying(true);
    try {
      const dateStr = new Date().toLocaleDateString("en-ZM", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "System";
      const result = await notifyAllUsers(
        `ECAP+ Weekly Data Extracts — ${dateStr}`,
        `${displayName} has published the weekly data extracts for ${district || "all districts"}. Go to Data Pipeline > Weekly Extracts to download the CSV files.`
      );
      setNotified(true);
      toast.success(
        `Sent ${result.sent} in-app notification(s) and ${result.emailsSent} email(s) to ${result.total} user(s)`
      );

    } catch (error) {
      console.error("Error notifying team:", error);
      toast.error("Failed to send notifications. Please try again.");
    } finally {
      setIsNotifying(false);
    }
  }, [district, user]);

  const handleTriggerFlow = useCallback(async () => {
    setIsTriggering(true);
    try {
      const result = await triggerWeeklyFlow();
      setTriggered(true);
      toast.success(
        `Sent ${result.sent} in-app notification(s) and ${result.emailsSent} email(s) to ${result.matched} distribution list member(s).`
      );

    } catch (error) {
      console.error("Error triggering flow:", error);
      toast.error("Failed to trigger flow. Please try again.");
    } finally {
      setIsTriggering(false);
    }
  }, []);

  const formatRefreshedAt = (date: Date) => {
    return date.toLocaleString("en-ZM", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout subtitle="Weekly Extracts">
      <PageIntro
        eyebrow="Data Pipeline"
        title="Weekly Extracts"
        description="Download CSV extracts of your district's data for offline analysis and reporting. Hit Refresh to pull the latest data, then download individual datasets or all at once."
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-200 gap-2"
            onClick={handleRefreshAll}
            disabled={isRefreshing || anyFetching}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing || anyFetching ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={handleDownloadAll}
            disabled={anyLoading || totalRecords === 0 || downloading === "all"}
          >
            {downloading === "all" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FolderDown className="h-3.5 w-3.5" />
            )}
            Download All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-200 gap-2"
            onClick={handleNotifyTeam}
            disabled={isNotifying || anyLoading || totalRecords === 0}
          >
            {isNotifying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : notified ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {notified ? "Team Notified" : "Notify Team"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-violet-200 text-violet-700 hover:bg-violet-50 gap-2"
            onClick={handleTriggerFlow}
            disabled={isTriggering}
          >
            {isTriggering ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : triggered ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-violet-600" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            {triggered ? "Flow Triggered" : "Trigger Flow"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Badge variant="secondary" className="text-xs font-normal">
            {district || "No district"}
          </Badge>
          {!anyLoading && (
            <span>{totalRecords.toLocaleString()} total records</span>
          )}
          {refreshedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatRefreshedAt(refreshedAt)}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {extractConfigs.map((config) => {
          const query = queries[config.key];
          const count = query.data?.length ?? 0;
          const isLoading = query.isLoading;
          const isFetching = query.isFetching && !query.isLoading;
          const isDownloading = downloading === config.key || downloading === "all";

          return (
            <GlowCard key={config.key}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  {config.icon}
                  <CardTitle className="text-base">{config.title}</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {isLoading ? "..." : isFetching ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      updating
                    </span>
                  ) : (
                    `${count.toLocaleString()} records`
                  )}
                </Badge>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full border-slate-200 gap-2"
                  disabled={isLoading || count === 0 || isDownloading}
                  onClick={() => handleDownload(config)}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download CSV
                </Button>
              </CardContent>
            </GlowCard>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default WeeklyExtracts;
