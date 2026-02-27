import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Download, Search, Briefcase, Trophy, Star, Users, MapPin } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getCaregiverServicesByDistrict,
  getVcaServicesByDistrict,
  getHouseholdServicesByDistrict,
  getHouseholdsByDistrict,
} from "@/lib/api";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { cn, toTitleCase } from "@/lib/utils";
import { downloadCsv } from "@/lib/exportUtils";
import { toast } from "sonner";

const VIEW_TYPES = {
  services: {
    label: "All Services",
    icon: Trophy,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    description: "All service interventions across all caseworkers and districts",
  },
  caseworkers: {
    label: "Active Caseworkers",
    icon: Users,
    color: "text-teal-600",
    bg: "bg-teal-50",
    description: "All caseworkers ranked by total services recorded",
  },
  district: {
    label: "Top Performing District",
    icon: Star,
    color: "text-amber-600",
    bg: "bg-amber-50",
    description: "All services from the highest-performing district",
  },
};

const CaseworkerRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const type = (searchParams.get("type") || "services") as keyof typeof VIEW_TYPES;

  const initialDistrict =
    user?.description === "District User" && user?.location
      ? user.location
      : searchParams.get("district") || "All";

  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?.description === "District User" && user?.location) {
      setSelectedDistrict(user.location);
    }
  }, [user]);

  // ── Data Queries
  const hhListQuery = useQuery({
    queryKey: ["cw-reg-hh-list"],
    queryFn: () => getHouseholdsByDistrict(""),
    staleTime: 1000 * 60 * 30,
  });

  const cgServicesQuery = useQuery({
    queryKey: ["cw-reg-cg-services"],
    queryFn: () => getCaregiverServicesByDistrict(""),
    staleTime: 1000 * 60 * 10,
  });

  const vcaServicesQuery = useQuery({
    queryKey: ["cw-reg-vca-services"],
    queryFn: () => getVcaServicesByDistrict(""),
    staleTime: 1000 * 60 * 10,
  });

  const hhServicesQuery = useQuery({
    queryKey: ["cw-reg-hh-services"],
    queryFn: () => getHouseholdServicesByDistrict(""),
    staleTime: 1000 * 60 * 10,
  });

  const isLoading =
    cgServicesQuery.isLoading ||
    vcaServicesQuery.isLoading ||
    hhServicesQuery.isLoading ||
    hhListQuery.isLoading;

  // ── District discovery
  const discoveredDistrictsMap = useMemo(() => {
    const groups = new Map<string, string[]>();
    (hhListQuery.data as any[] ?? []).forEach((h: any) => {
      const raw = h.district;
      if (raw) {
        const normalized = toTitleCase(raw.trim());
        if (!groups.has(normalized)) groups.set(normalized, []);
        const variants = groups.get(normalized)!;
        if (!variants.includes(raw)) variants.push(raw);
      }
    });
    return groups;
  }, [hhListQuery.data]);

  const districts = useMemo(() => Array.from(discoveredDistrictsMap.keys()).sort(), [discoveredDistrictsMap]);

  // ── Caseworker name mapping from household data
  const householdCwMap = useMemo(() => {
    const map: Record<string, string> = {};
    (hhListQuery.data as any[] ?? []).forEach((h: any) => {
      const id = String(h.household_id || h.hh_id || "");
      const cw = h.caseworker_name || h.cwac_member_name || h.caseworker || "";
      if (id && cw) map[id] = cw;
    });
    return map;
  }, [hhListQuery.data]);

  // ── All combined services filtered by district
  const allServices = useMemo(() => {
    const cg = (cgServicesQuery.data ?? []) as any[];
    const vca = (vcaServicesQuery.data ?? []) as any[];
    const hh = (hhServicesQuery.data ?? []) as any[];
    const total = [...cg, ...vca, ...hh];

    if (selectedDistrict === "All") return total;

    const selectedVariants = discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict];
    return total.filter(s => selectedVariants.includes(String(s.district || "")));
  }, [cgServicesQuery.data, vcaServicesQuery.data, hhServicesQuery.data, selectedDistrict, discoveredDistrictsMap]);

  // ── Stats for "district" type
  const topDistrict = useMemo(() => {
    const districtCounts: Record<string, number> = {};
    allServices.forEach(s => {
      const d = String(s.district || "Unknown");
      districtCounts[d] = (districtCounts[d] || 0) + 1;
    });
    return Object.entries(districtCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  }, [allServices]);

  // ── Compute display records based on type
  const rawRecords = useMemo(() => {
    if (type === "services") {
      return allServices;
    }
    if (type === "caseworkers") {
      const workerMap: Record<string, { name: string; district: string; count: number }> = {};
      allServices.forEach(s => {
        const hhId = String(s.household_id || s.hh_id || "");
        const cw =
          s.caseworker_name ||
          s.caseworkerName ||
          s.cwac_member_name ||
          s.caseworker ||
          householdCwMap[hhId] ||
          "";
        if (!cw || cw === "Unknown") return;
        const dist = s.district || "Unknown";
        if (!workerMap[cw]) workerMap[cw] = { name: cw, district: dist, count: 0 };
        workerMap[cw].count++;
      });
      return Object.values(workerMap).sort((a, b) => b.count - a.count);
    }
    if (type === "district") {
      return allServices.filter(s => String(s.district || "") === topDistrict);
    }
    return [];
  }, [type, allServices, householdCwMap, topDistrict]);

  // ── Apply search
  const filteredRecords = useMemo(() => {
    if (!searchQuery) return rawRecords;
    const q = searchQuery.toLowerCase();
    if (type === "caseworkers") {
      return (rawRecords as any[]).filter((r: any) =>
        r.name.toLowerCase().includes(q) || r.district.toLowerCase().includes(q)
      );
    }
    return (rawRecords as any[]).filter((s: any) => {
      const hhId = String(s.household_id || s.hh_id || "").toLowerCase();
      const cw = String(
        s.caseworker_name || s.caseworkerName || s.cwac_member_name || s.caseworker ||
        householdCwMap[String(s.household_id || s.hh_id || "")] || ""
      ).toLowerCase();
      const dist = String(s.district || "").toLowerCase();
      return hhId.includes(q) || cw.includes(q) || dist.includes(q);
    });
  }, [rawRecords, searchQuery, type, householdCwMap]);

  const handleExport = () => {
    if (!filteredRecords.length) return;
    if (type === "caseworkers") {
      const headers = ["Caseworker", "District", "Total Services"];
      const rows = (filteredRecords as any[]).map(r => [r.name, r.district, r.count]);
      downloadCsv(headers, rows, `ECAP_Caseworkers_${new Date().toISOString().split("T")[0]}.csv`);
    } else {
      const headers = ["Household ID", "Caseworker", "Service Date", "District", "Type"];
      const rows = (filteredRecords as any[]).map(s => {
        const hhId = String(s.household_id || s.hh_id || "N/A");
        const cw =
          s.caseworker_name ||
          s.caseworkerName ||
          s.cwac_member_name ||
          s.caseworker ||
          householdCwMap[hhId] ||
          "N/A";
        const sType = s.vca_id || s.child_id ? "VCA" : hhId !== "N/A" ? "Household" : "Caregiver";
        return [hhId, cw, s.service_date || s.visit_date || "N/A", s.district || "N/A", sType];
      });
      downloadCsv(headers, rows, `ECAP_${type}_${new Date().toISOString().split("T")[0]}.csv`);
    }
    toast.success(`Exported ${filteredRecords.length} records`);
  };

  const viewConfig = VIEW_TYPES[type] || VIEW_TYPES.services;
  const Icon = viewConfig.icon;

  return (
    <DashboardLayout subtitle={`Caseworkers – ${viewConfig.label}`}>
      <div className="space-y-6 pb-20">
        {/* ── Banner ── */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg">
          <div className="relative bg-gradient-to-r from-green-800 via-emerald-600 to-teal-500 p-6 lg:p-8">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Button
                    onClick={() => navigate("/caseworkers")}
                    variant="outline"
                    size="sm"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm h-8"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                  </Button>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className={cn("p-2 rounded-xl bg-white/20", viewConfig.bg)}>
                    <Icon className={cn("h-5 w-5", viewConfig.color)} />
                  </div>
                  <h1 className="text-3xl font-black text-white lg:text-4xl leading-tight">
                    {viewConfig.label}
                  </h1>
                </div>
                <p className="mt-2 text-white/70 text-sm font-medium">{viewConfig.description}</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-white/70 text-sm font-medium">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    {filteredRecords.length.toLocaleString()} {type === "caseworkers" ? "caseworkers" : "records"}
                  </span>
                  {type === "district" && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      District: {topDistrict}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                {user?.description !== "District User" && (
                  <Select
                    value={selectedDistrict}
                    onValueChange={setSelectedDistrict}
                  >
                    <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white font-bold h-10 backdrop-blur-sm">
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Districts</SelectItem>
                      {districts.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Table Card ── */}
        <GlowCard className="overflow-hidden border-slate-200">
          <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/30 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  {viewConfig.label}
                  <span className="ml-2 text-sm font-medium text-slate-400">
                    ({filteredRecords.length.toLocaleString()})
                  </span>
                </CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
                  {viewConfig.description}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-full md:w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={type === "caseworkers" ? "Search caseworker or district..." : "Search by HH ID, caseworker, district..."}
                    className="pl-9 bg-white border-slate-200 h-9 text-sm font-medium rounded-xl"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleExport}
                  disabled={filteredRecords.length === 0}
                  variant="outline"
                  size="sm"
                  className="h-9 font-bold text-xs border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 border-b">
                  <TableRow>
                    {type === "caseworkers" ? (
                      <>
                        <TableHead className="font-bold text-[10px] tracking-widest text-slate-400 pl-8 h-12 uppercase">#</TableHead>
                        <TableHead className="font-bold text-[10px] tracking-widest text-slate-400 h-12 uppercase">Caseworker</TableHead>
                        <TableHead className="font-bold text-[10px] tracking-widest text-slate-400 h-12 uppercase">District</TableHead>
                        <TableHead className="font-bold text-[10px] tracking-widest text-slate-400 text-right pr-8 h-12 uppercase">Total Services</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="font-bold text-[10px] tracking-widest text-slate-400 pl-8 h-12 uppercase">Caseworker</TableHead>
                        <TableHead className="font-bold text-[10px] tracking-widest text-slate-400 h-12 uppercase">Household ID</TableHead>
                        <TableHead className="font-bold text-[10px] tracking-widest text-slate-400 h-12 uppercase">Service Date</TableHead>
                        <TableHead className="font-bold text-[10px] tracking-widest text-slate-400 text-right pr-8 h-12 uppercase">District</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4}><TableSkeleton rows={8} columns={4} /></TableCell>
                    </TableRow>
                  ) : filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center text-slate-400 font-medium">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : type === "caseworkers" ? (
                    (filteredRecords as any[]).map((r, i) => (
                      <TableRow
                        key={i}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                        onClick={() => navigate("/profile/caseworker-details", { state: { name: r.name } })}
                      >
                        <TableCell className="pl-8 py-4 text-slate-400 font-bold text-sm">{i + 1}</TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-full font-black text-xs shadow-sm shrink-0",
                              i === 0 ? "bg-amber-100 text-amber-700 ring-2 ring-amber-200" :
                                i === 1 ? "bg-slate-200 text-slate-700 ring-2 ring-slate-300" :
                                  i === 2 ? "bg-orange-100 text-orange-700 ring-2 ring-orange-200" :
                                    "bg-emerald-50 text-emerald-700"
                            )}>
                              {r.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900 text-sm">{r.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-medium">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {r.district}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Badge variant="outline" className="text-[10px] font-black border-emerald-100 bg-emerald-50 text-emerald-700">
                            {r.count.toLocaleString()} services
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    (filteredRecords as any[]).map((s, i) => {
                      const hhId = String(s.household_id || s.hh_id || "N/A");
                      const cw =
                        s.caseworker_name ||
                        s.caseworkerName ||
                        s.cwac_member_name ||
                        s.caseworker ||
                        householdCwMap[hhId] ||
                        "N/A";
                      return (
                        <TableRow
                          key={i}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                          onClick={() => navigate("/profile/caseworker-details", { state: { name: cw } })}
                        >
                          <TableCell className="pl-8 py-5">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-sm">{cw}</span>
                              <span className="text-[10px] text-slate-400 font-bold">Case Worker</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-600">{hhId}</TableCell>
                          <TableCell className="text-xs font-bold text-slate-500">
                            {s.service_date || s.visit_date || "N/A"}
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
          </CardContent>
        </GlowCard>
      </div>
    </DashboardLayout>
  );
};

export default CaseworkerRegister;
