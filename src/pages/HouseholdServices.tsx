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
import { format, subMonths, isAfter, parseISO, subDays } from "date-fns";
import { cn, toTitleCase } from "@/lib/utils";
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
import { SubPopulationFilter } from "@/components/dashboard/SubPopulationFilter";
import {
  ResponsiveContainer,
} from "recharts";

const RiskKpiCard = ({ label, count, percent, thresholds, icon: Icon, description, isAbsoluteOnly = false, to }: any) => {
  const getSeverityColor = (val: number, rules: any) => {
    if (!rules) return "text-slate-900";
    if (rules.inverse) {
      if (val <= rules.red) return "text-rose-600";
      if (val <= rules.yellow) return "text-amber-500";
      return "text-emerald-600";
    }
    if (val >= rules.red) return "text-rose-600";
    if (val >= rules.yellow) return "text-amber-500";
    return "text-emerald-600";
  };

  const getSeverityBg = (val: number, rules: any) => {
    if (!rules) return "bg-slate-50";
    if (rules.inverse) {
      if (val <= rules.red) return "bg-rose-50";
      if (val <= rules.yellow) return "bg-amber-50";
      return "bg-emerald-50";
    }
    if (val >= rules.red) return "bg-rose-50";
    if (val >= rules.yellow) return "bg-amber-50";
    return "bg-emerald-50";
  };

  const isPercentValid = typeof percent === "number" && !isNaN(percent);
  const value = isPercentValid ? `${percent.toFixed(1)}%` : (count !== null && count !== undefined ? count.toLocaleString() : "0");
  const color = isPercentValid ? getSeverityColor(percent, thresholds) : "text-slate-900";
  const bg = isPercentValid ? getSeverityBg(percent, thresholds) : "bg-slate-50";

  const content = (
    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg transition-all duration-300 group-hover:scale-105", bg, color)}>
          <Icon className="h-4 w-4" />
        </div>
        {isPercentValid && (
          <Badge variant="outline" className={cn("text-[9px] font-bold border-0 uppercase tracking-wider px-2 py-0.5", bg, color)}>
            {thresholds.inverse
              ? (percent <= thresholds.red ? "Critical" : percent <= thresholds.yellow ? "Warning" : "Stable")
              : (percent >= (thresholds?.red || 0) ? "Critical" : percent >= (thresholds?.yellow || 0) ? "Warning" : "Stable")}
          </Badge>
        )}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <p className={cn("text-2xl font-black tracking-tight", color)}>{value}</p>
        {to && <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />}
      </div>
      {!isAbsoluteOnly && count !== null && count !== undefined && (
        <p className="text-[10px] text-slate-400 font-medium mt-1">
          Raw Count: <span className="text-slate-600 font-bold">{count.toLocaleString()}</span>
        </p>
      )}
      <p className="text-[10px] text-slate-400 font-medium italic mt-2 line-clamp-1">{description}</p>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block group">
        <GlowCard className="p-0 border-0 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
          {content}
        </GlowCard>
      </Link>
    );
  }

  return (
    <GlowCard className="p-0 border-0 overflow-hidden group">
      {content}
    </GlowCard>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SERVICE_CATEGORIES = ["health_services", "schooled_services", "safe_services", "stable_services", "hh_level_services"] as const;
const NOT_APPLICABLE = ["not applicable", "n/a", "na", "none", "no", "false", "0"];

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

const isNotApplicable = (val: unknown): boolean => {
  if (val === null || val === undefined || val === "") return true;
  return NOT_APPLICABLE.includes(String(val).toLowerCase().trim());
};

const isCategoryProvided = (record: Record<string, unknown>, key: string): boolean => {
  const val = record[key];
  return val !== null && val !== undefined && val !== "" && !isNotApplicable(val);
};

const DAY_MS = 1000 * 60 * 60 * 24;
const NINETY_DAYS_MS = 90 * DAY_MS;

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#f87171", "#a855f7", "#ec4899"];

const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") return String(value);
  }
  return "N/A";
};

const subPopulationFilterLabels: Record<string, string> = {
  calhiv: 'C/ALHIV',
  hei: 'HEI',
  cwlhiv: 'C/WLHIV',
  agyw: 'AGYW',
  csv: 'C/SV',
  cfsw: 'CFSW',
  abym: 'ABYM',
  caahh: 'CAAHH',
  caichh: 'CAICHH',
  caich: 'CAICH',
  calwd: 'CALWD',
  caifhh: 'CAIFHH',
  muc: 'MUC',
  pbfw: 'PBFW'
};

const filterKeyToDataKey: Record<string, string> = {
  caahh: 'child_adolescent_in_aged_headed_household',
  caichh: 'child_adolescent_in_chronically_ill_headed_household',
  caich: 'child_adolescent_in_child_headed_household',
  calwd: 'child_adolescent_living_with_disability',
  caifhh: 'child_adolescent_in_female_headed_household',
  muc: 'under_5_malnourished',
  pbfw: 'pbfw'
};

// ─── Component ────────────────────────────────────────────────────────────────

const HouseholdServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Initial state logic for district security
  const initialDistrict = (user?.description === "District User" && user?.location)
    ? user.location
    : "All";

  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [searchQuery, setSearchQuery] = useState("");
  const [subPopulationFilters, setSubPopulationFilters] = useState<Record<string, string>>(
    Object.keys(subPopulationFilterLabels).reduce((acc, key) => ({ ...acc, [key]: "all" }), {})
  );

  const handleFilterChange = (key: string, value: string) => {
    setSubPopulationFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setSubPopulationFilters(
      Object.keys(subPopulationFilterLabels).reduce((acc, key) => ({ ...acc, [key]: "all" }), {})
    );
    setSearchQuery("");
  };

  // SECURITY: Enforce district lock for District Users
  useEffect(() => {
    if (user?.description === "District User" && user?.location && selectedDistrict !== user.location) {
      setSelectedDistrict(user.location);
    }
  }, [user, selectedDistrict]);

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
  }, [householdsListQuery.data]);

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
    const services = allServices;
    const now = new Date();
    const NINETY_DAYS_AGO = subDays(now, 90);

    const households = (householdsListQuery.data ?? []) as any[];
    const hhDataMap = new Map();
    households.forEach(h => {
      hhDataMap.set(String(h.household_id || h.hhid || h.id).trim(), h);
    });

    // 1. Map services per household
    const hhMap = new Map<string, any[]>();
    const selectedVariants = selectedDistrict === "All" ? [] : (discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict]);

    services.forEach(s => {
      const hhId = String(s.household_id || s.hhid || "unknown").trim();
      const sDistrict = String(s.district || "");

      // Filter by district (handling variants)
      if (selectedDistrict !== "All" && !selectedVariants.includes(sDistrict)) return;

      const hhData = hhDataMap.get(hhId);
      const matchesSubPop = Object.entries(subPopulationFilters).every(([key, value]) => {
        if (value === "all") return true;
        if (!hhData) return false;

        let dataKey = key;
        if (key in filterKeyToDataKey) dataKey = filterKeyToDataKey[key];

        const recordValue = hhData[dataKey];
        return value === "yes"
          ? recordValue === "1" || recordValue === "true" || recordValue === 1 || recordValue === true
          : recordValue === "0" || recordValue === "false" || recordValue === 0 || recordValue === false;
      });

      if (matchesSubPop) {
        if (!hhMap.has(hhId)) hhMap.set(hhId, []);
        hhMap.get(hhId)?.push(s);
      }
    });

    const totalHouseholds = hhMap.size;

    // 2. Compute per-household domain coverage
    let healthCount = 0;
    let schooledCount = 0;
    let safeCount = 0;
    let stableCount = 0;
    let allDomainsCount = 0; // graduation-ready: has all 4
    let activeHHCount = 0;

    hhMap.forEach((hhServices) => {
      let hasHealth = false;
      let hasSchooled = false;
      let hasSafe = false;
      let hasStable = false;
      let isActive = false;

      hhServices.forEach(s => {
        if (isCategoryProvided(s, "health_services")) hasHealth = true;
        if (isCategoryProvided(s, "schooled_services")) hasSchooled = true;
        if (isCategoryProvided(s, "safe_services")) hasSafe = true;
        if (isCategoryProvided(s, "stable_services")) hasStable = true;

        const sDate = s.service_date ? parseISO(String(s.service_date)) : null;
        if (sDate && isAfter(sDate, NINETY_DAYS_AGO)) isActive = true;
      });

      if (hasHealth) healthCount++;
      if (hasSchooled) schooledCount++;
      if (hasSafe) safeCount++;
      if (hasStable) stableCount++;
      if (hasHealth && hasSchooled && hasSafe && hasStable) allDomainsCount++;
      if (isActive) activeHHCount++;
    });

    const nationwideHhs = (householdsListQuery.data ?? []) as any[];
    const effectiveTotalHouseholds = selectedDistrict === "All" && Object.values(subPopulationFilters).every(v => v === "all") ? nationwideHhs.length : totalHouseholds;

    return {
      totalHouseholds: effectiveTotalHouseholds,
      // Domain coverage
      healthCount,
      healthRate: totalHouseholds > 0 ? (healthCount / totalHouseholds) * 100 : 0,
      schooledCount,
      schooledRate: totalHouseholds > 0 ? (schooledCount / totalHouseholds) * 100 : 0,
      safeCount,
      safeRate: totalHouseholds > 0 ? (safeCount / totalHouseholds) * 100 : 0,
      stableCount,
      stableRate: totalHouseholds > 0 ? (stableCount / totalHouseholds) * 100 : 0,
      // Derived
      allDomainsCount,
      allDomainsRate: totalHouseholds > 0 ? (allDomainsCount / totalHouseholds) * 100 : 0,
      activeHHCount,
      activeRate: totalHouseholds > 0 ? (activeHHCount / totalHouseholds) * 100 : 0,
      totalVisits: Array.from(hhMap.values()).flat().length,
    };
  }, [allServices, selectedDistrict, householdsListQuery.data, subPopulationFilters]);

  // ── Filtered audit log
  const filteredAuditLog = useMemo(() => {
    const households = (householdsListQuery.data ?? []) as any[];
    const hhDataMap = new Map();
    households.forEach(h => {
      hhDataMap.set(String(h.household_id || h.hhid || h.id).trim(), h);
    });

    const selectedVariants = selectedDistrict === "All" ? [] : (discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict]);

    const base = allServices.filter((s) => {
      const sDistrict = String(s.district || "");
      if (selectedDistrict !== "All" && !selectedVariants.includes(sDistrict)) return false;
      const hhId = String(s.household_id ?? "").trim();
      const hhData = hhDataMap.get(hhId);

      const matchesSubPop = Object.entries(subPopulationFilters).every(([key, value]) => {
        if (value === "all") return true;
        if (!hhData) return false;
        let dataKey = key;
        if (key in filterKeyToDataKey) dataKey = filterKeyToDataKey[key];
        const recordValue = hhData[dataKey];
        return value === "yes"
          ? recordValue === "1" || recordValue === "true" || recordValue === 1 || recordValue === true
          : recordValue === "0" || recordValue === "false" || recordValue === 0 || recordValue === false;
      });

      if (!matchesSubPop) return false;

      const query = searchQuery.toLowerCase();
      const district = String(s.district || "").toLowerCase();
      const caseworker = String(s.caseworker_name || s.caseworker || householdCwMap[hhId] || "").toLowerCase();

      return hhId.toLowerCase().includes(query) ||
        district.includes(query) ||
        caseworker.includes(query);
    });

    // Sort by latest service date
    return [...base].sort((a, b) => {
      const valA = (a.service_date || a.visit_date || a.date || a.created_at || 0) as any;
      const valB = (b.service_date || b.visit_date || b.date || b.created_at || 0) as any;
      const dateA = new Date(valA).getTime();
      const dateB = new Date(valB).getTime();
      return dateB - dateA;
    });
  }, [allServices, selectedDistrict, searchQuery, subPopulationFilters, householdsListQuery.data, householdCwMap]);

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
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
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
        <div className="relative bg-gradient-to-r from-green-800 via-emerald-600 to-teal-500 p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="text-xs border-0 bg-white/20 text-white font-bold">Household Services</Badge>
                <Badge className="text-xs border-0 bg-white/20 text-emerald-50 font-bold uppercase tracking-wider">Stability Tracker</Badge>
              </div>
              <h1 className="text-3xl font-black text-white lg:text-4xl leading-tight">
                Household Services
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-white/90 text-xs font-bold uppercase tracking-wide">
                <span className="flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5 text-emerald-200" />
                  {(dashboardStats?.totalHouseholds ?? 0).toLocaleString()} Households
                </span>
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-emerald-200" />
                  {(dashboardStats?.totalVisits ?? 0).toLocaleString()} Interactions
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-200" />
                  {selectedDistrict === "All" ? "National Overview" : selectedDistrict}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="bg-white/10 p-1 rounded-xl backdrop-blur-md border border-white/20">
                <Select
                  value={selectedDistrict}
                  onValueChange={setSelectedDistrict}
                  disabled={user?.description === "District User"}
                >
                  <SelectTrigger className="w-[180px] bg-transparent border-0 text-white font-black h-10 focus:ring-0">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent className="font-bold border-emerald-100">
                    <SelectItem value="All">All Districts</SelectItem>
                    {districts.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => servicesQuery.refetch()}
                className="bg-white text-emerald-900 hover:bg-emerald-50 shadow-2xl h-12 font-black px-6 rounded-xl transition-all duration-300 active:scale-95"
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${servicesQuery.isFetching ? "animate-spin" : ""}`} />
                SYNC DATA
              </Button>
            </div>
          </div>
        </div>

        {/* Domain Coverage Strip */}
        <div className="bg-slate-50/50 border-x border-b border-slate-200 rounded-b-2xl px-8 py-3.5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Health: <span className="text-slate-900 ml-1 font-bold">{(dashboardStats?.healthRate ?? 0).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Schooled: <span className="text-slate-900 ml-1 font-bold">{(dashboardStats?.schooledRate ?? 0).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              Safe: <span className="text-slate-900 ml-1 font-bold">{(dashboardStats?.safeRate ?? 0).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Stable: <span className="text-slate-900 ml-1 font-bold">{(dashboardStats?.stableRate ?? 0).toFixed(1)}%</span>
            </div>
            {(dashboardStats?.allDomainsRate || 0) < 10 && (
              <div className="ml-auto flex items-center gap-2 text-rose-600 font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                <AlertTriangle className="h-3 w-3" />
                <span>Low Graduation Readiness</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <SubPopulationFilter
          filters={subPopulationFilters}
          labels={subPopulationFilterLabels}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      </div>

      {/* ── Domain Coverage KPIs ── */}
      <div className="space-y-2 mb-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">OVC Service Domain Coverage</p>
        <p className="text-xs text-slate-500">Percentage of households receiving services in each domain. Low rates indicate intervention gaps.</p>
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Health Domain */}
        <RiskKpiCard
          label="Health Coverage"
          percent={dashboardStats?.healthRate}
          count={dashboardStats?.healthCount}
          thresholds={{ yellow: 60, red: 40, inverse: true }}
          icon={HeartPulse}
          description="Click to view households missing health services"
          to={`/registers/household-risk?type=health_domain&district=${selectedDistrict}`}
        />
        {/* Schooled Domain */}
        <RiskKpiCard
          label="Schooled Coverage"
          percent={dashboardStats?.schooledRate}
          count={dashboardStats?.schooledCount}
          thresholds={{ yellow: 60, red: 40, inverse: true }}
          icon={BookOpen}
          description="Click to view households missing school services"
          to={`/registers/household-risk?type=schooled_domain&district=${selectedDistrict}`}
        />
        {/* Safe Domain */}
        <RiskKpiCard
          label="Safe Coverage"
          percent={dashboardStats?.safeRate}
          count={dashboardStats?.safeCount}
          thresholds={{ yellow: 60, red: 40, inverse: true }}
          icon={Shield}
          description="Click to view households missing safety services"
          to={`/registers/household-risk?type=safe_domain&district=${selectedDistrict}`}
        />
        {/* Stable Domain */}
        <RiskKpiCard
          label="Stable Coverage"
          percent={dashboardStats?.stableRate}
          count={dashboardStats?.stableCount}
          thresholds={{ yellow: 60, red: 40, inverse: true }}
          icon={Landmark}
          description="Click to view households missing stability services"
          to={`/registers/household-risk?type=stable_domain&district=${selectedDistrict}`}
        />
      </div>

      {/* ── Graduation Readiness Callout ── */}
      <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
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

      {/* ── Stability Insights ── */}
      <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        {/* Stability Warning Card - NOW FULL WIDTH */}
        <GlowCard className="border-slate-200 bg-white shadow-sm w-full overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </div>
              <div>
                <CardTitle className="text-base font-black text-slate-900">Stability Blockers</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase text-rose-500/80 tracking-wider">Critical intervention gaps detected</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {([
                { label: "Health Gap", rate: dashboardStats?.healthRate ?? 0, color: "bg-rose-50 border-rose-100", textColor: "text-rose-600", desc: "No health services recorded" },
                { label: "Schooled Gap", rate: dashboardStats?.schooledRate ?? 0, color: "bg-indigo-50 border-indigo-100", textColor: "text-indigo-600", desc: "No schooled services recorded" },
                { label: "Safe Gap", rate: dashboardStats?.safeRate ?? 0, color: "bg-orange-50 border-orange-100", textColor: "text-orange-600", desc: "No safe services recorded" },
                { label: "Stable Gap", rate: dashboardStats?.stableRate ?? 0, color: "bg-emerald-50 border-emerald-100", textColor: "text-emerald-600", desc: "No stable services recorded" },
              ]).map(({ label, rate, color, textColor, desc }) => (
                <div key={label} className={`flex items-center justify-between p-5 rounded-xl border transition-all hover:brightness-95 ${color}`}>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">{label}</p>
                    <p className={`text-2xl font-black tracking-tight ${textColor}`}>{(100 - rate).toFixed(1)}%</p>
                    <p className="text-[10px] text-slate-400 mt-1">{desc}</p>
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

      {/* ── Household Audit Trail ── */}
      <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
        <GlowCard className="overflow-hidden border-0 shadow-2xl">
          <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  Household Service Audit
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 h-5 px-3 text-[9px] font-black uppercase italic">Mastery View</Badge>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Showing {filteredAuditLog.length} most recent interventions
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
                  <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 pl-8 h-14">Beneficiary ID</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 h-14">District</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 h-14">Date of Service</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 h-14">Service Provided</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right pr-8 h-14">Caseworker</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20">
                      <LoadingDots className="h-3 w-3" />
                    </TableCell>
                  </TableRow>
                ) : filteredAuditLog.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <Search className="h-10 w-10 text-slate-400" />
                        <p className="text-sm font-black uppercase tracking-widest text-slate-500">No records matched your search</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAuditLog.slice(0, 50).map((s, idx) => {
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
                          <span className="font-mono text-[11px] bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200/40 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-100 transition-all uppercase tracking-tight">
                            {hhId}
                          </span>
                          <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600" />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-600 uppercase tracking-tighter">
                        {String(s.district || "N/A")}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-500">
                        {dateStr}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 max-w-[400px]">
                          {providedServices.length > 0 ? (
                            providedServices.slice(0, 3).map((svc, i) => (
                              <Badge key={i} variant="outline" className="text-[9px] font-black border-slate-200 bg-white h-6 px-2.5 rounded-md uppercase tracking-tighter">
                                {svc}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold italic">No specific service logged</span>
                          )}
                          {providedServices.length > 3 && (
                            <Badge variant="outline" className="text-[9px] font-black border-emerald-100 bg-emerald-50 text-emerald-700 h-6 px-2.5 rounded-md">
                              +{providedServices.length - 3} More
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8 py-5">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-slate-900 text-[11px] uppercase truncate max-w-[150px]">
                            {String(caseworker)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Field Officer</span>
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
              className="text-xs font-black text-slate-400 hover:text-emerald-600 tracking-widest uppercase"
              onClick={() => navigate("/household-register")}
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
