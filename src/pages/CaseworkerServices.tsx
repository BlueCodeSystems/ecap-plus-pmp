import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import {
  Users,
  Search,
  Briefcase,
  TrendingUp,
  MapPin,
  RefreshCcw,
  Star,
  Trophy,
  Activity,
  ChevronRight,
  Download,
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCaregiverServicesByDistrict,
  getVcaServicesByDistrict,
  getHouseholdServicesByDistrict,
  getHouseholdsByDistrict,
} from "@/lib/api";
import { cn, toTitleCase } from "@/lib/utils";
import { downloadCsv } from "@/lib/exportUtils";
import { toast } from "sonner";

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7", "#ec4899", "#06b6d4", "#f43f5e", "#8b5cf6"];

const RiskKpiCard = ({ label, count, icon: Icon, description, to, color = "emerald", onClick, isActive }: any) => {
  const isCountValid = count !== null && count !== undefined;
  const value = isCountValid ? count.toLocaleString() : "0";

  const colorMap: any = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-400" },
    teal: { bg: "bg-teal-50", text: "text-teal-600", ring: "ring-teal-400" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-400" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-400" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-400" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-400" },
    slate: { bg: "bg-slate-50", text: "text-slate-600", ring: "ring-slate-400" },
  };

  const style = colorMap[color] || colorMap.slate;

  const content = (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md active:scale-95 border-slate-100 h-full flex flex-col justify-between",
        (to || onClick) && "cursor-pointer",
        isActive && `ring-2 ${style.ring} shadow-lg`
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
        {(to || onClick) ? "Click to view" : description}
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



const Caseworkers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpi, setSelectedKpi] = useState<"services" | "caseworkers" | "district" | null>(null);
  const drilldownRef = useRef<HTMLDivElement>(null);

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["caseworker-cg-services", "All"] }),
      queryClient.invalidateQueries({ queryKey: ["caseworker-vca-services", "All"] }),
      queryClient.invalidateQueries({ queryKey: ["caseworker-hh-services", "All"] }),
      queryClient.invalidateQueries({ queryKey: ["caseworker-hh-map", "All"] }),
      queryClient.invalidateQueries({ queryKey: ["districts-discovery-caseworker"] }),
    ]);
  };

  const handleExportDistrictDetails = (districtName: string) => {
    const selectedVariants = discoveredDistrictsMap.get(districtName) || [districtName];
    const rawData = [
      ...(caregiverServicesQuery.data || []),
      ...(vcaServicesQuery.data || []),
      ...(householdServicesQuery.data || [])
    ] as any[];

    const districtServices = rawData.filter(s => {
      const sDist = String(s.district || "");
      return selectedVariants.includes(sDist);
    });

    if (districtServices.length === 0) {
      toast.error(`No services found for ${districtName}`);
      return;
    }

    const headers = ["Beneficiary ID", "District", "Date", "Services", "Caseworker", "Type"];
    const rows = districtServices.map(s => {
      const hhId = String(s.household_id || s.hh_id || "");
      const beneficiaryId = s.vca_id || s.uid || s.child_id || hhId;
      const type = s.vca_id || s.child_id ? "VCA" : s.household_id ? "Household" : "Caregiver";
      const services = s.service_name || s.serviceName || s.service || s.form_name || "N/A";
      const cw = s.caseworker_name || s.caseworkerName || s.cwac_member_name || s.caseworker || householdCwMap[hhId] || "Unknown";

      return [
        beneficiaryId,
        s.district || "N/A",
        s.service_date || s.visit_date || s.created_at || "N/A",
        services,
        cw,
        type
      ];
    });

    downloadCsv(headers, rows, `ECAP_Services_${districtName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${districtServices.length} records for ${districtName}`);
  };

  useEffect(() => {
    // SECURITY GUARD: District Users are not allowed to access Caseworkers
    if (user && user.description === "District User") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Discover districts
  const hhListQuery = useQuery({
    queryKey: ["districts-discovery-caseworker"],
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

  // Main Data Queries
  const caregiverServicesQuery = useQuery({
    queryKey: ["caseworker-cg-services", "All"], // Fetch all for local filtering
    queryFn: () => getCaregiverServicesByDistrict(""),
    staleTime: 1000 * 60 * 10,
  });

  const vcaServicesQuery = useQuery({
    queryKey: ["caseworker-vca-services", "All"], // Fetch all for local filtering
    queryFn: () => getVcaServicesByDistrict(""),
    staleTime: 1000 * 60 * 10,
  });

  const householdServicesQuery = useQuery({
    queryKey: ["caseworker-hh-services", "All"], // Fetch all for local filtering
    queryFn: () => getHouseholdServicesByDistrict(""),
    staleTime: 1000 * 60 * 10,
  });

  // Household data for mapping fallback caseworker names
  const householdsQuery = useQuery({
    queryKey: ["caseworker-hh-map", "All"], // Fetch all for local filtering
    queryFn: () => getHouseholdsByDistrict(""),
    staleTime: 1000 * 60 * 30,
  });

  const isLoading =
    caregiverServicesQuery.isLoading ||
    vcaServicesQuery.isLoading ||
    householdServicesQuery.isLoading ||
    householdsQuery.isLoading;

  // Create a mapping of household_id -> caseworker_name
  const householdCwMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (householdsQuery.data) {
      (householdsQuery.data as any[]).forEach(h => {
        const id = String(h.household_id || h.hh_id || "");
        const cw = h.caseworker_name || h.cwac_member_name || h.caseworker || "";
        if (id && cw) map[id] = cw;
      });
    }
    return map;
  }, [householdsQuery.data]);

  const allServices = useMemo(() => {
    const cg = (caregiverServicesQuery.data ?? []) as any[];
    const vca = (vcaServicesQuery.data ?? []) as any[];
    const hh = (householdServicesQuery.data ?? []) as any[];
    const total = [...cg, ...vca, ...hh];

    if (selectedDistrict === "All") return total;

    const selectedVariants = discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict];
    return total.filter(s => {
      const sDist = String(s.district || "");
      return selectedVariants.includes(sDist);
    });
  }, [caregiverServicesQuery.data, vcaServicesQuery.data, householdServicesQuery.data, selectedDistrict, discoveredDistrictsMap]);

  const stats = useMemo(() => {
    if (!allServices.length) return null;

    const workerCounts: Record<string, number> = {};
    const districtCounts: Record<string, number> = {};
    const workerDistricts: Record<string, string> = {};

    allServices.forEach(s => {
      const hhId = String(s.household_id || s.hh_id || "");
      const cw = s.caseworker_name ||
        s.caseworkerName ||
        s.cwac_member_name ||
        s.caseworker ||
        householdCwMap[hhId] ||
        "Unknown";

      const dist = s.district || "Unknown";

      workerCounts[cw] = (workerCounts[cw] || 0) + 1;
      districtCounts[dist] = (districtCounts[dist] || 0) + 1;
      if (cw !== "Unknown") workerDistricts[cw] = dist;
    });

    const topCaseworkers = Object.entries(workerCounts)
      .filter(([name]) => name !== "Unknown" && name !== "N/A" && name !== "")
      .map(([name, count]) => ({
        name,
        value: count,
        district: workerDistricts[name] || "N/A"
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topDistricts = Object.entries(districtCounts)
      .filter(([name]) => name !== "Unknown")
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalServices: allServices.length,
      activeWorkers: Object.keys(workerCounts).filter(w => w !== "Unknown").length,
      topCaseworkers,
      topDistricts,
      mostPerformingDistrict: topDistricts[0]?.name || "N/A",
      districtServiceCount: topDistricts[0]?.value || 0,
    };

  }, [allServices, householdCwMap]);

  const filteredAuditLog = useMemo(() => {
    return allServices
      .filter(s => {
        const hhId = String(s.household_id || s.hh_id || "");
        const cw = String(s.caseworker_name || s.caseworkerName || s.cwac_member_name || s.caseworker || householdCwMap[hhId] || "").toLowerCase();
        const dist = String(s.district || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        return cw.includes(query) || dist.includes(query);
      })
      .slice(0, 20);
  }, [allServices, searchQuery, householdCwMap]);

  // ── Drilldown records per KPI card
  const drilldownRecords = useMemo(() => {
    if (!selectedKpi) return [];

    if (selectedKpi === "services") {
      return allServices.slice(0, 500);
    }
    if (selectedKpi === "caseworkers") {
      // Unique caseworkers with their counts
      const workerMap: Record<string, { name: string; district: string; count: number }> = {};
      allServices.forEach(s => {
        const hhId = String(s.household_id || s.hh_id || "");
        const cw = s.caseworker_name || s.caseworkerName || s.cwac_member_name || s.caseworker || householdCwMap[hhId] || "Unknown";
        const dist = s.district || "Unknown";
        if (cw === "Unknown" || cw === "") return;
        if (!workerMap[cw]) workerMap[cw] = { name: cw, district: dist, count: 0 };
        workerMap[cw].count++;
      });
      return Object.values(workerMap).sort((a, b) => b.count - a.count);
    }
    if (selectedKpi === "district") {
      const topDistrict = stats?.mostPerformingDistrict;
      if (!topDistrict) return [];
      return allServices.filter(s => String(s.district || "") === topDistrict);
    }
    return [];
  }, [selectedKpi, allServices, householdCwMap, stats]);

  const handleKpiClick = (kpi: "services" | "caseworkers" | "district") => {
    setSelectedKpi(prev => prev === kpi ? null : kpi);
    setTimeout(() => drilldownRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleDrilldownExport = () => {
    if (!selectedKpi || drilldownRecords.length === 0) return;

    if (selectedKpi === "caseworkers") {
      const headers = ["Caseworker", "District", "Total Services"];
      const rows = (drilldownRecords as any[]).map(r => [r.name, r.district, r.count]);
      downloadCsv(headers, rows, `ECAP_Caseworkers_${new Date().toISOString().split('T')[0]}.csv`);
    } else {
      const headers = ["Household ID", "Caseworker", "Service Date", "District", "Type"];
      const rows = (drilldownRecords as any[]).map(s => {
        const hhId = String(s.household_id || s.hh_id || "");
        const cw = s.caseworker_name || s.caseworkerName || s.cwac_member_name || s.caseworker || householdCwMap[hhId] || "N/A";
        const type = s.vca_id || s.child_id ? "VCA" : hhId ? "Household" : "Caregiver";
        return [hhId || "N/A", cw, s.service_date || s.visit_date || "N/A", s.district || "N/A", type];
      });
      downloadCsv(headers, rows, `ECAP_${selectedKpi}_${new Date().toISOString().split('T')[0]}.csv`);
    }
    toast.success(`Exported ${drilldownRecords.length} records`);
  };

  return (
    <DashboardLayout subtitle="Caseworker performance & impact">
      {/* ── Banner ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg mb-8">
        <div className="relative bg-gradient-to-r from-green-800 via-emerald-600 to-teal-500 p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>

              <h1 className="text-3xl font-black text-white lg:text-4xl leading-tight">
                Caseworkers
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-white/70 text-sm font-medium">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {stats?.activeWorkers || 0} Active Caseworkers
                </span>

                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  Most performing: {stats?.mostPerformingDistrict}
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
                onClick={handleRefresh}
                className="bg-white text-emerald-700 hover:bg-white/90 shadow-xl h-10 font-bold px-5"
                disabled={isLoading}
              >
                <RefreshCcw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Sync
              </Button>
            </div>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <RiskKpiCard
          label="Services"
          icon={Trophy}
          count={stats?.totalServices || 0}
          color="emerald"
          onClick={() => navigate(`/registers/caseworker-drilldown?type=services&district=${selectedDistrict}`)}
        />

        <RiskKpiCard
          label="Caseworkers"
          icon={Users}
          count={stats?.activeWorkers || 0}
          color="teal"
          onClick={() => navigate(`/registers/caseworker-drilldown?type=caseworkers&district=${selectedDistrict}`)}
        />

        <RiskKpiCard
          label="Top performing district"
          icon={Star}
          count={stats?.districtServiceCount || 0}
          color="amber"
          onClick={() => navigate(`/registers/caseworker-drilldown?type=district&district=${selectedDistrict}`)}
        />
      </div>

      {/* ── Charts Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top 5 Caseworkers */}
        <GlowCard>
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Top 5 hardworking caseworkers
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
              By total services recorded
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="h-full flex items-center justify-center"><RefreshCcw className="animate-spin opacity-20" /></div>
            ) : (
              <div className="space-y-4">
                {stats?.topCaseworkers.map((worker, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => navigate("/profile/caseworker-details", { state: { name: worker.name } })}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full font-bold text-xs shadow-sm",
                        index === 0 ? "bg-amber-100 text-amber-700 ring-4 ring-amber-50" :
                          index === 1 ? "bg-slate-200 text-slate-700 ring-4 ring-slate-100" :
                            index === 2 ? "bg-orange-100 text-orange-700 ring-4 ring-orange-50" :
                              "bg-emerald-50 text-emerald-700"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {worker.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-500 tracking-wider">
                            {worker.district}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900">
                        {worker.value.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 tracking-widest">
                        Services
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </GlowCard>

        {/* Top Districts */}
        <GlowCard>
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              District ranking (top 5)
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
              By service intensity volume
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="h-full flex items-center justify-center"><RefreshCcw className="animate-spin opacity-20" /></div>
            ) : (
              <div className="space-y-4">
                {stats?.topDistricts.map((district, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full font-bold text-xs shadow-sm",
                        index === 0 ? "bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50" :
                          index === 1 ? "bg-teal-100 text-teal-700 ring-4 ring-teal-50" :
                            index === 2 ? "bg-cyan-100 text-cyan-700 ring-4 ring-cyan-50" :
                              "bg-slate-100 text-slate-700"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {district.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 -ml-1 text-[10px] font-bold text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 gap-1"
                          onClick={() => handleExportDistrictDetails(district.name)}
                        >
                          <Download className="h-3 w-3" />
                          Download report
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900">
                        {district.value.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 tracking-widest">
                        Services
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </GlowCard>
      </div>

      {/* ── Recent Activity Audit ── */}
      <GlowCard className="overflow-hidden border-slate-200 mb-20">
        <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/30 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 tracking-tight text-xl">Recent interventions</CardTitle>
              <CardDescription className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">Audit log by caseworker & district</CardDescription>
            </div>
            <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by Caseworker or District..."
                className="pl-11 bg-white border-slate-200 h-11 text-sm font-bold rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b">
              <TableRow>
                <TableHead className="font-bold text-[10px] tracking-widest text-slate-400 pl-8 h-14 uppercase">Caseworker</TableHead>
                <TableHead className="font-bold text-[10px] tracking-widest text-slate-400 h-14 uppercase">Household id</TableHead>
                <TableHead className="font-bold text-[10px] tracking-widest text-slate-400 h-14 uppercase">Service date</TableHead>
                <TableHead className="font-bold text-[10px] tracking-widest text-slate-400 text-right pr-8 h-14 uppercase">District</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}><TableSkeleton rows={1} columns={4} /></TableCell>
                  </TableRow>
                ))
              ) : filteredAuditLog.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 text-center text-slate-400">No records found</TableCell>
                </TableRow>
              ) : (
                filteredAuditLog.map((s, i) => {
                  const cwName = s.caseworker_name ||
                    s.caseworkerName ||
                    s.cwac_member_name ||
                    s.caseworker ||
                    householdCwMap[String(s.household_id || s.hh_id || "")] ||
                    "N/A";
                  return (
                    <TableRow
                      key={i}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      onClick={() => cwName !== "N/A" && navigate("/profile/caseworker-details", { state: { name: cwName } })}
                    >
                      <TableCell className="pl-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">
                            {cwName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">Case Worker</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {s.household_id || s.hh_id || "N/A"}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-500">
                        {s.service_date || s.date || "N/A"}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Badge variant="outline" className="text-[10px] font-bold border-slate-200 bg-white">
                          {s.district || "N/A"}
                        </Badge>
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

export default Caseworkers;
