import { useState, useMemo, useEffect } from "react";
import { RefreshCcw, ChevronRight, AlertCircle, Users, TrendingUp, Info, Activity, ShieldAlert, MapPin, Download } from "lucide-react";
import { downloadCsv } from "@/lib/exportUtils";
import { format } from "date-fns";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getHTSRegisterByDistrict, getHouseholdsByDistrict } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toTitleCase, cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { parseISO, isAfter, subDays } from "date-fns";






const HTSRegister = () => {
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

  // SECURITY: Enforce district lock for District Users
  useEffect(() => {
    if (isDistrictUser && user?.location && selectedDistrict !== user.location) {
      setSelectedDistrict(user.location);
    }
  }, [user, selectedDistrict]);

  // Discover districts
  const dashboardDistrict = user?.location || "All";
  const householdsListQuery = useQuery({
    queryKey: ["districts-discovery", dashboardDistrict],
    queryFn: () => getHouseholdsByDistrict(dashboardDistrict === "All" ? "" : dashboardDistrict),
    staleTime: 1000 * 60 * 5,
  });

  const discoveredDistrictsMap = useMemo(() => {
    const groups = new Map<string, string[]>();
    if (householdsListQuery.data) {
      (householdsListQuery.data as any[]).forEach((h: any) => {
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

  const discoveredDistricts = useMemo(() => {
    return Array.from(discoveredDistrictsMap.keys()).sort();
  }, [discoveredDistrictsMap]);

  // HTS data query
  const htsQuery = useQuery({
    queryKey: ["hts-register", "All"],
    queryFn: () => getHTSRegisterByDistrict("*"),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    retry: 1,
  });

  // PERSISTENCE: Restore previous nationwide counts
  const [cachedNationwideStats, setCachedNationwideStats] = useState<any>(() => {
    const saved = localStorage.getItem("ecap_cache_nationwide_hts");
    return saved ? JSON.parse(saved) : null;
  });

  const allRecords = useMemo(() => {
    const rawData = (htsQuery.data ?? []) as any[];
    if (selectedDistrict === "All") {
      if (isProvincialUser && userProvince) {
        return rawData.filter(record => record.province === userProvince);
      }
      return rawData;
    }

    const selectedVariants = discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict];
    return rawData.filter(r => {
      if (isProvincialUser && userProvince && r.province !== userProvince) return false;
      const rDist = String(r.district || "");
      return selectedVariants.includes(rDist);
    }).sort((a: any, b: any) => {
      const idA = a.household_id || a.vca_id || a.id || "";
      const idB = b.household_id || b.vca_id || b.id || "";
      return String(idB).localeCompare(String(idA));
    });
  }, [htsQuery.data, selectedDistrict, discoveredDistrictsMap]);

  const dashboardStats = useMemo(() => {
    if (!allRecords.length) return null;

    let pos = 0;
    let unlinked = 0;
    let pending = 0;
    let newIntakes = 0;
    const workers = new Set<string>();
    const weekAgo = subDays(new Date(), 7);

    allRecords.forEach(r => {
      const res = String(r.hiv_result || r.hiv_status || "").toLowerCase();
      const isPos = res.includes("positive") || res.includes("reactive");
      const hasArt = r.art_date || r.art_date_initiated;
      const dateCreated = r.date_created ? parseISO(r.date_created) : null;

      if (isPos) {
        pos++;
        if (!hasArt) unlinked++;
        if (dateCreated && isAfter(dateCreated, weekAgo)) newIntakes++;
      }

      if (!res || res === "unknown" || res === "—") pending++;

      const worker = r.caseworker_name;
      if (worker && worker !== "—") workers.add(worker);
    });

    const result = {
      total: allRecords.length,
      positives: pos,
      unlinked,
      pending,
      newIntakes,
      activeWorkers: workers.size,
      positivityRate: Math.round((pos / allRecords.length) * 100) || 0
    };

    if (selectedDistrict === "All" && result.total > 0) {
      localStorage.setItem("ecap_cache_nationwide_hts", JSON.stringify(result));
    }
    return result;
  }, [allRecords, selectedDistrict]);

  const displayStats = selectedDistrict === "All" ? (dashboardStats || cachedNationwideStats) : dashboardStats;
  const isRefreshing = htsQuery.isFetching && displayStats?.total > 0;

  // Chart Data Preparation
  const facilityData = useMemo(() => {
    const facilities = new Map<string, { name: string; positive: number; linked: number }>();
    allRecords.forEach(r => {
      const facility = String(r.health_facility || "Unknown Facility");
      if (!facilities.has(facility)) {
        facilities.set(facility, { name: facility, positive: 0, linked: 0 });
      }
      const data = facilities.get(facility)!;
      const res = String(r.hiv_result || r.hiv_status || "").toLowerCase();
      const isPos = res.includes("positive") || res.includes("reactive");
      const hasArt = r.art_date || r.art_date_initiated;

      if (isPos) {
        data.positive++;
        if (hasArt) data.linked++;
      }
    });
    return Array.from(facilities.values())
      .filter(f => f.positive > 0)
      .sort((a, b) => b.positive - a.positive)
      .slice(0, 10);
  }, [allRecords]);

  const caseworkerData = useMemo(() => {
    const workers = new Map<string, { name: string; positive: number }>();
    allRecords.forEach(r => {
      const worker = String(r.caseworker_name || "Unknown").trim();
      if (worker === "—" || worker === "") return;
      if (!workers.has(worker)) {
        workers.set(worker, { name: worker, positive: 0 });
      }
      const data = workers.get(worker)!;
      const res = String(r.hiv_result || r.hiv_status || "").toLowerCase();
      const isPos = res.includes("positive") || res.includes("reactive");

      if (isPos) data.positive++;
    });
    return Array.from(workers.values())
      .filter(w => w.positive > 0)
      .sort((a, b) => b.positive - a.positive)
      .slice(0, 10);
  }, [allRecords]);

  const handleExportFacility = () => {
    if (!facilityData.length) return;
    const dateStr = format(new Date(), "yyyy-MM-dd");
    downloadCsv(
      ["Facility", "Positives", "Linked to ART"],
      facilityData.map(f => [f.name, String(f.positive), String(f.linked)]),
      `hts_facility_linkage_${selectedDistrict}_${dateStr}.csv`
    );
  };

  const handleExportCaseworker = () => {
    if (!caseworkerData.length) return;
    const dateStr = format(new Date(), "yyyy-MM-dd");
    downloadCsv(
      ["Caseworker", "Positives Found"],
      caseworkerData.map(w => [w.name, String(w.positive)]),
      `hts_caseworker_yield_${selectedDistrict}_${dateStr}.csv`
    );
  };

  return (
    <DashboardLayout subtitle="HTS Register">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-emerald-200/60 bg-white/70 backdrop-blur-xl shadow-[0_30px_80px_-50px_rgba(15,118,110,0.55)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_30%,rgba(244,63,94,0.15),transparent_45%)]" />
        <div className="pointer-events-none absolute -top-40 -left-32 h-[24rem] w-[24rem] rounded-full bg-emerald-300/40 blur-[110px] animate-pulse [animation-duration:6s]" />
        <div className="pointer-events-none absolute -bottom-32 right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-rose-300/30 blur-[120px] animate-pulse [animation-duration:8s] [animation-delay:-3s]" />

        <div className="relative z-10 flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">HTS register</span>
              <span className="text-slate-400 text-[11px]">·</span>
              <span className="text-[11px] text-slate-600">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
              <Badge variant="outline" className="ml-1 gap-1 border-emerald-200 bg-emerald-50/80 text-[10px] text-emerald-700">
                <Activity className="h-3 w-3" /> {(displayStats?.total || 0).toLocaleString()} tests
              </Badge>
              <Badge variant="outline" className="gap-1 border-slate-200 bg-white/80 text-[10px] text-slate-600 backdrop-blur-md">
                <MapPin className="h-3 w-3" /> {selectedDistrict}
              </Badge>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-rose-700 bg-clip-text text-transparent">
                HIV Testing &amp; Services
              </span>
            </h1>
            <p className="mt-1 text-xs text-slate-600">Testing outcomes, linkage to ART, and contact tracing across the cohort.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <Select
              value={selectedDistrict}
              onValueChange={setSelectedDistrict}
              disabled={isDistrictUser}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-9 bg-white/80 border-slate-200 backdrop-blur-md text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <SelectValue placeholder={householdsListQuery.isLoading ? "Loading…" : "Select District"} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Districts</SelectItem>
                {discoveredDistricts.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => htsQuery.refetch()}
              className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-700/20 transition-all hover:from-emerald-700 hover:to-teal-700"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${htsQuery.isFetching ? "animate-spin" : ""}`} />
              Sync
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div
          onClick={() => navigate(`/registers/hts-risk?type=unlinked&district=${selectedDistrict}`)}
          className={cn(
            "p-4 rounded-xl border bg-white shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-95 border-slate-100"
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <AlertCircle className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold tracking-wider text-muted-foreground">Positives not on ART</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{displayStats?.unlinked || 0}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Click to view</p>
        </div>

        <div
          onClick={() => navigate(`/registers/hts-risk?type=pending&district=${selectedDistrict}`)}
          className={cn(
            "p-4 rounded-xl border bg-white shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-95 border-slate-100"
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Info className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold tracking-wider text-muted-foreground">Pending Outcomes</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{displayStats?.pending || 0}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Click to view</p>
        </div>

        <div
          onClick={() => navigate(`/registers/hts-risk?type=all&district=${selectedDistrict}`)}
          className="p-4 rounded-xl border bg-white border-slate-100 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-95"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold tracking-wider text-muted-foreground">Total HTS Register</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{displayStats?.total || 0}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Click to view</p>
        </div>

        <div
          onClick={() => navigate(`/registers/hts-risk?type=new&district=${selectedDistrict}`)}
          className={cn(
            "p-4 rounded-xl border bg-white shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-95 border-slate-100"
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold tracking-wider text-muted-foreground">New Positives</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{displayStats?.newIntakes || 0}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Click to view</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <GlowCard className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Facility Linkage Gap</CardTitle>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider">Comparing positives vs ART initiation</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportFacility}
              disabled={facilityData.length === 0}
              className="h-8 px-3 text-xs font-bold border-slate-200 ml-auto"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent className="h-[250px] p-0 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                />
                <Bar dataKey="positive" name="Positives" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="linked" name="Linked" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </GlowCard>

        <GlowCard className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Positive Yield by Caseworker</CardTitle>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider">Top 10 performing staff by raw count</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCaseworker}
              disabled={caseworkerData.length === 0}
              className="h-8 px-3 text-xs font-bold border-slate-200 ml-auto"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent className="h-[250px] p-0 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={caseworkerData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#475569' }}
                  width={80}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="positive" name="Positives Found" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </GlowCard>
      </div>

      {/* Redirect hint or CTA can go here if needed */}
    </DashboardLayout>
  );
};

export default HTSRegister;
