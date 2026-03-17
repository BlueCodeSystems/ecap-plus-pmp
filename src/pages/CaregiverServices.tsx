import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  FileText,
  MapPin,
  ChevronRight,
  TrendingUp,
  Activity,
  Home,
  RefreshCcw,
  Stethoscope,
  Target,
  HeartPulse,
  BookOpen,
  Shield,
  Landmark,
  GraduationCap,
  AlertTriangle
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

import GlowCard from "@/components/aceternity/GlowCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingDots from "@/components/aceternity/LoadingDots";
import { useQuery } from "@tanstack/react-query";
import {
  getCaregiverServicesByDistrict,
  getHouseholdsByDistrict,
} from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { format, isAfter, parseISO, parse, getMonth, getYear } from "date-fns";
import { cn, toTitleCase } from "@/lib/utils";
import { isCategoryProvided } from "@/lib/data-validation";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SERVICE_CATEGORIES = [
  "health_services",
  "hiv_services",
  "schooled_services",
  "safe_services",
  "stable_services",
  "other_health_services",
  "other_hiv_services",
  "other_schooled_services",
  "other_safe_services",
  "other_stable_services",
] as const;

const NOT_APPLICABLE = ["not applicable", "n/a", "na", "none", "no", "false", "0", "[]", "{}"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = ["2024", "2025", "2026"];





const parseHealthServices = (services: any): string[] => {
  if (!services) return [];
  if (Array.isArray(services)) return services.map(s => String(s));
  try {
    const parsed = typeof services === "string" && (services.startsWith("[") || services.startsWith("{")) ? JSON.parse(services) : services;
    if (Array.isArray(parsed)) return parsed.map(s => String(s));
  } catch (e) {
    // If not JSON, try splitting by comma
  }
  return String(services).split(",").map(s => s.trim().replace(/[\[\]"]/g, "")).filter(s => s && !NOT_APPLICABLE.includes(s.toLowerCase()));
};

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

const DAY_MS = 1000 * 60 * 60 * 24;
const NINETY_DAYS_MS = 90 * DAY_MS;
const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7", "#ec4899", "#06b6d4", "#f43f5e", "#8b5cf6"];

const RiskKpiCard = ({ label, count, percent, thresholds, icon: Icon, description, isAbsoluteOnly = false, to }: any) => {
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
        {to ? "Click to view" : description}{!isAbsoluteOnly && percentageText}
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


const CaregiverServices = () => {
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
  const [dqFilter, setDqFilter] = useState<string | null>(null);

  // SECURITY: Enforce district lock for District Users
  useEffect(() => {
    if (isDistrictUser && user?.location && selectedDistrict !== user.location) {
      setSelectedDistrict(user.location);
    }
  }, [user, selectedDistrict, isDistrictUser]);

  // Discover districts
  const hhListQuery = useQuery({
    queryKey: ["districts-discovery", "All"],
    queryFn: () => getHouseholdsByDistrict(""),
    staleTime: 1000 * 60 * 30,
  });

  const discoveredDistrictsMap = useMemo(() => {
    const groups = new Map<string, string[]>();
    if (hhListQuery.data) {
      (hhListQuery.data as any[]).forEach((h: any) => {
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
  }, [hhListQuery.data, isProvincialUser, userProvince]);

  const districts = useMemo(() => {
    return Array.from(discoveredDistrictsMap.keys()).sort();
  }, [discoveredDistrictsMap]);

  const servicesQuery = useQuery({
    queryKey: ["caregiver-services-all", "All"], // Fetch all for local filtering
    queryFn: () => getCaregiverServicesByDistrict(""),
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  // Removed stale cache logic to ensure fresh rendering

  // --- DATA FETCHING ---
  const householdsQuery = useQuery({
    queryKey: ["households-all", "All"], // Fetch all for local filtering
    queryFn: () => getHouseholdsByDistrict(""),
    staleTime: 1000 * 60 * 30,
  });

  const households = useMemo(() => householdsQuery.data ?? [], [householdsQuery.data]);
  const allServices = useMemo(() => (servicesQuery.data ?? []) as any[], [servicesQuery.data]);

  // DEBUG: Log first 3 records to inspect API fields
  if (allServices.length > 0) {
    console.log("CaregiverServices API fields:", Object.keys(allServices[0]));
    console.log("CaregiverServices sample records:", allServices.slice(0, 3));
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

  // mapping of household_id -> caseworker_name
  const householdCwMap = useMemo(() => {
    const map: Record<string, string> = {};
    households.forEach((h: any) => {
      const id = String(h.household_id || h.hh_id || "");
      const cw = h.caseworker_name || h.cwac_member_name || h.caseworker || "";
      if (id && cw) map[id] = cw;
    });
    return map;
  }, [households]);

  const filteredServices = useMemo(() => {
    const selectedVariants = selectedDistrict === "All" ? [] : (discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict]);

    const base = juneWindowServices.filter((service: any) => {
      if (isProvincialUser && userProvince && service.province !== userProvince) return false;
      const sDistrict = String(service.district || "");
      if (selectedDistrict !== "All" && !selectedVariants.includes(sDistrict)) return false;

      // Month/Year filter
      const rawDate = service.service_date || service.visit_date || service.date;
      const sDate = rawDate ? parseISO(String(rawDate)) : null;
      const isValidDate = sDate && !isNaN(sDate.getTime());
      const hhId = String(service.household_id || service.hh_id || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      const cw = String(service.caseworker_name || householdCwMap[hhId] || "").toLowerCase();

      return hhId.includes(query) || sDistrict.toLowerCase().includes(query) || cw.includes(query);
    });

    return [...base].sort((a, b) => {
      const valA = (a.service_date || a.date || 0) as any;
      const valB = (b.service_date || b.date || 0) as any;
      return new Date(valB).getTime() - new Date(valA).getTime();
    });
  }, [juneWindowServices, searchQuery, selectedDistrict, householdCwMap, discoveredDistrictsMap, isProvincialUser, userProvince]);

  const filteredHouseholds = useMemo(() => {
    const selectedVariants = selectedDistrict === "All" ? [] : (discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict]);
    return households.filter((h: any) => {
      if (isProvincialUser && userProvince && h.province !== userProvince) return false;
      const hDistrict = String(h.district || "");
      if (selectedDistrict !== "All" && !selectedVariants.includes(hDistrict)) return false;
      return true;
    });
  }, [households, selectedDistrict, discoveredDistrictsMap, isProvincialUser, userProvince]);

  const insights = useMemo(() => {
    const base = juneWindowServices;
    const now = new Date();
    const isEmpty = (v: any) => !v || v === "" || v === "not applicable" || v === "N/A" || v === "[]" || v === "none";

    const noServiceDate = base.filter(r => isEmpty(r.service_date));
    const noHealth = base.filter(r => isEmpty(r.health_services) && isEmpty(r.other_health_services));
    const noHiv = base.filter(r => isEmpty(r.hiv_services) && isEmpty(r.other_hiv_services));
    const noSchooled = base.filter(r => isEmpty(r.schooled_services) && isEmpty(r.other_schooled_services));
    const noSafe = base.filter(r => isEmpty(r.safe_services) && isEmpty(r.other_safe_services));
    const noStable = base.filter(r => isEmpty(r.stable_services) && isEmpty(r.other_stable_services));
    const incomplete = base.filter(r =>
      (isEmpty(r.health_services) && isEmpty(r.other_health_services)) ||
      (isEmpty(r.schooled_services) && isEmpty(r.other_schooled_services)) ||
      (isEmpty(r.safe_services) && isEmpty(r.other_safe_services)) ||
      (isEmpty(r.stable_services) && isEmpty(r.other_stable_services))
    );

    const hivPositive = base.filter(r => r.is_hiv_positive === "1" || r.is_hiv_positive === true);
    const hivNoVl = hivPositive.filter(r => isEmpty(r.date_last_vl) || isEmpty(r.vl_last_result));
    const vlSuppressed = hivPositive.filter(r => {
      const val = String(r.vl_last_result || "").toLowerCase();
      return val.includes("suppress") || val.includes("undetect") || val === "ldl" || (Number(r.vl_last_result) > 0 && Number(r.vl_last_result) < 1000);
    });

    const futureDated = base.filter(r => { const d = new Date(r.service_date); return !isNaN(d.getTime()) && d > now; });
    const seen = new Set<string>();
    const duplicates: any[] = [];
    base.forEach(r => { const key = `${r.household_id}|${r.service_date}|${r.health_services}`; if (seen.has(key)) duplicates.push(r); else seen.add(key); });

    return [
      { key: "no_date", label: "Missing service date", count: noServiceDate.length, records: noServiceDate },
      { key: "no_health", label: "No health services", count: noHealth.length, records: noHealth },
      { key: "no_hiv", label: "No HIV services", count: noHiv.length, records: noHiv },
      { key: "no_schooled", label: "No education services", count: noSchooled.length, records: noSchooled },
      { key: "no_safe", label: "No safety services", count: noSafe.length, records: noSafe },
      { key: "no_stable", label: "No stability services", count: noStable.length, records: noStable },
      { key: "incomplete", label: "Incomplete coverage", count: incomplete.length, records: incomplete },
      { key: "hiv_no_vl", label: "HIV+ missing VL", count: hivNoVl.length, records: hivNoVl },
      { key: "vl_suppressed", label: "VL suppressed", count: vlSuppressed.length, records: vlSuppressed },
      { key: "future", label: "Future-dated", count: futureDated.length, records: futureDated },
      { key: "duplicates", label: "Duplicate records", count: duplicates.length, records: duplicates },
    ];
  }, [juneWindowServices]);

  const displayedServices = useMemo(() => {
    if (!dqFilter) return filteredServices;
    const insight = insights.find(i => i.key === dqFilter);
    if (!insight) return filteredServices;
    const dqSet = new Set(insight.records);
    return filteredServices.filter(r => dqSet.has(r));
  }, [filteredServices, dqFilter, insights]);

  // --- DATA AGGREGATION ---

  const healthServiceStats = useMemo(() => {
    if (!juneWindowServices.length) {
      return [];
    }
    const counts: Record<string, number> = {};

    juneWindowServices.forEach(svc => {
      const services = parseHealthServices(svc.health_services);
      services.forEach(s => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });

    const result = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return result;
  }, [juneWindowServices]);

  const advancedStats = useMemo(() => {
    if (!households.length) return null;

    const selectedVariants = selectedDistrict === "All" ? [] : (discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict]);

    const filteredHouseholds = households.filter((h: any) => {
      const hDistrict = String(h.district || "");
      if (selectedDistrict !== "All" && !selectedVariants.includes(hDistrict)) return false;
      return true;
    });

    // Per-household domain coverage from services in the selected June cycle
    const caregiverServiceMap = new Map<string, any[]>();
    juneWindowServices.forEach(s => {
      const hhId = String(s.household_id || s.hh_id || "");

      if (!caregiverServiceMap.has(hhId)) caregiverServiceMap.set(hhId, []);
      caregiverServiceMap.get(hhId)?.push(s);
    });

    let healthDomainCount = 0;
    let schooledDomainCount = 0;
    let safeDomainCount = 0;
    let stableDomainCount = 0;
    let allFourDomainsCount = 0;

    households.forEach((h: any) => {
      const hDistrict = String(h.district || "");
      if (selectedDistrict !== "All" && !selectedVariants.includes(hDistrict)) return;

      const hhId = String(h.household_id || h.hh_id || "");
      const hhServices = caregiverServiceMap.get(hhId) || [];
      let hasHealth = false, hasSchooled = false, hasSafe = false, hasStable = false;
      hhServices.forEach(s => {
        if (isCategoryProvided(s, "health_services")) hasHealth = true;
        if (isCategoryProvided(s, "schooled_services")) hasSchooled = true;
        if (isCategoryProvided(s, "safe_services")) hasSafe = true;
        if (isCategoryProvided(s, "stable_services")) hasStable = true;
      });
      if (hasHealth) healthDomainCount++;
      if (hasSchooled) schooledDomainCount++;
      if (hasSafe) safeDomainCount++;
      if (hasStable) stableDomainCount++;
      if (hasHealth && hasSchooled && hasSafe && hasStable) allFourDomainsCount++;
    });

    const totalHouseholds = filteredHouseholds.length;

    return {
      healthDomainCount,
      healthDomainRate: totalHouseholds > 0 ? (healthDomainCount / totalHouseholds) * 100 : 0,
      schooledDomainCount,
      schooledDomainRate: totalHouseholds > 0 ? (schooledDomainCount / totalHouseholds) * 100 : 0,
      safeDomainCount,
      safeDomainRate: totalHouseholds > 0 ? (safeDomainCount / totalHouseholds) * 100 : 0,
      stableDomainCount,
      stableDomainRate: totalHouseholds > 0 ? (stableDomainCount / totalHouseholds) * 100 : 0,
      allFourDomainsCount,
      allFourDomainsRate: totalHouseholds > 0 ? (allFourDomainsCount / totalHouseholds) * 100 : 0,
      totalHouseholds,
      totalVisits: juneWindowServices.length,
    };
  }, [households, juneWindowServices, selectedDistrict, discoveredDistrictsMap]);

  const displayStats = advancedStats;
  const isRefreshing = servicesQuery.isFetching && displayStats?.totalVisits > 0;

  return (
    <DashboardLayout subtitle="Caregiver risk & impact monitor">
      {/* ── Banner ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg mb-8">
        <div className="relative bg-gradient-to-r from-green-800 via-emerald-600 to-teal-500 px-4 py-12 sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>

              <span className="inline-block text-[10px] font-bold tracking-widest text-emerald-200 bg-white/10 px-3 py-1 rounded-full mb-2 uppercase">Registry overview</span>
              <h1 className="text-3xl font-black text-white lg:text-4xl leading-tight">
                Caregiver Services
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-white/70 text-sm font-medium">
                <span className="flex items-center gap-1.5">
                  <Home className="h-4 w-4" />
                  {displayStats?.totalHouseholds?.toLocaleString()} Households
                </span>
                <span className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4" />
                  {displayStats?.totalVisits?.toLocaleString() ?? 0} Service events
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {selectedDistrict === "All" ? "All districts" : selectedDistrict}
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
                <RefreshCcw className={`h-4 w-4 mr-2 ${servicesQuery.isFetching ? "animate-spin" : ""}`} />
                Sync
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Coverage KPIs + Health Services Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
        {/* Left: Coverage KPI Cards */}
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 grid-cols-2">
            <RiskKpiCard
              label="Health"
              count={displayStats?.healthDomainCount}
              percent={displayStats?.healthDomainRate}
              thresholds={{ yellow: 60, red: 40, inverse: true }}
              icon={HeartPulse}
              description="Click to view caregivers missing health services"
              to={`/registers/caregiver-risk?type=health_domain&district=${selectedDistrict}`}
            />
            <RiskKpiCard
              label="Schooled"
              count={displayStats?.schooledDomainCount}
              percent={displayStats?.schooledDomainRate}
              thresholds={{ yellow: 60, red: 40, inverse: true }}
              icon={BookOpen}
              description="Click to view caregivers missing school services"
              to={`/registers/caregiver-risk?type=schooled_domain&district=${selectedDistrict}`}
            />
            <RiskKpiCard
              label="Safe"
              count={displayStats?.safeDomainCount}
              percent={displayStats?.safeDomainRate}
              thresholds={{ yellow: 60, red: 40, inverse: true }}
              icon={Shield}
              description="Click to view caregivers missing safety services"
              to={`/registers/caregiver-risk?type=safe_domain&district=${selectedDistrict}`}
            />
            <RiskKpiCard
              label="Stable"
              count={displayStats?.stableDomainCount}
              percent={displayStats?.stableDomainRate}
              thresholds={{ yellow: 60, red: 40, inverse: true }}
              icon={Landmark}
              description="Click to view caregivers missing stability services"
              to={`/registers/caregiver-risk?type=stable_domain&district=${selectedDistrict}`}
            />
          </div>
          <RiskKpiCard
            label="Graduation readiness (all 4 domains)"
            count={displayStats?.allFourDomainsCount}
            percent={displayStats?.allFourDomainsRate}
            thresholds={{ yellow: 15, red: 5, inverse: true }}
            icon={GraduationCap}
            description="Caregivers covered across health, schooled, safe & stable"
            to={`/registers/caregiver-risk?type=graduation_path&district=${selectedDistrict}`}
          />
        </div>

        {/* Right: Most common health services chart */}
        <GlowCard className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-emerald-600" />
                  Most common health services
                </CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400 tracking-widest mt-1">
                  Provided health services across all profiles — {selectedDistrict}
                </CardDescription>
              </div>
              <Badge variant="outline" className="h-6 px-3 border-emerald-200 bg-emerald-50 text-emerald-700 font-black text-[10px]">
                {displayStats?.totalVisits ?? 0} service events
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {servicesQuery.isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <LoadingDots />
              </div>
            ) : healthServiceStats.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-2xl">
                <Target className="h-10 w-10 opacity-20" />
                <p className="text-sm font-bold">No health services found in delivery records</p>
              </div>
            ) : (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthServiceStats} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={150}
                      tick={{ fill: "#64748b", fontSize: 10, fontWeight: 800 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {healthServiceStats.map((_, index) => (
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

      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-500 mb-3 tracking-wide">Data quality & insights</h3>
        <p className="text-xs text-slate-400 mb-4">Click a card to filter records</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
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

      {/* Audit Table */}
      <GlowCard className="overflow-hidden border-slate-200 shadow-sm mb-20">
        <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/30 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Caregiver Services</CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400 tracking-widest mt-1">Operational data check — {selectedDistrict}</CardDescription>
            </div>
            <div className="relative w-full md:w-[400px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input
                placeholder="Search by Beneficiary ID, Caseworker or District..."
                className="pl-11 bg-white border-slate-200 h-11 text-sm font-bold rounded-xl focus-visible:ring-emerald-500/20 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
              <TableRow>
                <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 pl-8 h-14">Beneficiary id</TableHead>
                <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 h-14">District</TableHead>
                <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 h-14">Date of service</TableHead>
                <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 h-14">Service provided</TableHead>
                <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 h-14">HIV status</TableHead>
                <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 h-14">Last VL date</TableHead>
                <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 h-14">VL result</TableHead>
                <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 text-right pr-8 h-14">Caseworker</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicesQuery.isLoading || servicesQuery.isFetching ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="flex items-center justify-center py-12">
                      <LoadingDots />
                    </div>
                  </TableCell>
                </TableRow>
              ) : displayedServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="p-6 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200">
                        <FileText className="h-10 w-10 text-slate-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-black text-slate-600">No operational records found</p>
                        <p className="text-xs text-slate-400 font-medium">Clear search or try a different district filter.</p>
                      </div>
                      <Button variant="outline" className="font-black rounded-lg mt-2 px-6 h-10" onClick={() => servicesQuery.refetch()}>
                        Force resync
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayedServices.slice(0, 50).map((service: any, index: number) => {
                  const hhId = String(service.household_id || service.hh_id || "");
                  const caseworker = service.caseworker_name ||
                    service.caseworkerName ||
                    service.cwac_member_name ||
                    service.caseworker ||
                    householdCwMap[hhId] ||
                    "N/A";

                  // Flatten all provided services
                  const providedServices: string[] = [];
                  SERVICE_CATEGORIES.forEach(cat => {
                    const parsed = parseHealthServices(service[cat]); // Use existing parser to handle strings/arrays
                    parsed.forEach(s => {
                      if (s && !providedServices.includes(s)) providedServices.push(s);
                    });
                  });

                  return (
                    <TableRow key={`${index}-${hhId}`} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell
                        className="font-black text-slate-900 cursor-pointer pl-8 py-5"
                        onClick={() => navigate(`/profile/caregiver-service-details`, { state: { record: service } })}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/40 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-100 transition-all">
                            {hhId || "N/A"}
                          </span>
                          <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600" />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-600 tracking-tighter">
                        {service.district || "N/A"}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-500">
                        {service.service_date || service.date || "N/A"}
                      </TableCell>
                      <TableCell className="max-w-[250px] lg:max-w-[350px]">
                        <div className="flex flex-wrap gap-1 overflow-hidden">
                          {providedServices.length > 0 ? (
                            providedServices.slice(0, 3).map((s, i) => (
                              <Badge key={i} variant="outline" className="text-[8px] sm:text-[9px] font-bold border-slate-200 bg-white h-5 sm:h-6 px-1.5 sm:px-2.5 rounded-md truncate max-w-[120px] sm:max-w-[160px]" title={s}>
                                {s}
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
                      <TableCell className="text-xs font-bold text-slate-600">
                        {service.is_hiv_positive === "1" || service.is_hiv_positive === true
                          ? <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[9px] font-black">Positive</Badge>
                          : service.is_hiv_positive === "0" || service.is_hiv_positive === false
                            ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px] font-black">Negative</Badge>
                            : <span className="text-slate-400">N/A</span>}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-500">
                        {service.date_last_vl || "N/A"}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-500">
                        {service.vl_last_result || "N/A"}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-slate-900 text-[11px] truncate max-w-[150px]">
                            {caseworker}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold tracking-widest">Case Worker</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </GlowCard>
    </DashboardLayout >
  );
};

export default CaregiverServices;
