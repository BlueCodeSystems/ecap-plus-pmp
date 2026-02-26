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
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useQuery } from "@tanstack/react-query";
import {
  getCaregiverServicesByDistrict,
  getHouseholdsByDistrict,
  getCaregiverCasePlansByDistrict,
  getCaregiverReferralsByMonth
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
import { format, subMonths, isAfter, parseISO } from "date-fns";
import { cn, toTitleCase } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SERVICE_CATEGORIES = [
  "health_services",
  "hiv_services",
  "schooled_services",
  "safe_services",
  "stable_services",
] as const;

const NOT_APPLICABLE = ["not applicable", "n/a", "na", "none", "no", "false", "0", "[]", "{}"];


const isNotApplicable = (val: unknown): boolean => {
  if (val === null || val === undefined || val === "") return true;
  return NOT_APPLICABLE.includes(String(val).toLowerCase().trim());
};

const isCategoryProvided = (record: Record<string, unknown>, key: string): boolean => {
  const val = record[key];
  if (val === null || val === undefined || val === "" || isNotApplicable(val)) return false;
  const sVal = String(val).trim();
  if (sVal === "[]" || sVal === "{}" || sVal.toLowerCase() === "none") return false;
  return true;
};


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

  // Initial state logic for district security
  const initialDistrict = (user?.description === "District User" && user?.location)
    ? user.location
    : "All";

  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [searchQuery, setSearchQuery] = useState("");

  // SECURITY: Enforce district lock for District Users
  useEffect(() => {
    if (user?.description === "District User" && user?.location && selectedDistrict !== user.location) {
      setSelectedDistrict(user.location);
    }
  }, [user, selectedDistrict]);

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
  }, [hhListQuery.data]);

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

  const casePlansQuery = useQuery({
    queryKey: ["caseplans-all", "All"], // Fetch all for local filtering
    queryFn: () => getCaregiverCasePlansByDistrict(""),
    staleTime: 1000 * 60 * 30,
  });

  const referralsQuery = useQuery({
    queryKey: ["referrals-all", "All"], // Fetch all for local filtering
    queryFn: () => getCaregiverReferralsByMonth(""),
    staleTime: 1000 * 60 * 30,
  });

  const households = useMemo(() => householdsQuery.data ?? [], [householdsQuery.data]);
  const casePlans = useMemo(() => casePlansQuery.data ?? [], [casePlansQuery.data]);
  const referrals = useMemo(() => referralsQuery.data ?? [], [referralsQuery.data]);
  const allServices = useMemo(() => (servicesQuery.data ?? []) as any[], [servicesQuery.data]);

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

    const base = allServices.filter((service: any) => {
      const sDistrict = String(service.district || "");
      if (selectedDistrict !== "All" && !selectedVariants.includes(sDistrict)) return false;

      const hhId = String(service.household_id || service.hh_id || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      const cw = String(service.caseworker_name || householdCwMap[hhId] || "").toLowerCase();

      return hhId.includes(query) || sDistrict.toLowerCase().includes(query) || cw.includes(query);
    });

    // Sort by latest service date
    return [...base].sort((a, b) => {
      const valA = (a.service_date || a.date || 0) as any;
      const valB = (b.service_date || b.date || 0) as any;
      const dateA = new Date(valA).getTime();
      const dateB = new Date(valB).getTime();
      return dateB - dateA;
    });
  }, [allServices, searchQuery, selectedDistrict, householdCwMap]);


  // --- DATA AGGREGATION ---

  const healthServiceStats = useMemo(() => {
    if (!allServices.length) {
      console.log("Caregiver Dashboard: allServices is empty");
      return [];
    }
    const counts: Record<string, number> = {};

    allServices.forEach(svc => {
      const services = parseHealthServices(svc.health_services);
      services.forEach(s => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });

    const result = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    console.log("Caregiver Dashboard Stats Debug:", {
      totalRecords: allServices.length,
      sampleRecord: allServices[0],
      aggregatedStats: result
    });

    return result;
  }, [allServices]);

  const advancedStats = useMemo(() => {
    if (!households.length) return null;

    const SIX_MONTHS_AGO = subMonths(new Date(), 6);
    const NINETY_DAYS_AGO = subMonths(new Date(), 3);
    const selectedVariants = selectedDistrict === "All" ? [] : (discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict]);

    // 1. HIV+ without VL in 6 months
    const filteredHouseholds = households.filter((h: any) => {
      const hDistrict = String(h.district || "");
      if (selectedDistrict !== "All" && !selectedVariants.includes(hDistrict)) return false;
      return true;
    });

    const hivPositiveHhs = filteredHouseholds.filter((h: any) =>
      String(h.is_hiv_positive || h.is_caregiver_hiv_positive || "").toLowerCase().includes("yes") ||
      String(h.is_hiv_positive || h.is_caregiver_hiv_positive) === "1"
    );

    const hivHhIds = new Set(hivPositiveHhs.map((h: any) => String(h.household_id || h.hh_id)));

    const hivWithoutVL = hivPositiveHhs.filter((h: any) => {
      const vlDateStr = h.date_last_vl || h.last_vl_date;
      if (!vlDateStr) return true;
      try {
        const vlDate = new Date(vlDateStr);
        return vlDate < SIX_MONTHS_AGO;
      } catch {
        return true;
      }
    });

    const hivWithoutVLRate = hivPositiveHhs.length > 0
      ? (hivWithoutVL.length / hivPositiveHhs.length) * 100
      : 0;

    // 2. Unsuppressed Viral Load Rate
    const unsuppressedHhs = hivPositiveHhs.filter((h: any) => {
      const vlResult = parseInt(String(h.vl_last_result || h.last_vl_result || "0"));
      return vlResult >= 1000;
    });

    const unsuppressedRate = hivPositiveHhs.length > 0
      ? (unsuppressedHhs.length / hivPositiveHhs.length) * 100
      : 0;

    // 3. Households Not Served in 90 Days
    const notServed90d = households.filter((h: any) => {
      const lastServiceStr = h.last_service_date || h.service_date;
      if (!lastServiceStr) return true;
      try {
        const lastService = new Date(lastServiceStr);
        return lastService < NINETY_DAYS_AGO;
      } catch {
        return true;
      }
    });
    const notServedRate = (notServed90d.length / households.length) * 100;

    // 4. Per-Household domain coverage from services
    const caregiverServiceMap = new Map<string, any[]>();
    allServices.forEach(s => {
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

    // 5. Households Without Active Case Plan
    const hhWithCasePlanIds = new Set(casePlans.map((cp: any) => String(cp.household_id || cp.hh_id)));
    const hhsWithoutCasePlan = filteredHouseholds.filter((h: any) => !hhWithCasePlanIds.has(String(h.household_id || h.hh_id)));

    // 6. Referral Completion Rate
    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter((r: any) =>
      String(r.status || "").toLowerCase() === "completed" ||
      String(r.referral_status || "").toLowerCase() === "completed"
    ).length;
    const referralCompletionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;

    return {
      // Domain coverage
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
      // Legacy stats
      hivWithoutVL: hivWithoutVL.length,
      hivWithoutVLRate,
      unsuppressedRate,
      unsuppressedCount: unsuppressedHhs.length,
      notServed90d: notServed90d.length,
      notServedRate,
      withoutCasePlan: hhsWithoutCasePlan.length,
      referralCompletionRate,
      totalHouseholds,
      totalVisits: allServices.length,
      posCount: hivPositiveHhs.length,
    };
  }, [households, casePlans, referrals, allServices]);

  const displayStats = advancedStats;
  const isRefreshing = servicesQuery.isFetching && displayStats?.totalVisits > 0;

  return (
    <DashboardLayout subtitle="Caregiver risk & impact monitor">
      {/* ── Banner ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg mb-8">
        <div className="relative bg-gradient-to-r from-green-800 via-emerald-600 to-teal-500 p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>

              <h1 className="text-3xl font-black text-white lg:text-4xl leading-tight">
                Caregiver Services
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-white/70 text-sm font-medium">
                <span className="flex items-center gap-1.5">
                  <Home className="h-4 w-4" />
                  {displayStats?.totalHouseholds?.toLocaleString()} Households
                </span>

                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {selectedDistrict === "All" ? "All districts" : selectedDistrict}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={selectedDistrict}
                onValueChange={setSelectedDistrict}
                disabled={user?.description === "District User"}
              >
                <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white font-bold h-10 backdrop-blur-sm">
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All districts</SelectItem>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => servicesQuery.refetch()}
                className="bg-white text-emerald-700 hover:bg-white/90 shadow-xl h-10 font-bold px-5"
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${servicesQuery.isFetching ? "animate-spin" : ""}`} />
                Sync
              </Button>
            </div>
          </div>
        </div>


      </div>
      {/* ── Critical Risk KPIs ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
        <RiskKpiCard
          label="Health coverage"
          count={displayStats?.healthDomainCount}
          percent={displayStats?.healthDomainRate}
          thresholds={{ yellow: 60, red: 40, inverse: true }}
          icon={HeartPulse}
          description="Click to view caregivers missing health services"
          to={`/registers/caregiver-risk?type=health_domain&district=${selectedDistrict}`}
        />
        <RiskKpiCard
          label="Schooled coverage"
          count={displayStats?.schooledDomainCount}
          percent={displayStats?.schooledDomainRate}
          thresholds={{ yellow: 60, red: 40, inverse: true }}
          icon={BookOpen}
          description="Click to view caregivers missing school services"
          to={`/registers/caregiver-risk?type=schooled_domain&district=${selectedDistrict}`}
        />
        <RiskKpiCard
          label="Safe coverage"
          count={displayStats?.safeDomainCount}
          percent={displayStats?.safeDomainRate}
          thresholds={{ yellow: 60, red: 40, inverse: true }}
          icon={Shield}
          description="Click to view caregivers missing safety services"
          to={`/registers/caregiver-risk?type=safe_domain&district=${selectedDistrict}`}
        />
        <RiskKpiCard
          label="Stable coverage"
          count={displayStats?.stableDomainCount}
          percent={displayStats?.stableDomainRate}
          thresholds={{ yellow: 60, red: 40, inverse: true }}
          icon={Landmark}
          description="Click to view caregivers missing stability services"
          to={`/registers/caregiver-risk?type=stable_domain&district=${selectedDistrict}`}
        />
      </div>

      <div className="mt-4 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
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

      {/* Section 4: Repositioned Service Stats */}
      <div className="grid gap-6 mb-8">
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
                {allServices.length} service events
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {servicesQuery.isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <RefreshCcw className="h-8 w-8 text-emerald-500 animate-spin opacity-20" />
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
                <TableHead className="font-black text-[10px] tracking-[0.2em] text-slate-400 text-right pr-8 h-14">Caseworker</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicesQuery.isLoading || servicesQuery.isFetching ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="p-0">
                      <TableSkeleton rows={1} columns={5} />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center">
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
                filteredServices.slice(0, 50).map((service: any, index: number) => {
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
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 max-w-[400px]">
                          {providedServices.length > 0 ? (
                            providedServices.slice(0, 3).map((s, i) => (
                              <Badge key={i} variant="outline" className="text-[9px] font-black border-slate-200 bg-white h-6 px-2.5 rounded-md tracking-tighter">
                                {s}
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
    </DashboardLayout>
  );
};

export default CaregiverServices;
