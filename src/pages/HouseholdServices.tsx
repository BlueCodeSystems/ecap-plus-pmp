import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  RefreshCcw,
  Home,
  Activity,
  MapPin,
  AlertTriangle,
  ChevronRight,
  HeartPulse,
  BookOpen,
  Shield,
  Landmark,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { format, subMonths, isAfter, parseISO, parse, subDays, getMonth, getYear } from "date-fns";
import { cn, toTitleCase } from "@/lib/utils";
import { isCategoryProvided } from "@/lib/data-validation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GlowCard from "@/components/aceternity/GlowCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingDots from "@/components/aceternity/LoadingDots";

import { useQuery } from "@tanstack/react-query";
import {
  getHouseholdServicesByDistrict,
  getHouseholdsByDistrict,
} from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const RiskKpiCard = ({ label, count, percent, thresholds, icon: Icon, description, to }: any) => {
  const isPercentValid = typeof percent === "number" && !isNaN(percent);
  const isCountValid = count !== null && count !== undefined;
  const value = isCountValid ? count.toLocaleString() : "0";
  const percentageText = isPercentValid ? ` (${percent.toFixed(1)}%)` : "";

  const getStyle = () => {
    if (!isPercentValid || !thresholds) return { bg: "bg-slate-50", text: "text-slate-600" };
    if (thresholds.inverse) {
      if (percent <= thresholds.red) return { bg: "bg-rose-50", text: "text-rose-600" };
      if (percent <= thresholds.yellow) return { bg: "bg-amber-50", text: "text-amber-600" };
      return { bg: "bg-emerald-50", text: "text-emerald-600" };
    }
    if (percent >= thresholds.red) return { bg: "bg-rose-50", text: "text-rose-600" };
    if (percent >= thresholds.yellow) return { bg: "bg-amber-50", text: "text-amber-600" };
    return { bg: "bg-emerald-50", text: "text-emerald-600" };
  };

  const style = getStyle();

  const content = (
    <div
      className={cn(
        "p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md active:scale-95 border-slate-100 h-full flex flex-col justify-between",
        to && "cursor-pointer"
      )}
    >
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className={cn("p-2 rounded-lg", style.bg, style.text)}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold tracking-wider text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900">{value}</span>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 mt-1">
        {to ? "Click to view" : description}{percentageText}
      </p>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block group h-full">
        {content}
      </Link>
    );
  }

  return content;
};


// ─── Helpers ──────────────────────────────────────────────────────────────────

const SERVICE_CATEGORIES = ["health_services", "other_health_services", "schooled_services", "other_schooled_services", "safe_services", "other_safe_services", "stable_services", "other_stable_services", "hh_level_services", "other_hh_level_services"] as const;
const NOT_APPLICABLE = ["not applicable", "n/a", "na", "none", "no", "false", "0", "[]", "{}", "null", ""];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];


const parseHealthServices = (services: any): string[] => {
  if (!services) return [];
  if (Array.isArray(services)) return services.map(s => String(s));
  try {
    const parsed = typeof services === "string" && (services.startsWith("[") || services.startsWith("{")) ? JSON.parse(services) : services;
    if (Array.isArray(parsed)) return parsed.map(s => String(s));
  } catch (e) {
  }
  return String(services).split(",").map(s => s.trim().replace(/[\[\]"]/g, "")).filter(s => s && !NOT_APPLICABLE.includes(s.toLowerCase()));
};




const DAY_MS = 1000 * 60 * 60 * 24;
const NINETY_DAYS_MS = 90 * DAY_MS;

const CHART_COLORS = ["#059669", "#0891b2", "#7c3aed", "#db2777", "#ea580c", "#ca8a04", "#16a34a", "#2563eb", "#9333ea", "#e11d48"];

const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") return String(value);
  }
  return "N/A";
};

const filterKeyToDataKey: Record<string, string> = {};

const parseServiceRecordDate = (record: Record<string, unknown>): Date | null => {
  const raw =
    record.service_date ||
    record.visit_date ||
    record.date ||
    record.created_at ||
    record.service_month ||
    record.referral_month;

  if (!raw) return null;

  const rawStr = String(raw).trim();
  let dateObj: Date;

  if (/^\d{4}-\d{2}-\d{2}/.test(rawStr) || rawStr.includes("T")) {
    dateObj = parseISO(rawStr);
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawStr)) {
    dateObj = parse(rawStr, "dd-MM-yyyy", new Date());
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawStr)) {
    dateObj = parse(rawStr, "dd/MM/yyyy", new Date());
  } else {
    dateObj = new Date(rawStr);
  }

  return isNaN(dateObj.getTime()) ? null : dateObj;
};

const getJuneReportingYear = (referenceDate: Date): number => {
  return referenceDate.getMonth() >= 5 ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1;
};


// ─── Component ────────────────────────────────────────────────────────────────

const HouseholdServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDistrictUser = user?.description === "District User";
  const isProvincialUser = user?.description === "Provincial User";
  const userProvince = user?.title;

  // Initial state logic for district security
  const initialDistrict = (isDistrictUser && user?.location)
    ? user.location
    : "All";

  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJuneYear, setSelectedJuneYear] = useState<string>(() => String(getJuneReportingYear(new Date())));


  // SECURITY: Enforce district lock for District Users
  useEffect(() => {
    if (isDistrictUser && user?.location && selectedDistrict !== user.location) {
      setSelectedDistrict(user.location);
    }
  }, [user, selectedDistrict, isDistrictUser]);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const householdsListQuery = useQuery({
    queryKey: ["districts-discovery"],
    queryFn: () => getHouseholdsByDistrict(""),
    staleTime: 1000 * 60 * 30,
  });

  const discoveredDistrictsMap = useMemo(() => {
    const groups = new Map<string, string[]>();
    if (householdsListQuery.data) {
      householdsListQuery.data.forEach((h: any) => {
        if (isProvincialUser && userProvince && h.province !== userProvince) return;
        const raw = h.district;
        if (raw) {
          const normalized = toTitleCase(raw.trim());
          if (!groups.has(normalized)) groups.set(normalized, []);
          const variants = groups.get(normalized)!;
          if (!variants.includes(raw)) variants.push(raw);
        }
      });
    }
    return groups;
  }, [householdsListQuery.data, isProvincialUser, userProvince]);

  const districts = useMemo(() => {
    return Array.from(discoveredDistrictsMap.keys()).sort();
  }, [discoveredDistrictsMap]);

  const servicesQuery = useQuery({
    queryKey: ["household-services", "All"], // Fetch all for local filtering (syncs variants)
    queryFn: () => getHouseholdServicesByDistrict(""),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    retry: false,
  });

  const allServices: Record<string, unknown>[] = servicesQuery.data ?? [];
  const isSyncing = servicesQuery.isFetching;

  // DEBUG: Log first 3 records to inspect API fields
  if (allServices.length > 0) {
    console.log("HouseholdServices API fields:", Object.keys(allServices[0]));
    console.log("HouseholdServices sample records:", allServices.slice(0, 3));
  }

  const availableJuneYears = useMemo(() => {
    const years = new Set<number>();

    allServices.forEach((service) => {
      const d = parseServiceRecordDate(service);
      if (!d) return;
      years.add(getJuneReportingYear(d));
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    if (sortedYears.length === 0) {
      sortedYears.push(getJuneReportingYear(new Date()));
    }
    return sortedYears;
  }, [allServices]);

  useEffect(() => {
    const selected = Number(selectedJuneYear);
    if (availableJuneYears.includes(selected)) return;

    const currentJuneYear = getJuneReportingYear(new Date());
    const fallbackYear = availableJuneYears.includes(currentJuneYear)
      ? currentJuneYear
      : availableJuneYears[0];

    setSelectedJuneYear(String(fallbackYear));
  }, [availableJuneYears, selectedJuneYear]);

  const juneWindowServices = useMemo(() => {
    const selectedYear = Number(selectedJuneYear);
    const reportingYear = Number.isFinite(selectedYear) ? selectedYear : getJuneReportingYear(new Date());
    const juneStart = new Date(reportingYear, 5, 1);
    const nextJuneStart = new Date(reportingYear + 1, 5, 1);

    return allServices.filter((service) => {
      const d = parseServiceRecordDate(service);
      return !!d && d >= juneStart && d < nextJuneStart;
    });
  }, [allServices, selectedJuneYear]);

  // ── KPI Computation ────────────────────────────────────────────────────────

  const householdCwMap = useMemo(() => {
    const map: Record<string, string> = {};
    const households = (householdsListQuery.data ?? []) as any[];
    households.forEach((h: any) => {
      const id = String(h.household_id || h.hh_id || h.hhid || "").trim();
      const cw = h.caseworker_name || h.cwac_member_name || h.caseworker || "";
      if (id && cw) map[id] = cw;
    });
    return map;
  }, [householdsListQuery.data]);

  const dashboardStats = useMemo(() => {
    const services = juneWindowServices;
    const now = new Date();
    const NINETY_DAYS_AGO = subDays(now, 90);

    const households = (householdsListQuery.data ?? []) as any[];

    const hhServiceMap = new Map<string, any[]>();
    const selectedVariants = selectedDistrict === "All" ? [] : (discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict]);

    services.forEach(s => {
      const hhId = String(s.household_id || s.hh_id || s.hhid || s.id || "unknown").trim();
      const sDistrict = String(s.district || "");

      if (selectedDistrict !== "All" && !selectedVariants.includes(sDistrict)) return;

      if (!hhServiceMap.has(hhId)) hhServiceMap.set(hhId, []);
      hhServiceMap.get(hhId)?.push(s);
    });

    const registeredHhs = households.filter(h => {
      const hDistrict = String(h.district || "");
      return selectedDistrict === "All" || selectedVariants.includes(hDistrict);
    });

    const registrationCount = registeredHhs.length;

    // 4. Compute per-household domain coverage based on REGISTERED households
    let healthCount = 0;
    let schooledCount = 0;
    let safeCount = 0;
    let stableCount = 0;
    let allDomainsCount = 0;
    let activeHHCount = 0;

    registeredHhs.forEach((h) => {
      const hhId = String(h.household_id || h.hhid || h.id).trim();
      const hhServices = hhServiceMap.get(hhId) || [];

      let hasHealth = false;
      let hasSchooled = false;
      let hasSafe = false;
      let hasStable = false;
      let isActive = false;

      hhServices.forEach(s => {
        const sDate = parseServiceRecordDate(s);
        if (sDate && isAfter(sDate, NINETY_DAYS_AGO)) isActive = true;

        if (isCategoryProvided(s, "health_services")) hasHealth = true;
        if (isCategoryProvided(s, "schooled_services")) hasSchooled = true;
        if (isCategoryProvided(s, "safe_services")) hasSafe = true;
        if (isCategoryProvided(s, "stable_services")) hasStable = true;
      });

      if (hasHealth) healthCount++;
      if (hasSchooled) schooledCount++;
      if (hasSafe) safeCount++;
      if (hasStable) stableCount++;
      if (hasHealth && hasSchooled && hasSafe && hasStable) allDomainsCount++;
      if (isActive) activeHHCount++;
    });

    return {
      totalHouseholds: registrationCount,
      // Domain coverage
      healthRate: registrationCount > 0 ? (healthCount / registrationCount) * 100 : 0,
      schooledRate: registrationCount > 0 ? (schooledCount / registrationCount) * 100 : 0,
      safeRate: registrationCount > 0 ? (safeCount / registrationCount) * 100 : 0,
      stableRate: registrationCount > 0 ? (stableCount / registrationCount) * 100 : 0,
      allDomainsRate: registrationCount > 0 ? (allDomainsCount / registrationCount) * 100 : 0,
      registrationCount,
      healthCount,
      schooledCount,
      safeCount,
      stableCount,
      allDomainsCount,
      activeHHCount,
      totalVisits: Array.from(hhServiceMap.values()).reduce((sum, records) => sum + records.length, 0),
    };
  }, [juneWindowServices, selectedDistrict, householdsListQuery.data, discoveredDistrictsMap]);

  // ── Filtered audit log
  const filteredAuditLog = useMemo(() => {
    const selectedVariants = selectedDistrict === "All" ? [] : (discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict]);

    const base = juneWindowServices.filter((s) => {
      if (isProvincialUser && userProvince && s.province !== userProvince) return false;
      const sDistrict = String(s.district || "");
      if (selectedDistrict !== "All" && !selectedVariants.includes(sDistrict)) return false;


      const query = searchQuery.toLowerCase();
      const hhId = String(s.household_id || s.hh_id || s.hhid || s.id || "").trim();
      const caseworker = String(s.caseworker_name || s.caseworker || householdCwMap[hhId] || "").toLowerCase();

      return hhId.toLowerCase().includes(query) ||
        sDistrict.toLowerCase().includes(query) ||
        caseworker.includes(query);
    });

    // Sort by latest service date (most recent first)
    const getTimestamp = (record: any) => {
      const raw =
        record.service_date ||
        record.visit_date ||
        record.date ||
        record.created_at ||
        record.service_month ||
        record.referral_month;

      if (!raw) return 0;

      const rawStr = String(raw).trim();
      let dateObj: Date | null = null;

      // ISO-like formats (e.g. 2025-02-19 or with time)
      if (/^\d{4}-\d{2}-\d{2}/.test(rawStr) || rawStr.includes("T")) {
        dateObj = parseISO(rawStr);
      }
      // Day-first format used in your table (e.g. 19-02-2024)
      else if (/^\d{2}-\d{2}-\d{4}$/.test(rawStr)) {
        dateObj = parse(rawStr, "dd-MM-yyyy", new Date());
      }
      // Common alternative with slashes
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawStr)) {
        dateObj = parse(rawStr, "dd/MM/yyyy", new Date());
      } else {
        // Fallback – let JS try to parse
        dateObj = new Date(rawStr);
      }

      const time = dateObj.getTime();
      return isNaN(time) ? 0 : time;
    };

    return [...base].sort((a, b) => getTimestamp(b) - getTimestamp(a));
  }, [juneWindowServices, selectedDistrict, searchQuery, householdCwMap, discoveredDistrictsMap, isProvincialUser, userProvince]);

  const healthServiceStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const parseServices = (val: any): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map(String);
      try {
        const parsed = typeof val === "string" && (val.startsWith("[") || val.startsWith("{")) ? JSON.parse(val) : val;
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {}
      return String(val).split(",").map(s => s.trim().replace(/[\[\]"]/g, "")).filter(s => s && s.toLowerCase() !== "not applicable" && s.toLowerCase() !== "n/a" && s !== "none" && s !== "");
    };

    (juneWindowServices || []).forEach((s: any) => {
      ["health_services", "other_health_services"].forEach(field => {
        parseServices(s[field]).forEach(name => {
          counts[name] = (counts[name] || 0) + 1;
        });
      });
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [juneWindowServices]);

  const filteredHouseholds = useMemo(() => {
    const households = (householdsListQuery.data ?? []) as any[];
    if (selectedDistrict === "All") return households;
    const selectedVariants = discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict];
    return households.filter(h => selectedVariants.includes(String(h.district || "")));
  }, [householdsListQuery.data, selectedDistrict, discoveredDistrictsMap]);

  const [dqFilter, setDqFilter] = useState<string | null>(null);

  const insights = useMemo(() => {
    const base = juneWindowServices;
    const now = new Date();
    const isEmpty = (v: unknown) => !v || v === "" || v === "not applicable" || v === "N/A" || v === "[]" || v === "none";

    const noServiceDate = base.filter(r => isEmpty(r.service_date));
    const noHealth = base.filter(r => isEmpty(r.health_services) && isEmpty(r.other_health_services));
    const noSchooled = base.filter(r => isEmpty(r.schooled_services) && isEmpty(r.other_schooled_services));
    const noSafe = base.filter(r => isEmpty(r.safe_services) && isEmpty(r.other_safe_services));
    const noStable = base.filter(r => isEmpty(r.stable_services) && isEmpty(r.other_stable_services));
    const noHhServices = base.filter(r => isEmpty(r.hh_level_services) && isEmpty(r.other_hh_level_services));
    const incomplete = base.filter(r =>
      (isEmpty(r.health_services) && isEmpty(r.other_health_services)) ||
      (isEmpty(r.schooled_services) && isEmpty(r.other_schooled_services)) ||
      (isEmpty(r.safe_services) && isEmpty(r.other_safe_services)) ||
      (isEmpty(r.stable_services) && isEmpty(r.other_stable_services))
    );

    const futureDated = base.filter(r => { const d = new Date(r.service_date as string); return !isNaN(d.getTime()) && d > now; });
    const seen = new Set<string>();
    const duplicates: any[] = [];
    base.forEach(r => { const key = `${r.household_id}|${r.service_date}|${r.health_services}`; if (seen.has(key)) duplicates.push(r); else seen.add(key); });

    return [
      { key: "no_date", label: "Missing service date", count: noServiceDate.length, records: noServiceDate },
      { key: "no_health", label: "No health services", count: noHealth.length, records: noHealth },
      { key: "no_schooled", label: "No education services", count: noSchooled.length, records: noSchooled },
      { key: "no_safe", label: "No safety services", count: noSafe.length, records: noSafe },
      { key: "no_stable", label: "No stability services", count: noStable.length, records: noStable },
      { key: "no_hh", label: "No HH level services", count: noHhServices.length, records: noHhServices },
      { key: "incomplete", label: "Incomplete coverage", count: incomplete.length, records: incomplete },
      { key: "future", label: "Future-dated", count: futureDated.length, records: futureDated },
      { key: "duplicates", label: "Duplicate records", count: duplicates.length, records: duplicates },
    ];
  }, [juneWindowServices]);

  const displayedServices = useMemo(() => {
    if (!dqFilter) return filteredAuditLog;
    const insight = insights.find(i => i.key === dqFilter);
    if (!insight) return filteredAuditLog;
    const dqSet = new Set(insight.records);
    return filteredAuditLog.filter(r => dqSet.has(r));
  }, [filteredAuditLog, dqFilter, insights]);

  const isLoading = servicesQuery.isLoading;

  // ─── Render helpers ────────────────────────────────────────────────────────

  const KpiCard = ({
    label,
    value,
    icon: Icon,
    color,
    bg,
    suffix = "",
    sub = "",
  }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    bg: string;
    suffix?: string;
    sub?: string;
  }) => (
    <GlowCard className="p-0 border-0 overflow-hidden group">
      <div className="p-5 flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-wider text-slate-500 mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {isLoading ? <LoadingDots className="h-2 w-2" /> : value}
            </p>
            {suffix && <span className="text-sm font-bold text-slate-400">{suffix}</span>}
          </div>
          {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`${bg} ${color} p-3 rounded-xl shadow-sm group-hover:rotate-6 transition-all duration-300 ml-3 shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </GlowCard>
  );

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout subtitle="Impact Analytics">

      {/* ── Banner ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg mb-8">
        <div className="relative bg-gradient-to-r from-green-800 via-emerald-600 to-teal-500 px-4 py-12 sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>

              <span className="inline-block text-[10px] font-bold tracking-widest text-emerald-200 bg-white/10 px-3 py-1 rounded-full mb-2 uppercase">Registry overview</span>
              <h1 className="text-3xl font-black text-white lg:text-4xl leading-tight">
                Household Services
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-white/90 text-xs font-bold tracking-wide">
                <span className="flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5 text-emerald-200" />
                  {(dashboardStats?.totalHouseholds ?? 0).toLocaleString()} Households
                </span>
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-emerald-200" />
                  {(dashboardStats?.totalVisits ?? 0).toLocaleString()} Service events
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-200" />
                  {selectedDistrict === "All" ? "All Districts" : selectedDistrict}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Select
                value={selectedJuneYear}
                onValueChange={setSelectedJuneYear}
              >
                <SelectTrigger className="w-[220px] bg-emerald-800/40 border-emerald-400/30 text-white h-12 rounded-2xl font-bold focus:ring-white/20">
                  <SelectValue placeholder="Select June year" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-emerald-100 shadow-2xl">
                  {availableJuneYears.map((year) => (
                    <SelectItem key={year} value={String(year)} className="rounded-xl focus:bg-emerald-50">
                      June {year} - May {year + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isDistrictUser ? (
                <div className="h-12 px-5 rounded-2xl bg-white/10 border border-white/20 text-white/70 flex items-center text-sm font-medium">
                  {selectedDistrict}
                </div>
              ) : (
                <Select
                  value={selectedDistrict}
                  onValueChange={setSelectedDistrict}
                >
                  <SelectTrigger className="w-[180px] bg-emerald-800/40 border-emerald-400/30 text-white h-12 rounded-2xl font-bold focus:ring-white/20">
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-emerald-100 shadow-2xl">
                    <SelectItem value="All" className="rounded-xl focus:bg-emerald-50">All districts</SelectItem>
                    {districts.map((d) => (
                      <SelectItem key={d} value={d} className="rounded-xl focus:bg-emerald-50">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={() => servicesQuery.refetch()}
                className="h-12 px-6 rounded-2xl bg-white text-[#00a67e] hover:bg-emerald-50 font-bold transition-all active:scale-95 shadow-lg shadow-black/5"
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                Sync
              </Button>
            </div>

          </div>
        </div>


      </div>



      {/* ── Domain Coverage KPIs + Health Services Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Left: Coverage KPI Cards */}
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 grid-cols-2">
            {/* Health Domain */}
            <RiskKpiCard
              label="Health"
              percent={dashboardStats?.healthRate}
              count={dashboardStats?.healthCount}
              thresholds={{ yellow: 60, red: 40, inverse: true }}
              icon={HeartPulse}
              description="Click to view households missing health services"
              to={`/registers/household-risk?type=health_domain&district=${selectedDistrict}`}
            />
            {/* Schooled Domain */}
            <RiskKpiCard
              label="Schooled"
              percent={dashboardStats?.schooledRate}
              count={dashboardStats?.schooledCount}
              thresholds={{ yellow: 60, red: 40, inverse: true }}
              icon={BookOpen}
              description="Click to view households missing school services"
              to={`/registers/household-risk?type=schooled_domain&district=${selectedDistrict}`}
            />
            {/* Safe Domain */}
            <RiskKpiCard
              label="Safe"
              percent={dashboardStats?.safeRate}
              count={dashboardStats?.safeCount}
              thresholds={{ yellow: 60, red: 40, inverse: true }}
              icon={Shield}
              description="Click to view households missing safety services"
              to={`/registers/household-risk?type=safe_domain&district=${selectedDistrict}`}
            />
            {/* Stable Domain */}
            <RiskKpiCard
              label="Stable"
              percent={dashboardStats?.stableRate}
              count={dashboardStats?.stableCount}
              thresholds={{ yellow: 60, red: 40, inverse: true }}
              icon={Landmark}
              description="Click to view households missing stability services"
              to={`/registers/household-risk?type=stable_domain&district=${selectedDistrict}`}
            />
          </div>
          {/* Graduation Readiness */}
          <RiskKpiCard
            label="Graduation Readiness (All 4 Domains)"
            percent={dashboardStats?.allDomainsRate}
            count={dashboardStats?.allDomainsCount}
            thresholds={{ yellow: 15, red: 5, inverse: true }}
            icon={GraduationCap}
            description="HHs covered across Health, Schooled, Safe & Stable"
            to={`/registers/household-risk?type=graduation_path&district=${selectedDistrict}`}
          />
        </div>

        {/* Right: Most common health services chart */}
        <GlowCard className="overflow-hidden border-slate-200 shadow-sm h-full">
          <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/30">
            <CardTitle className="text-lg font-black text-slate-900">Most common health services</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {healthServiceStats.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-sm font-bold">No health services found</p>
              </div>
            ) : (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthServiceStats} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 800 }} />
                    <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {healthServiceStats.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </GlowCard>
      </div>

      {/* ── Data Quality & Insights ── */}
      <div className="mb-8 mt-6">
        <h3 className="text-sm font-bold text-slate-500 mb-3 tracking-wide">Data quality & insights</h3>
        <p className="text-xs text-slate-400 mb-4">Click a card to filter records</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-3">
          {insights.map((item) => (
            <div
              key={item.key}
              onClick={() => { setDqFilter(dqFilter === item.key ? null : item.key); }}
              className={cn(
                "cursor-pointer rounded-2xl border p-4 transition-all hover:shadow-md",
                dqFilter === item.key
                  ? "border-emerald-500 bg-emerald-50 shadow-sm"
                  : "border-slate-100 bg-white hover:border-slate-200"
              )}
            >
              <p className="text-2xl font-extrabold text-slate-900">{item.count}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
        {dqFilter && (
          <div className="mt-3 flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-bold">
              Filtered: {insights.find(i => i.key === dqFilter)?.label}
            </Badge>
            <button onClick={() => setDqFilter(null)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* ── Stability Insights ── */}
      {/* 
      <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        <GlowCard className="border-slate-200 bg-white shadow-sm w-full overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </div>
              <div>
                <CardTitle className="text-base font-black text-slate-900">Stability blockers</CardTitle>
                <CardDescription className="text-[10px] font-bold text-rose-500/80 tracking-wider">Critical intervention gaps detected</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {([
                { label: "Health Gap", count: (dashboardStats?.totalHouseholds ?? 0) - (dashboardStats?.healthCount ?? 0), rate: dashboardStats?.healthRate ?? 0, color: "bg-rose-50 border-rose-100", textColor: "text-rose-600", desc: "No health services recorded" },
                { label: "Schooled Gap", count: (dashboardStats?.totalHouseholds ?? 0) - (dashboardStats?.schooledCount ?? 0), rate: dashboardStats?.schooledRate ?? 0, color: "bg-emerald-50 border-emerald-100", textColor: "text-emerald-600", desc: "No schooled services recorded" },
                { label: "Safe Gap", count: (dashboardStats?.totalHouseholds ?? 0) - (dashboardStats?.safeCount ?? 0), rate: dashboardStats?.safeRate ?? 0, color: "bg-emerald-50 border-emerald-100", textColor: "text-emerald-600", desc: "No safe services recorded" },
                { label: "Stable Gap", count: (dashboardStats?.totalHouseholds ?? 0) - (dashboardStats?.stableCount ?? 0), rate: dashboardStats?.stableRate ?? 0, color: "bg-emerald-50 border-emerald-100", textColor: "text-emerald-600", desc: "No stable services recorded" },
              ]).map(({ label, count, rate, color, textColor, desc }) => (
                <div key={label} className={`flex items-center justify-between p-5 rounded-xl border transition-all hover:brightness-95 ${color}`}>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1 tracking-wider">{label}</p>
                    <p className={`text-2xl font-black tracking-tight ${textColor}`}>{count.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{desc} ({(100 - rate).toFixed(1)}%)</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">
                Domains with the highest gap rates are priority areas for intervention. Target households missing multiple domains for immediate case plan review.
              </p>
            </div>
          </CardContent>
        </GlowCard>
      </div> 
      */}

      {/* ── Household Audit Trail ── */}
      <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
        <GlowCard className="overflow-hidden border-0 shadow-2xl">
          <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  Household services

                </h3>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">
                  Showing {displayedServices.length} most recent interventions
                </p>
              </div>
              <div className="relative w-full md:w-[400px] group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  placeholder="Search by Beneficiary ID, Caseworker or District..."
                  className="pl-11 bg-slate-50 border-slate-200 h-11 text-sm font-bold rounded-xl shadow-inner focus-visible:ring-emerald-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 pl-8 h-14">Beneficiary id</TableHead>
                  <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 h-14">District</TableHead>
                  <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 h-14">Date of service</TableHead>
                  <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 h-14">Service provided</TableHead>
                  <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 h-14">HH level services</TableHead>
                  <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 text-right pr-8 h-14">Caseworker</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20">
                      <LoadingDots className="h-3 w-3" />
                    </TableCell>
                  </TableRow>
                ) : displayedServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <Search className="h-10 w-10 text-slate-400" />
                        <p className="text-sm font-black tracking-widest text-slate-500">No records matched your search</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : displayedServices.slice(0, 50).map((s, idx) => {
                  const record = s as Record<string, unknown>;
                  const hhId = String(s.household_id || s.hhid || "N/A");
                  const dateStr = pickValue(record, ["service_date", "visit_date", "date"]);

                  const caseworker = s.caseworker_name ||
                    s.caseworker ||
                    householdCwMap[hhId] ||
                    "N/A";

                  const providedServices: string[] = [];
                  const primaryService = String(pickValue(record, ["service", "service_name", "form_name"]));
                  if (primaryService !== "N/A") providedServices.push(primaryService);

                  SERVICE_CATEGORIES.forEach(cat => {
                    if (record[cat]) {
                      const parsed = parseHealthServices(record[cat]);
                      parsed.forEach(svc => {
                        if (svc && !providedServices.includes(svc)) providedServices.push(svc);
                      });
                    }
                  });

                  return (
                    <TableRow key={idx} className="hover:bg-slate-50/80 transition-all border-b border-slate-50 group text-sm">
                      <TableCell className="pl-8 py-5">
                        <div
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => navigate(`/profile/household-details`, { state: { id: hhId } })}
                        >
                          <span className="font-mono text-[11px] bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200/40 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-100 transition-all tracking-tight">
                            {hhId}
                          </span>
                          <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600" />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-600 tracking-tighter">
                        {String(s.district || "N/A")}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-500">
                        {dateStr}
                      </TableCell>
                      <TableCell className="max-w-[250px] lg:max-w-[350px]">
                        <div className="flex flex-wrap gap-1 overflow-hidden">
                          {providedServices.length > 0 ? (
                            providedServices.slice(0, 3).map((svc, i) => (
                              <Badge key={i} variant="outline" className="text-[8px] sm:text-[9px] font-bold border-slate-200 bg-white h-5 sm:h-6 px-1.5 sm:px-2.5 rounded-md truncate max-w-[120px] sm:max-w-[160px]" title={svc}>
                                {svc}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold italic">No service logged</span>
                          )}
                          {providedServices.length > 3 && (
                            <Badge variant="outline" className="text-[8px] sm:text-[9px] font-bold border-emerald-100 bg-emerald-50 text-emerald-700 h-5 sm:h-6 px-1.5 sm:px-2.5 rounded-md shrink-0">
                              +{providedServices.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-500">
                        {(() => {
                          const hhServices = [
                            ...(record.hh_level_services ? String(record.hh_level_services).split(",").map(s => s.trim()).filter(Boolean) : []),
                            ...(record.other_hh_level_services ? String(record.other_hh_level_services).split(",").map(s => s.trim()).filter(Boolean) : []),
                          ];
                          return hhServices.length > 0 ? hhServices.join(", ") : "N/A";
                        })()}
                      </TableCell>
                      <TableCell className="text-right pr-8 py-5">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-slate-900 text-[11px] truncate max-w-[150px]">
                            {String(caseworker)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold tracking-widest">Case worker</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-black text-slate-400 hover:text-emerald-600 tracking-widest"
              onClick={() => {
                const params = new URLSearchParams();
                if (selectedDistrict !== "All") params.append("district", selectedDistrict);
                if (searchQuery) params.append("search", searchQuery);
                const queryString = params.toString();
                navigate(`/households${queryString ? `?${queryString}` : ""}`);
              }}
            >
              Access Full Household Register <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </GlowCard>
      </div>
    </DashboardLayout >
  );
};

export default HouseholdServices;
