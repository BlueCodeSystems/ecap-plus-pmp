import { CheckCircle2, Flag, ClipboardList, TrendingUp, Users, Activity, Target, Zap, Search, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { SubPopulationFilter } from "@/components/dashboard/SubPopulationFilter";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import LoadingDots from "@/components/aceternity/LoadingDots";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toTitleCase } from "@/lib/utils";
import {
  DEFAULT_DISTRICT,
  getVcaReferralsByMonth,
  getVcaCasePlansByDistrict,
  getChildrenByDistrict,
  getVcaServicesByDistrict,
  getHouseholdsByDistrict
} from "@/lib/api";
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

const serviceModules = [
  "Household Screening",
  "Family Members",
  "Visits",
  "Case Plans",
  "Household Assessment",
  "Graduation",
  "All Services",
];

const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return String(value);
    }
  }
  return "N/A";
};

const VcaServices = () => {
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
  };

  // SECURITY: Enforce district lock for District Users
  useEffect(() => {
    if (user?.description === "District User" && user?.location && selectedDistrict !== user.location) {
      setSelectedDistrict(user.location);
    }
  }, [user, selectedDistrict]);

  // Discover districts
  const hhListQuery = useQuery({
    queryKey: ["districts-discovery-vca", "All"],
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
    queryKey: ["vca-services", "All"], // Fetch all for local filtering
    queryFn: () => getVcaServicesByDistrict(""),
    staleTime: 1000 * 60 * 10,
  });

  const vcaListQuery = useQuery({
    queryKey: ["vca-list-for-services-filters", "All"], // Fetch all for local filtering
    queryFn: () => getChildrenByDistrict(""),
    staleTime: 1000 * 60 * 30,
  });

  const services = servicesQuery.data ?? [];

  const filteredServices = useMemo(() => {
    const vcas = (vcaListQuery.data ?? []) as any[];
    const vcaMap = new Map();
    vcas.forEach((v: any) => {
      const id = String(v.uid || v.unique_id || v.vca_id || v.child_id || v.id).trim();
      vcaMap.set(id, v);
    });

    const selectedVariants = selectedDistrict === "All" ? [] : (discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict]);

    const base = services.filter((service: any) => {
      const vcaId = String(service.vca_id || service.vcaid || service.child_id || "").trim();
      const sDistrict = String(service.district || "");

      // Filter by district (handling variants)
      if (selectedDistrict !== "All" && !selectedVariants.includes(sDistrict)) return false;

      const vcaData = vcaMap.get(vcaId);

      // Sub-population Filters
      const matchesSubPop = Object.entries(subPopulationFilters).every(([key, value]) => {
        if (value === "all") return true;
        if (!vcaData) return false; // If we have an active filter but no VCA data, exclude it

        let dataKey = key;
        const filterToData: Record<string, string> = {
          caahh: 'child_adolescent_in_aged_headed_household',
          caichh: 'child_adolescent_in_chronically_ill_headed_household',
          caich: 'child_adolescent_in_child_headed_household',
          calwd: 'child_adolescent_living_with_disability',
          caifhh: 'child_adolescent_in_female_headed_household',
          muc: 'under_5_malnourished',
          pbfw: 'pbfw'
        };
        if (key in filterToData) {
          dataKey = filterToData[key];
        }

        const recordValue = vcaData[dataKey];
        return value === "yes"
          ? recordValue === "1" || recordValue === "true" || recordValue === 1 || recordValue === true
          : recordValue === "0" || recordValue === "false" || recordValue === 0 || recordValue === false;
      });

      if (!matchesSubPop) return false;

      // Search Query
      const query = searchQuery.toLowerCase();
      if (!query) return true;

      const cw = String(vcaData?.caseworker_name || vcaData?.cwac_member_name || vcaData?.caseworker || "").toLowerCase();
      const district = String(service.district || "").toLowerCase();
      const serviceName = String(service.service || service.service_name || service.form_name || "").toLowerCase();

      return vcaId.toLowerCase().includes(query) ||
        cw.includes(query) ||
        district.includes(query) ||
        serviceName.includes(query);
    });

    // Sort by latest service date
    return [...base].sort((a, b) => {
      const valA = (a.service_date || a.visit_date || a.date || a.created_at || 0) as any;
      const valB = (b.service_date || b.visit_date || b.date || b.created_at || 0) as any;
      const dateA = new Date(valA).getTime();
      const dateB = new Date(valB).getTime();
      return dateB - dateA;
    });
  }, [services, vcaListQuery.data, subPopulationFilters, searchQuery]);

  const recentServices = filteredServices.slice(0, 10);

  // --- DASHBOARD DATA CALCULATIONS ---

  const dashboardStats = useMemo(() => {
    if (!filteredServices.length) return null;

    const uniqueVcas = new Set(filteredServices.map(s => pickValue(s as any, ["vca_id", "vcaid", "child_id"]))).size;
    const completedServices = filteredServices.filter(s => {
      const status = pickValue(s as any, ["status", "state", "outcome"]).toLowerCase();
      return status.includes("complete") || status.includes("success") || status.includes("active");
    }).length;

    return {
      total: filteredServices.length,
      uniqueVcas,
      completionRate: Math.round((completedServices / filteredServices.length) * 100),
      avgEngagement: (filteredServices.length / uniqueVcas).toFixed(1)
    };
  }, [filteredServices]);

  const serviceDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredServices.forEach(s => {
      const type = pickValue(s as any, ["service", "service_name", "form_name"]);
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredServices]);

  const monthlyTrend = useMemo(() => {
    const months: Record<string, number> = {};
    filteredServices.forEach(s => {
      const dateStr = pickValue(s as any, ["service_date", "visit_date", "created_at", "date"]);
      if (dateStr === "N/A") return;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      const key = date.toLocaleString('default', { month: 'short' });
      months[key] = (months[key] || 0) + 1;
    });

    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Object.entries(months)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name));
  }, [filteredServices]);

  const categoryData = useMemo(() => {
    // Categorize services based on name keywords
    const categories = {
      Health: 0,
      Safe: 0,
      Schooled: 0,
      Stable: 0
    };

    filteredServices.forEach(s => {
      const name = pickValue(s as any, ["service", "service_name", "form_name"]).toLowerCase();
      if (name.includes("health") || name.includes("hiv") || name.includes("medical")) categories.Health++;
      else if (name.includes("safe") || name.includes("abuse") || name.includes("protection")) categories.Safe++;
      else if (name.includes("school") || name.includes("education") || name.includes("enrollment")) categories.Schooled++;
      else if (name.includes("stable") || name.includes("assessment") || name.includes("finance")) categories.Stable++;
      else categories.Stable++; // Default fallback
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredServices]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const top = topScrollRef.current;
    const bottom = bottomScrollRef.current;
    if (!top || !bottom) return;

    const handleTopScroll = () => { if (bottom) bottom.scrollLeft = top.scrollLeft; };
    const handleBottomScroll = () => { if (top) top.scrollLeft = bottom.scrollLeft; };

    top.addEventListener('scroll', handleTopScroll);
    bottom.addEventListener('scroll', handleBottomScroll);
    return () => {
      top.removeEventListener('scroll', handleTopScroll);
      bottom.removeEventListener('scroll', handleBottomScroll);
    };
  }, [services.length]);

  return (
    <DashboardLayout subtitle="Vca services dashboard">
      <PageIntro
        eyebrow="Intelligence dashboard"
        title="Vca services insights"
        description="Monitor service delivery trends, engagement depth, and operational performance across the district."
        actions={
          <div className="flex items-center gap-3">
            <Select
              value={selectedDistrict}
              onValueChange={setSelectedDistrict}
              disabled={user?.description === "District User"}
            >
              <SelectTrigger className="w-[180px] bg-white border-emerald-100 text-emerald-900 font-bold h-10 shadow-sm">
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent className="font-bold border-emerald-100">
                <SelectItem value="All">All districts</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge className="bg-emerald-100 text-emerald-700 font-bold py-1 px-3 h-10 flex items-center">
              {servicesQuery.isLoading ? <LoadingDots /> : `${services.length} total services`}
            </Badge>
          </div>
        }
      />

      <div className="mb-6">
        <SubPopulationFilter
          filters={subPopulationFilters}
          labels={subPopulationFilterLabels}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      </div>

      {/* KPI Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total services", value: dashboardStats?.total || 0, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Unique Vcas", value: dashboardStats?.uniqueVcas || 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Completion rate", value: `${dashboardStats?.completionRate || 0}%`, icon: Target, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Avg engagement", value: dashboardStats?.avgEngagement || 0, icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((kpi, idx) => (
          <GlowCard key={idx} className="p-0 border-0 overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-wider text-slate-500 mb-1">{kpi.label}</p>
                <p className="text-3xl font-black text-slate-900">{servicesQuery.isLoading ? "..." : kpi.value}</p>
              </div>
              <div className={`${kpi.bg} ${kpi.color} p-3 rounded-2xl shadow-inner`}>
                <kpi.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="h-1 w-full bg-slate-100">
              <div className={`h-full ${kpi.color.replace('text', 'bg')} transition-all duration-500`} style={{ width: servicesQuery.isLoading ? '0%' : '100%' }} />
            </div>
          </GlowCard>
        ))}
      </div>

      {/* Discovery Insights / Quick Summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Distribution Chart */}
          <GlowCard>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Service distribution</CardTitle>
                  <CardDescription>Frequency of services provided in {selectedDistrict}</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceDistribution} layout="vertical" margin={{ left: 100, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#10b981"
                    radius={[0, 8, 8, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </GlowCard>

          {/* Trend Chart */}
          <GlowCard>
            <CardHeader>
              <CardTitle className="text-xl">Engagement velocity</CardTitle>
              <CardDescription>Service delivery volume over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </GlowCard>
        </div>

        <div className="space-y-6">
          {/* Category Pie Chart */}
          <GlowCard className="h-full">
            <CardHeader>
              <CardTitle className="text-xl">Core domains</CardTitle>
              <CardDescription>Service category balance</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-8">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 space-y-4 w-full">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-bold text-slate-700 tracking-wider">Dashboard insight</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed italic">
                    Dominant service domain: <span className="text-slate-900 font-bold">{categoryData.sort((a, b) => b.value - a.value)[0]?.name}</span>.
                    Consider increasing intervention coverage in <span className="text-slate-900 font-bold">{categoryData.sort((a, b) => a.value - b.value)[0]?.name}</span> to maintain case balance.
                  </p>
                </div>
              </div>
            </CardContent>
          </GlowCard>
        </div>
      </div>

      {/* Module Navigation */}
      <GlowCard>
        <CardHeader>
          <CardTitle>Operative modules</CardTitle>
          <CardDescription>Quick actions for field workers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {serviceModules.map((module) => (
              <Button key={module} variant="outline" className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-medium">
                {module}
              </Button>
            ))}
            <Button variant="destructive" className="gap-2 shadow-lg shadow-rose-500/20">
              <Flag className="h-4 w-4" />
              Flag Concern
            </Button>
          </div>
        </CardContent>
      </GlowCard>

      {/* Records Table (Slimmed Down) */}
      <GlowCard>
        <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/30 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Services audit trail</CardTitle>
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
        <CardContent className="p-0">
          <div className="max-w-full overflow-hidden">
            <div className="w-full overflow-x-auto">
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
                  {servicesQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="p-0">
                        <TableSkeleton rows={5} columns={4} />
                      </TableCell>
                    </TableRow>
                  ) : recentServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-slate-400">
                        No service logs available in system.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentServices.map((service, index) => {
                      const record = service as Record<string, unknown>;
                      const vcaId = String(pickValue(record, ["vca_id", "vcaid", "child_id", "unique_id"])).trim();

                      const vcas = (vcaListQuery.data ?? []) as any[];
                      const vcaData = vcas.find(v => String(v.uid || v.unique_id || v.vca_id || v.child_id || v.id).trim() === vcaId);

                      const caseworker = vcaData?.caseworker_name ||
                        vcaData?.cwac_member_name ||
                        vcaData?.caseworker ||
                        service.caseworker_name ||
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
                              <span className="font-mono text-[11px] bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200/40 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-100 transition-all">
                                {vcaId}
                              </span>
                              <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600" />
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-600 tracking-tighter">
                            {String(record.district || "N/A")}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-500">
                            {String(pickValue(record, ["service_date", "visit_date", "date"]))}
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
                          <TableCell className="text-right pr-6 py-4">
                            <div className="flex flex-col items-end">
                              <span className="font-black text-slate-900 text-[11px] truncate max-w-[150px]">
                                {caseworker}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold tracking-widest">Case worker</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </GlowCard>
    </DashboardLayout>
  );
};

export default VcaServices;
