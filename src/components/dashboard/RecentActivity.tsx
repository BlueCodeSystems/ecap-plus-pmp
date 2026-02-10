import { useState, useMemo } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GlowCard from "@/components/aceternity/GlowCard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, HeartPulse, Flag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TableSkeleton from "@/components/ui/TableSkeleton";
import {
  DEFAULT_DISTRICT,
  getVcaServicesByDistrict,
  getCaregiverServicesByDistrict,
  getFlaggedRecords,
} from "@/lib/api";

type FeedItem = {
  type: "vca-service" | "caregiver-service" | "flag";
  id: string;
  title: string;
  subtitle: string;
  date: string;
  status: string;
  linkId?: string;
};

const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return String(value);
    }
  }
  return "N/A";
};

const parseDate = (raw: string): Date => {
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

const formatDate = (raw: string): string => {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const tabs = [
  { key: "all", label: "All" },
  { key: "vca-service", label: "VCA Services" },
  { key: "caregiver-service", label: "Caregiver" },
  { key: "flag", label: "Flags" },
] as const;

const typeConfig = {
  "vca-service": {
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    badge: "bg-blue-50 text-blue-700",
    route: "/vca-services",
  },
  "caregiver-service": {
    icon: HeartPulse,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    badge: "bg-emerald-50 text-emerald-700",
    route: "/household-services",
  },
  flag: {
    icon: Flag,
    color: "text-amber-600",
    bg: "bg-amber-50",
    badge: "bg-amber-50 text-amber-700",
    route: "/flags",
  },
};

const FEED_LIMIT = 15;

const RecentActivity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const district = user?.location || DEFAULT_DISTRICT;
  const [activeTab, setActiveTab] = useState<string>("all");

  const vcaQuery = useQuery({
    queryKey: ["recent-vca-services", district],
    queryFn: () => getVcaServicesByDistrict(district ?? ""),
    enabled: Boolean(district),
  });

  const caregiverQuery = useQuery({
    queryKey: ["recent-caregiver-services", district],
    queryFn: () => getCaregiverServicesByDistrict(district ?? ""),
    enabled: Boolean(district),
  });

  const flagsQuery = useQuery({
    queryKey: ["recent-flags"],
    queryFn: getFlaggedRecords,
  });

  const isLoading = vcaQuery.isLoading || caregiverQuery.isLoading || flagsQuery.isLoading;

  const feed = useMemo(() => {
    const items: FeedItem[] = [];

    // VCA services
    for (const raw of vcaQuery.data ?? []) {
      const record = raw as Record<string, unknown>;
      items.push({
        type: "vca-service",
        id: pickValue(record, ["vca_id", "vcaid", "child_id", "unique_id", "id"]),
        title: pickValue(record, ["service", "service_name", "serviceName", "form_name"]),
        subtitle: `VCA ${pickValue(record, ["vca_id", "vcaid", "child_id", "unique_id", "id"])}`,
        date: pickValue(record, ["service_date", "visit_date", "created_at", "date"]),
        status: pickValue(record, ["status", "state", "outcome"]),
      });
    }

    // Caregiver services
    for (const raw of caregiverQuery.data ?? []) {
      const record = raw as Record<string, unknown>;
      items.push({
        type: "caregiver-service",
        id: pickValue(record, ["household_id", "householdId", "hh_id", "unique_id", "id"]),
        title: pickValue(record, ["service", "service_name", "serviceName", "form_name"]),
        subtitle: `HH ${pickValue(record, ["household_id", "householdId", "hh_id", "unique_id", "id"])}`,
        date: pickValue(record, ["service_date", "visit_date", "created_at", "date"]),
        status: pickValue(record, ["status", "state", "outcome"]),
        linkId: pickValue(record, ["household_id", "householdId", "hh_id"]),
      });
    }

    // Flags
    for (const raw of flagsQuery.data ?? []) {
      const record = raw as Record<string, unknown>;
      items.push({
        type: "flag",
        id: pickValue(record, ["id"]),
        title: pickValue(record, ["comment", "reason"]),
        subtitle: `HH ${pickValue(record, ["household_id"])} - ${pickValue(record, ["caregiver_name"])}`,
        date: pickValue(record, ["date_created"]),
        status: pickValue(record, ["status"]),
        linkId: pickValue(record, ["household_id"]),
      });
    }

    // Sort by date descending
    items.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

    return items.slice(0, FEED_LIMIT);
  }, [vcaQuery.data, caregiverQuery.data, flagsQuery.data]);

  const filtered = activeTab === "all" ? feed : feed.filter((item) => item.type === activeTab);

  const totalCounts = useMemo(() => ({
    "vca-service": (vcaQuery.data ?? []).length,
    "caregiver-service": (caregiverQuery.data ?? []).length,
    flag: (flagsQuery.data ?? []).length,
  }), [vcaQuery.data, caregiverQuery.data, flagsQuery.data]);

  return (
    <GlowCard>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Recent Updates</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Latest services and flagged records across your district
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {totalCounts["vca-service"]} VCA
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {totalCounts["caregiver-service"]} Caregiver
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {totalCounts.flag} Flags
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-primary/10 text-primary"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <TableSkeleton rows={5} columns={3} />
        ) : filtered.length === 0 ? (
          <div className="flex h-[280px] flex-col items-center justify-center text-sm text-slate-400">
            <Flag className="mb-2 h-8 w-8 opacity-40" />
            No recent updates found.
          </div>
        ) : (
          <ScrollArea className="h-[380px] pr-2">
            <div className="space-y-1">
              {filtered.map((item, i) => {
                const config = typeConfig[item.type];
                const Icon = config.icon;

                return (
                  <div
                    key={`${item.type}-${item.id}-${i}`}
                    className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      if (item.type === "flag" || item.type === "caregiver-service") {
                        if (item.linkId && item.linkId !== "N/A") {
                          navigate(`/profile/household-profile/${encodeURIComponent(item.linkId)}`);
                        }
                      } else {
                        navigate(config.route);
                      }
                    }}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800 leading-tight truncate">
                          {item.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {formatDate(item.date)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 truncate">{item.subtitle}</p>
                      {item.status !== "N/A" && (
                        <Badge className={`mt-1 text-[10px] px-1.5 py-0 h-4 font-normal border-0 ${config.badge}`}>
                          {item.status}
                        </Badge>
                      )}
                    </div>

                    <ArrowRight className="mt-2 h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </GlowCard>
  );
};

export default RecentActivity;
