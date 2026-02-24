import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  FileText,
  MapPin,
  ChevronRight,
  Home,
  Activity,
  Target,
  Zap,
  ClipboardList,
  Flag,
  AlertCircle,
  RefreshCcw,
  ShieldAlert,
  AlertTriangle,
  Stethoscope,
  HeartPulse,
  BookOpen,
  Shield,
  Landmark,
  GraduationCap,
} from "lucide-react";
import { format, subMonths, isAfter, parseISO, subDays } from "date-fns";
import { cn, toTitleCase } from "@/lib/utils";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useQuery } from "@tanstack/react-query";
import {
  getVcaServicesByDistrict,
  getChildrenByDistrict,
  getVcaCasePlansByDistrict,
  getVcaReferralsByMonth
} from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";
import { SubPopulationFilter } from "@/components/dashboard/SubPopulationFilter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

// Full list of 14 filters from legacy TreeTable.tsx
const subPopulationFilterLabels: Record<string, string> = {
  calhiv: 'C/ALHIV',
  hei: 'HEI',
  cwlhiv: 'C/WLHIV',
  agyw: 'AGYW',
  csv: 'C/SV',
  cfsw: 'CFSW',
  abym: 'ABYM',
  caahh: 'child_adolescent_in_aged_headed_household',
  caichh: 'child_adolescent_in_chronically_ill_headed_household',
  caich: 'child_adolescent_in_child_headed_household',
  calwd: 'child_adolescent_living_with_disability',
  caifhh: 'child_adolescent_in_female_headed_household',
  muc: 'under_5_malnourished',
  pbfw: 'pbfw'
};

// Mapping for filters where the data key differs from the filter key
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

const SERVICE_CATEGORIES = [
  "health_services",
  "hiv_services",
  "schooled_services",
  "safe_services",
  "stable_services",
] as const;

const filterKeyToDataKey: Record<string, string> = {
  caahh: 'child_adolescent_in_aged_headed_household',
  caichh: 'child_adolescent_in_chronically_ill_headed_household',
  caich: 'child_adolescent_in_child_headed_household',
  calwd: 'child_adolescent_living_with_disability',
  caifhh: 'child_adolescent_in_female_headed_household',
  muc: 'under_5_malnourished',
  pbfw: 'pbfw'
};

const RiskKpiCard = ({ label, count, percent, thresholds, icon: Icon, description, isAbsoluteOnly = false, to }: any) => {
  const getSeverityColor = (val: number, rules: any) => {
    if (!rules) return "text-slate-600";
    if (rules.inverse) {
      if (val <= rules.red) return "text-rose-600";
      if (val <= rules.yellow) return "text-amber-600";
      return "text-emerald-600";
    }
    if (val >= rules.red) return "text-rose-600";
    if (val >= rules.yellow) return "text-amber-600";
    return "text-emerald-600";
  };

  const getSeverityBg = (val: number, rules: any) => {
    if (!rules) return "bg-slate-100";
    if (rules.inverse) {
      if (val <= rules.red) return "bg-rose-500/10";
      if (val <= rules.yellow) return "bg-amber-500/10";
      return "bg-emerald-500/10";
    }
    if (val >= rules.red) return "bg-rose-500/10";
    if (val >= rules.yellow) return "bg-amber-500/10";
    return "bg-emerald-500/10";
  };

  const isPercentValid = typeof percent === "number" && !isNaN(percent);
  const value = isPercentValid ? `${percent.toFixed(1)}%` : (count !== null && count !== undefined ? count.toLocaleString() : "0");
  const color = isPercentValid ? getSeverityColor(percent, thresholds) : "text-slate-900";
  const bg = isPercentValid ? getSeverityBg(percent, thresholds) : "bg-slate-100/50";

  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        <div className={cn("p-2 rounded-lg transition-transform group-hover:rotate-12", bg, color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <div className={cn("text-3xl font-black mb-1", color)}>{value}</div>
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold text-slate-500 uppercase">
            {!isAbsoluteOnly && count !== null && count !== undefined ? `${count.toLocaleString()} Children` : description}
          </div>
          {to && <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all font-black" />}
        </div>
      </div>
    </>
  );

  const containerClassName = cn(
    "p-6 rounded-2xl border flex flex-col justify-between shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] group bg-white",
    isPercentValid && (thresholds?.inverse ? percent <= (thresholds?.red || -1) : percent >= (thresholds?.red || 999)) ? "bg-rose-50 border-rose-200" :
      isPercentValid && (thresholds?.inverse ? percent <= (thresholds?.yellow || -1) : percent >= (thresholds?.yellow || 999)) ? "bg-amber-50 border-amber-200" : "border-slate-200"
  );

  if (to) {
    return (
      <Link to={to} className={containerClassName}>
        {content}
      </Link>
    );
  }

  return (
    <div className={containerClassName}>
      {content}
    </div>
  );
};

const VcaServicesDashboard = () => {
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

  // Discover districts
  const vcaListQuery = useQuery({
    queryKey: ["vca-districts-discovery"],
    queryFn: () => getChildrenByDistrict(""),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const discoveredDistrictsMap = useMemo(() => {
    const groups = new Map<string, string[]>();
    if (vcaListQuery.data) {
      (vcaListQuery.data as any[]).forEach((v: any) => {
        const raw = v.district;
        if (raw) {
          const normalized = toTitleCase(raw.trim());
          if (!groups.has(normalized)) groups.set(normalized, []);
          const variants = groups.get(normalized)!;
          if (!variants.includes(raw)) variants.push(raw);
        }
      });
    }
    return groups;
  }, [vcaListQuery.data]);

  const districts = useMemo(() => {
    return Array.from(discoveredDistrictsMap.keys()).sort();
  }, [discoveredDistrictsMap]);

  const vcasQuery = useQuery({
    queryKey: ["vca-vcas-all", "All"], // Fetch all for local filtering
    queryFn: () => getChildrenByDistrict(""),
    staleTime: 1000 * 60 * 30,
  });

  // 1. PERFORMANCE: Enhanced query configuration with aggressive caching
  const servicesQuery = useQuery({
    queryKey: ["vca-services-all", "All"], // Fetch all for local filtering (syncs variants)
    queryFn: () => getVcaServicesByDistrict(""),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: false,
  });

  // 2. Fetch Case Plans
  const casePlansQuery = useQuery({
    queryKey: ["vca-case-plans-all"],
    queryFn: () => getVcaCasePlansByDistrict(""), // Fetches all as per API limitation
    staleTime: 1000 * 60 * 30,
  });

  // 3. Fetch Referrals
  const referralsQuery = useQuery({
    queryKey: ["vca-referrals-all", "All"], // Fetch all for local filtering
    queryFn: () => getVcaReferralsByMonth(""),
    staleTime: 1000 * 60 * 30,
  });

  const [cachedNationwideStats, setCachedNationwideStats] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("ecap_cache_nationwide_vca");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error parsing nationwide cache", e);
      return null;
    }
  });

  const allServices = useMemo(() => {
    return (servicesQuery.data ?? []) as any[];
  }, [servicesQuery.data]);

  const filteredServices = useMemo(() => {
    const vcas = (vcasQuery.data ?? []) as any[];
    const selectedVariants = selectedDistrict === "All" ? [] : (discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict]);

    const vcaMap = new Map();
    vcas.forEach((v: any) => {
      const id = String(v.uid || v.unique_id || v.vca_id || v.child_id || v.id).trim();
      vcaMap.set(id, v);
    });

    const base = allServices.filter((service: any) => {
      const vId = String(service.vca_id || service.vcaid || service.child_id || "").trim();
      const sDistrict = String(service.district || "");

      // Filter by district (handling variants)
      if (selectedDistrict !== "All" && !selectedVariants.includes(sDistrict)) return false;
      if (!vcaMap.has(vId)) return false;

      // Filter by search query
      const serviceName = String(service.service || service.service_name || service.form_name || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      const vcaData = vcaMap.get(vId);
      const cw = String(vcaData?.caseworker_name || vcaData?.cwac_member_name || vcaData?.caseworker || "").toLowerCase();

      return vId.toLowerCase().includes(query) ||
        serviceName.includes(query) ||
        cw.includes(query) ||
        sDistrict.toLowerCase().includes(query);
    });

    // Sort by latest service date
    return [...base].sort((a, b) => {
      const valA = (a.service_date || a.visit_date || a.date || a.created_at || 0) as any;
      const valB = (b.service_date || b.visit_date || b.date || b.created_at || 0) as any;
      const dateA = new Date(valA).getTime();
      const dateB = new Date(valB).getTime();
      return dateB - dateA;
    });
  }, [allServices, selectedDistrict, searchQuery, discoveredDistrictsMap, vcasQuery.data]);

  const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
    for (const key of keys) {
      const value = record[key];
      if (value !== null && value !== undefined && value !== "") return String(value);
    }
    return "N/A";
  };

  const dashboardStats = useMemo(() => {
    const selectedVariants = selectedDistrict === "All" ? [] : (discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict]);

    let vcas = ((vcasQuery.data ?? []) as any[]).filter(v => {
      const vDist = String(v.district || "");
      return selectedDistrict === "All" || selectedVariants.includes(vDist);
    });

    const services = ((servicesQuery.data ?? []) as any[]).filter(s => {
      const sDist = String(s.district || "");
      return selectedDistrict === "All" || selectedVariants.includes(sDist);
    });

    const casePlans = (casePlansQuery.data ?? []) as any[];
    const referrals = ((referralsQuery.data ?? []) as any[]).filter(r => {
      const rDist = String(r.district || "");
      return selectedDistrict === "All" || selectedVariants.includes(rDist);
    });

    if (!vcas.length && !services.length) return null;

    // Apply Sub-population Filters to base vcas list
    vcas = vcas.filter((vca: any) => {
      return Object.entries(subPopulationFilters).every(([key, value]) => {
        if (value === "all") return true;

        let dataKey = key;
        if (key in filterKeyToDataKey) {
          dataKey = filterKeyToDataKey[key];
        }

        const recordValue = vca[dataKey];
        return value === "yes"
          ? recordValue === "1" || recordValue === "true" || recordValue === 1 || recordValue === true
          : recordValue === "0" || recordValue === "false" || recordValue === 0 || recordValue === false;
      });
    });

    if (!vcas.length && !services.length) return null;

    const SIX_MONTHS_AGO = subMonths(new Date(), 6);
    const NINETY_DAYS_AGO = subDays(new Date(), 90);
    const THIRTY_DAYS_AGO = subDays(new Date(), 30);

    // 1. HIV+ without VL in 6 months
    const hivPositiveVcas = vcas.filter((v: any) =>
      String(v.hiv_status || v.is_hiv_positive || "").toLowerCase().includes("positive") ||
      String(v.hiv_status || v.is_hiv_positive) === "1" ||
      v.is_hiv_positive === true
    );

    const hivWithoutVL = hivPositiveVcas.filter((v: any) => {
      const vlDateStr = v.date_last_vl || v.last_vl_date;
      if (!vlDateStr) return true;
      try {
        const vlDate = parseISO(vlDateStr);
        return vlDate < SIX_MONTHS_AGO;
      } catch { return true; }
    });

    const hivWithoutVLRate = hivPositiveVcas.length > 0
      ? (hivWithoutVL.length / hivPositiveVcas.length) * 100
      : 0;

    // 2. Unsuppressed VL Rate (>= 1000)
    const unsuppressedVcas = hivPositiveVcas.filter((v: any) => {
      const vlResult = parseFloat(String(v.vl_last_result || 0));
      return vlResult >= 1000;
    });

    const unsuppressedRate = hivPositiveVcas.length > 0
      ? (unsuppressedVcas.length / hivPositiveVcas.length) * 100
      : 0;

    // 3. Out-of-School VCAs
    const schooledVcaIds = new Set(
      services
        .filter(s => s.schooled_services && s.schooled_services !== "None" && s.schooled_services !== "[]")
        .map(s => String(s.vca_id || s.vcaid || s.child_id))
    );

    const outOfSchoolVcas = vcas.filter((v: any) => {
      const vId = String(v.uid || v.unique_id || v.vca_id);
      const isNotEnrolled = String(v.school_status || "").toLowerCase().includes("not_enrolled");
      return isNotEnrolled || !schooledVcaIds.has(vId);
    });

    const outOfSchoolRate = vcas.length > 0
      ? (outOfSchoolVcas.length / vcas.length) * 100
      : 0;

    // 4. Case Plan Stagnation (> 90 days)
    const casePlanVcas = vcas.filter((v: any) => {
      const vId = String(v.uid || v.unique_id || v.vca_id);
      const plans = casePlans.filter(p => String(p.vca_id || p.child_id) === vId);
      if (plans.length === 0) return false;
      const lastUpdateStr = plans[0].date_created || plans[0].case_plan_date || plans[0].date;
      if (!lastUpdateStr) return true;
      try {
        const lastDate = parseISO(lastUpdateStr);
        return lastDate < NINETY_DAYS_AGO;
      } catch { return true; }
    });

    // 5. Referral Completion Failure (> 30 days and !completed)
    const pendingReferrals = referrals.filter((r: any) => {
      const status = String(r.status || "").toLowerCase();
      const refDateStr = r.referral_date || r.date;
      if (!refDateStr || status === "completed") return false;
      try {
        const refDate = parseISO(refDateStr);
        return refDate < THIRTY_DAYS_AGO;
      } catch { return false; }
    });

    const referralFailureRate = referrals.length > 0
      ? (pendingReferrals.length / referrals.length) * 100
      : 0;

    // 6. High-Risk Composite Metric
    const riskServiceMap = new Map<string, any[]>();
    services.forEach(s => {
      const vId = String(s.vca_id || s.vcaid || s.child_id);
      if (!riskServiceMap.has(vId)) riskServiceMap.set(vId, []);
      riskServiceMap.get(vId)?.push(s);
    });

    const highRiskVcas = vcas.filter((v: any) => {
      const vId = String(v.uid || v.unique_id || v.vca_id);
      const isHivPos = hivPositiveVcas.some(h => String(h.uid || h.unique_id) === vId);
      const isNoVl = hivWithoutVL.some(h => String(h.uid || h.unique_id) === vId);
      const isUnsuppressed = unsuppressedVcas.some(h => String(h.uid || h.unique_id) === vId);
      const isOutOfSchool = outOfSchoolVcas.some(h => String(h.uid || h.unique_id) === vId);

      const vServices = riskServiceMap.get(vId) || [];
      const noService90d = vServices.length === 0 || vServices.every(s => {
        const sDate = parseISO(s.service_date || s.visit_date || s.date);
        return sDate < NINETY_DAYS_AGO;
      });

      const plans = casePlans.filter(p => String(p.vca_id || p.child_id) === vId);
      const noActiveCasePlan = plans.length === 0;

      return (isHivPos && (isNoVl || isUnsuppressed)) || isOutOfSchool || noService90d || noActiveCasePlan;
    });

    // 6. Per-VCA domain coverage from services
    const serviceMap = new Map<string, any[]>();
    services.forEach(s => {
      const vId = String(s.vca_id || s.vcaid || s.child_id || "");
      if (!serviceMap.has(vId)) serviceMap.set(vId, []);
      serviceMap.get(vId)?.push(s);
    });

    const isCategoryProvided = (record: any, key: string): boolean => {
      const val = record[key];
      if (val === null || val === undefined || val === "") return false;
      const sVal = String(val).toLowerCase().trim();
      return !["not applicable", "n/a", "na", "none", "no", "[]"].includes(sVal);
    };

    let healthDomainCount = 0;
    let schooledDomainCount = 0;
    let safeDomainCount = 0;
    let stableDomainCount = 0;
    let allFourDomainsCount = 0;

    vcas.forEach((v: any) => {
      const vId = String(v.uid || v.unique_id || v.vca_id || "");
      const vServices = serviceMap.get(vId) || [];
      let hasHealth = false, hasSchooled = false, hasSafe = false, hasStable = false;
      vServices.forEach(s => {
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

    const totalVcas = vcas.length;

    // 7. Health Services Analytics
    const healthServiceCounts: Record<string, number> = {};
    const parseServices = (val: any) => {
      if (!val) return [];
      try {
        if (typeof val === 'string') {
          const cleaned = val.replace(/^\[+/, '[').replace(/\]+$/, ']');
          return JSON.parse(cleaned);
        }
        return Array.isArray(val) ? val : [];
      } catch { return []; }
    };

    services.forEach(s => {
      const hSvc = parseServices(s.health_services);
      const hivSvc = parseServices(s.hiv_services);
      const otherSvc = parseServices(s.other_health_services);
      [...hSvc, ...hivSvc, ...otherSvc].forEach(svc => {
        if (svc && svc !== "None") {
          const name = String(svc).trim();
          healthServiceCounts[name] = (healthServiceCounts[name] || 0) + 1;
        }
      });
    });

    // 8. District Risk Comparison (BENCHMARKING: ALWAYS USE NATIONWIDE DATA)
    const nationwideVcas = (vcaListQuery.data ?? []) as any[];
    const distSet = new Set(nationwideVcas.map((v: any) => v.district).filter(Boolean));
    const districtRiskData = Array.from(distSet).map(dist => {
      const distVcas = nationwideVcas.filter((v: any) => v.district === dist);
      const distHivPos = distVcas.filter((v: any) =>
        String(v.hiv_status || v.is_hiv_positive || "").toLowerCase().includes("positive") ||
        String(v.hiv_status || v.is_hiv_positive) === "1"
      );
      const distUnsuppressed = distHivPos.filter((v: any) => {
        const vlResult = parseFloat(String(v.vl_last_result || 0));
        return vlResult >= 1000;
      });
      return {
        name: dist,
        value: distHivPos.length > 0 ? (distUnsuppressed.length / distHivPos.length) * 100 : 0,
        unsuppressed: distUnsuppressed.length,
        totalHiv: distHivPos.length
      };
    }).sort((a, b) => b.value - a.value);

    const healthServiceStatsFinal = Object.entries(healthServiceCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      totalVcas,
      totalServices: services.length,
      // Domain coverage
      healthDomainCount,
      healthDomainRate: totalVcas > 0 ? (healthDomainCount / totalVcas) * 100 : 0,
      schooledDomainCount,
      schooledDomainRate: totalVcas > 0 ? (schooledDomainCount / totalVcas) * 100 : 0,
      safeDomainCount,
      safeDomainRate: totalVcas > 0 ? (safeDomainCount / totalVcas) * 100 : 0,
      stableDomainCount,
      stableDomainRate: totalVcas > 0 ? (stableDomainCount / totalVcas) * 100 : 0,
      allFourDomainsCount,
      allFourDomainsRate: totalVcas > 0 ? (allFourDomainsCount / totalVcas) * 100 : 0,
      // Legacy stats (kept for other sections)
      hivWithoutVL: hivWithoutVL.length,
      hivWithoutVLRate,
      unsuppressedCount: unsuppressedVcas.length,
      unsuppressedRate,
      outOfSchoolCount: outOfSchoolVcas.length,
      outOfSchoolRate,
      stagnantCasePlans: casePlanVcas.length,
      referralFailureRate,
      highRiskCount: highRiskVcas.length,
      highRiskRate: totalVcas > 0 ? (highRiskVcas.length / totalVcas) * 100 : 0,
      districtRiskData,
      healthServiceStats: healthServiceStatsFinal,
    };
  }, [vcasQuery.data, servicesQuery.data, casePlansQuery.data, referralsQuery.data, selectedDistrict, vcaListQuery.data, subPopulationFilters]);

  const displayStats = selectedDistrict === "All" ? (dashboardStats || cachedNationwideStats) : dashboardStats;
  const isRefreshing = servicesQuery.isFetching && (displayStats?.totalVcas > 0);

  const CHART_COLORS = [
    "#0284c7", "#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd",
    "#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"
  ];

  return (
    <DashboardLayout subtitle="VCA Services Intelligence">
      {/* ── Banner ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg mb-8">
        <div className="relative bg-gradient-to-r from-green-800 via-emerald-600 to-teal-500 p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="text-xs border-0 bg-white/20 text-white font-bold">VCA Services</Badge>
                <Badge className="text-xs border-0 bg-white/20 text-white text-emerald-100 font-bold uppercase tracking-wider">Risk Analytics</Badge>
              </div>
              <h1 className="text-3xl font-black text-white lg:text-4xl leading-tight">
                VCA Services
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-white/70 text-sm font-medium">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4" />
                  {(displayStats?.totalVcas || 0).toLocaleString()} Children
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" />
                  {displayStats?.highRiskCount || 0} High Risk Identified
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {selectedDistrict}
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
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Districts</SelectItem>
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

        {/* Banner Metadata Strip */}
        <div className="bg-white border border-slate-200 border-t-0 rounded-b-2xl px-6 py-3 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Health: <span className="text-slate-900 ml-1 font-bold">{(displayStats?.healthDomainRate ?? 0).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Schooled: <span className="text-slate-900 ml-1 font-bold">{(displayStats?.schooledDomainRate ?? 0).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              Safe: <span className="text-slate-900 ml-1 font-bold">{(displayStats?.safeDomainRate ?? 0).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Stable: <span className="text-slate-900 ml-1 font-bold">{(displayStats?.stableDomainRate ?? 0).toFixed(1)}%</span>
            </div>
            {(displayStats?.allFourDomainsRate || 0) < 10 && (
              <div className="ml-auto flex items-center gap-2 text-rose-600 font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                <AlertTriangle className="h-3 w-3" />
                <span>Low Graduation Readiness</span>
              </div>
            )}
            {isRefreshing && (
              <div className="ml-auto flex items-center gap-2 text-emerald-600 animate-pulse">
                <RefreshCcw className="h-3 w-3 animate-spin" />
                <span>Syncing records...</span>
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

      <div className="space-y-8 pb-20">
        {/* 🎯 SECTION 1: DOMAIN COVERAGE KPIs */}
        <div className="space-y-2 mb-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">OVC Service Domain Coverage</p>
          <p className="text-xs text-slate-500">Percentage of VCAs receiving services in each domain. Low rates indicate intervention gaps.</p>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <RiskKpiCard
            label="Health Coverage"
            count={displayStats?.healthDomainCount}
            percent={displayStats?.healthDomainRate}
            thresholds={{ yellow: 60, red: 40, inverse: true }}
            icon={HeartPulse}
            description="Click to view VCAs missing health services"
            to={`/registers/vca-risk?type=health_domain&district=${selectedDistrict}`}
          />
          <RiskKpiCard
            label="Schooled Coverage"
            count={displayStats?.schooledDomainCount}
            percent={displayStats?.schooledDomainRate}
            thresholds={{ yellow: 60, red: 40, inverse: true }}
            icon={BookOpen}
            description="Click to view VCAs missing school services"
            to={`/registers/vca-risk?type=schooled_domain&district=${selectedDistrict}`}
          />
          <RiskKpiCard
            label="Safe Coverage"
            count={displayStats?.safeDomainCount}
            percent={displayStats?.safeDomainRate}
            thresholds={{ yellow: 60, red: 40, inverse: true }}
            icon={Shield}
            description="Click to view VCAs missing safety services"
            to={`/registers/vca-risk?type=safe_domain&district=${selectedDistrict}`}
          />
          <RiskKpiCard
            label="Stable Coverage"
            count={displayStats?.stableDomainCount}
            percent={displayStats?.stableDomainRate}
            thresholds={{ yellow: 60, red: 40, inverse: true }}
            icon={Landmark}
            description="Click to view VCAs missing stability services"
            to={`/registers/vca-risk?type=stable_domain&district=${selectedDistrict}`}
          />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
          <RiskKpiCard
            label="Graduation Readiness (All 4 Domains)"
            count={displayStats?.allFourDomainsCount}
            percent={displayStats?.allFourDomainsRate}
            thresholds={{ yellow: 15, red: 5, inverse: true }}
            icon={GraduationCap}
            description="VCAs covered across Health, Schooled, Safe & Stable"
            to={`/registers/vca-risk?type=graduation_path&district=${selectedDistrict}`}
          />
        </div>

        {/* ── SECTION 2: HEALTH SERVICES INSIGHTS ── */}
        <GlowCard className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-emerald-600" />
                  Most Common Health Services
                </CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Provided Health Services across All Profiles — {selectedDistrict}
                </CardDescription>
              </div>
              <Badge variant="outline" className="h-6 px-3 border-emerald-200 bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase">
                {displayStats?.totalServices || 0} Service Events
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {servicesQuery.isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <RefreshCcw className="h-8 w-8 text-emerald-500 animate-spin opacity-20" />
              </div>
            ) : !displayStats?.healthServiceStats || displayStats.healthServiceStats.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-2xl">
                <Target className="h-10 w-10 opacity-20" />
                <p className="text-sm font-bold">No health services found in delivery records</p>
              </div>
            ) : (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayStats.healthServiceStats} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
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
                      {displayStats.healthServiceStats.map((_: any, index: number) => (
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

      {/* Module Navigation & Audit Trail */}
      <div className="grid gap-6">
        <GlowCard className="overflow-hidden border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Audit History</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Audited operations in {selectedDistrict}</p>
              </div>
              <div className="relative w-full md:w-[400px] group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  placeholder="Search by Beneficiary ID, Caseworker or District..."
                  className="pl-11 bg-white border-slate-200 h-11 text-sm font-bold rounded-xl focus-visible:ring-emerald-500/20 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 pl-8 h-14">Beneficiary ID</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 h-14">District</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 h-14">Date of Service</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 h-14">Service Provided</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right pr-8 h-14">Caseworker</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicesQuery.isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="p-0">
                        <TableSkeleton rows={1} columns={5} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <FileText className="h-10 w-10 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest opacity-50">No service logs available</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.slice(0, 50).map((service, index) => {
                    const record = service as Record<string, unknown>;
                    const vcaId = String(pickValue(record, ["vca_id", "vcaid", "child_id", "unique_id"])).trim();

                    const vcas = (vcasQuery.data ?? []) as any[];
                    const vcaData = vcas.find(v => String(v.uid || v.unique_id || v.vca_id || v.child_id || v.id).trim() === vcaId);

                    const caseworker = vcaData?.caseworker_name ||
                      vcaData?.cwac_member_name ||
                      vcaData?.caseworker ||
                      (service as any).caseworker_name ||
                      "N/A";

                    const providedServices: string[] = [];
                    const primaryService = String(pickValue(record, ["service", "service_name", "form_name"]));
                    if (primaryService !== "N/A") providedServices.push(primaryService);

                    SERVICE_CATEGORIES.forEach(cat => {
                      if (record[cat]) {
                        const parsed = parseHealthServices(record[cat]);
                        parsed.forEach(s => {
                          if (s && !providedServices.includes(s)) providedServices.push(s);
                        });
                      }
                    });

                    return (
                      <TableRow key={index} className="hover:bg-slate-50/50 transition-colors group text-sm">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200/40 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-100 transition-all uppercase">
                              {vcaId}
                            </span>
                            <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600" />
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-600 uppercase tracking-tighter">
                          {String(record.district || "N/A")}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-500">
                          {String(pickValue(record, ["service_date", "visit_date", "date"]))}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5 max-w-[400px]">
                            {providedServices.length > 0 ? (
                              providedServices.slice(0, 3).map((s, i) => (
                                <Badge key={i} variant="outline" className="text-[9px] font-black border-slate-200 bg-white h-6 px-2.5 rounded-md uppercase tracking-tighter">
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
                        <TableCell className="text-right pr-6 py-4">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-slate-900 text-[11px] uppercase truncate max-w-[150px]">
                              {caseworker}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Field Officer</span>
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
      </div>

    </DashboardLayout >
  );
};

export default VcaServicesDashboard;
