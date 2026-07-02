import { useState, useMemo, useEffect } from "react";
import {
  RefreshCcw, AlertCircle, Users,
  TrendingUp, Info, Activity, MapPin, Download, X,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { getHTSRegisterByDistrict } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useFyFilter } from "@/context/FyFilterContext";
import { toTitleCase } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { parseISO, isAfter, subDays } from "date-fns";
import { useEffectiveDistrict } from "@/hooks/useEffectiveDistrict";

const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();

const isPositiveRecord = (record: any) => {
  const value = normalizeText(
    record.hiv_result ||
    record.hiv_status ||
    record.test_result ||
    record.result ||
    record.test_outcome ||
    record.outcome
  );
  return [
    "positive",
    "reactive",
    "reactive positive",
    "hiv positive",
    "pos",
    "posi",
    "1",
    "yes",
    "true",
  ].some((token) => value.includes(token));
};

const hasArtInitiation = (record: any) => {
  const value = normalizeText(
    record.art_date ||
    record.art_date_initiated ||
    record.art_initiated_date ||
    record.art_start_date ||
    record.date_started_art ||
    record.on_art_date ||
    record.art_date_started
  );
  return Boolean(value) && !["n/a", "na", "none", "null", "undefined", "0", "no", "false"].includes(value);
};

const pickCaseworker = (record: any) =>
  String(
    record.caseworker_name ||
    record.caseworker ||
    record.cwac_member_name ||
    record.assigned_caseworker ||
    record.provider ||
    record.worker_name ||
    "Unknown"
  ).trim();

const pickFacility = (record: any) =>
  String(
    record.health_facility ||
    record.health_facility_name ||
    record.facility ||
    record.facility_name ||
    record.hf_name ||
    "Unknown Facility"
  ).trim();


const HTSRegister = () => {
  const navigate = useNavigate();
  const { user }          = useAuth();
  const { district: initialDistrict, isRestrictedToDistrict, availableDistricts, isAdmin, isProvinceUser, province: userProvince } = useEffectiveDistrict();
  const isProvincialUser = isProvinceUser;
  const lockedDistrict = isRestrictedToDistrict && user?.location ? user.location : null;

  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    lockedDistrict ?? (isAdmin ? "All Districts" : "All Districts")
  );

  // SECURITY: Re-enforce district lock on user change (e.g. token refresh)
  // Intentionally omit selectedDistrict from deps to avoid infinite loop
  useEffect(() => {
    if (lockedDistrict && selectedDistrict !== lockedDistrict) {
      setSelectedDistrict(lockedDistrict);
    } else if (initialDistrict && selectedDistrict === "All Districts" && !lockedDistrict) {
      setSelectedDistrict(initialDistrict);
    }
  }, [lockedDistrict, initialDistrict, selectedDistrict]);

  // FY filter
  const { resolved: fy } = useFyFilter();
  const fyArg = fy.fromDate && fy.toDate ? { from: fy.fromDate, to: fy.toDate } : undefined;
  const fyKey = fy.mode === "all" ? "all" : `${fy.fromDate ?? ""}_${fy.toDate ?? ""}`;

  // Single HTS fetch (all records, filtered client-side)
  // Pass fyArg so the API respects the fiscal year selection.
  // District filtering is done client-side so the dropdown stays in sync.
  const htsQuery = useQuery({
    queryKey: ["hts-register", selectedDistrict, fyKey],
    queryFn:  () => getHTSRegisterByDistrict(selectedDistrict, fyArg),
    staleTime: 1000 * 60 * 10,
    gcTime:    1000 * 60 * 60,
    retry: 1,
  });

  // District list derived from HTS data (single source of truth)
  // Eliminates the separate householdsListQuery and prevents drift between
  // the dropdown options and the actual data being filtered.
  const discoveredDistrictsMap = useMemo(() => {
    const groups = new Map<string, string[]>();
    if (!htsQuery.data) return groups;

    (htsQuery.data as any[]).forEach((h: any) => {
      if (isProvincialUser && userProvince && h.province !== userProvince) return;
      const raw: string | undefined = h.district;
      if (!raw) return;

      const normalized = toTitleCase(raw.trim());
      if (!groups.has(normalized)) groups.set(normalized, []);
      const variants = groups.get(normalized)!;
      if (!variants.includes(raw)) variants.push(raw);
    });

    return groups;
  }, [htsQuery.data, isProvincialUser, userProvince]);

  const discoveredDistricts = useMemo(
    () => Array.from(discoveredDistrictsMap.keys()).sort(),
    [discoveredDistrictsMap]
  );

  // Filter all records by selected district / province
  // Both selectedDistrict AND discoveredDistrictsMap are in deps so the
  // filter re-runs whenever either changes.
  const allRecords = useMemo(() => {
    const rawData: any[] = (htsQuery.data ?? []) as any[];

    return rawData
      .filter((r) => {
        if (isProvincialUser && userProvince && r.province !== userProvince) {
          return false;
        }

        // District filter
        if (selectedDistrict !== "All Districts") {
          const variants =
            discoveredDistrictsMap.get(selectedDistrict) ?? [selectedDistrict];
          const rDist = String(r.district ?? "").trim();
          if (!variants.includes(rDist)) return false;
        }

        return true;
      })
      .sort((a: any, b: any) => {
        const idA = String(a.household_id || a.vca_id || a.id || "");
        const idB = String(b.household_id || b.vca_id || b.id || "");
        return idB.localeCompare(idA);
      });
  }, [
    htsQuery.data,
    selectedDistrict,
    discoveredDistrictsMap,
    isProvincialUser,
    userProvince,
  ]);

  // Summary stats
  const dashboardStats = useMemo(() => {
    if (!allRecords.length) return null;

    let pos       = 0;
    let unlinked  = 0;
    let pending   = 0;
    let newIntakes = 0;
    const workers = new Set<string>();
    const weekAgo = subDays(new Date(), 7);

    allRecords.forEach((r) => {
      const res   = String(r.hiv_result || r.hiv_status || "").toLowerCase();
      const isPos = isPositiveRecord(r);
      const hasArt = hasArtInitiation(r);
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

    return {
      total:           allRecords.length,
      positives:       pos,
      unlinked,
      pending,
      newIntakes,
      activeWorkers:   workers.size,
      positivityRate:  Math.round((pos / allRecords.length) * 100) || 0,
    };
  }, [allRecords]);

  // Nationwide cache
  // Only cache when viewing all districts AND current FY selection.
  // Invalidate when FY changes so stale stats don't bleed through.
  const cacheKey = `ecap_cache_nationwide_hts_${fyKey}`;

  const [cachedNationwideStats, setCachedNationwideStats] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(cacheKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Persist nationwide stats when available; clear on FY change
  useEffect(() => {
    if (selectedDistrict === "All Districts" && dashboardStats && dashboardStats.total > 0) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(dashboardStats));
        setCachedNationwideStats(dashboardStats);
      } catch { /* storage quota */ }
    }
  }, [dashboardStats, selectedDistrict, cacheKey]);

  // Reload cache from storage when FY key changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(cacheKey);
      setCachedNationwideStats(saved ? JSON.parse(saved) : null);
    } catch {
      setCachedNationwideStats(null);
    }
  }, [cacheKey]);

  const displayStats =
    selectedDistrict === "All Districts"
      ? dashboardStats || cachedNationwideStats
      : dashboardStats;

  // Chart data
  const facilityData = useMemo(() => {
    const facilities = new Map<string, { name: string; positive: number; linked: number }>();

    allRecords.forEach((r) => {
      const facility = pickFacility(r);
      if (!facilities.has(facility)) {
        facilities.set(facility, { name: facility, positive: 0, linked: 0 });
      }
      const data   = facilities.get(facility)!;
      const isPos  = isPositiveRecord(r);
      const hasArt = hasArtInitiation(r);

      if (isPos) {
        data.positive++;
        if (hasArt) data.linked++;
      }
    });

    return Array.from(facilities.values())
      .filter((f) => f.positive > 0)
      .sort((a, b) => b.positive - a.positive)
      .slice(0, 10);
  }, [allRecords]);

  const caseworkerData = useMemo(() => {
    const workers = new Map<string, { name: string; positive: number }>();

    allRecords.forEach((r) => {
      const worker = pickCaseworker(r);
      if (!worker || worker === "—") return;
      if (!workers.has(worker)) workers.set(worker, { name: worker, positive: 0 });

      const data  = workers.get(worker)!;
      const isPos = isPositiveRecord(r);
      if (isPos) data.positive++;
    });

    return Array.from(workers.values())
      .filter((w) => w.positive > 0)
      .sort((a, b) => b.positive - a.positive)
      .slice(0, 10);
  }, [allRecords]);

  // CSV Exports
  const handleExportFacility = () => {
    if (!facilityData.length) return;
    const dateStr = format(new Date(), "yyyy-MM-dd");
    downloadCsv(
      ["Facility", "Positives", "Linked to ART"],
      facilityData.map((f) => [f.name, String(f.positive), String(f.linked)]),
      `hts_facility_linkage_${selectedDistrict}_${dateStr}.csv`
    );
  };

  const handleExportCaseworker = () => {
    if (!caseworkerData.length) return;
    const dateStr = format(new Date(), "yyyy-MM-dd");
    downloadCsv(
      ["Caseworker", "Positives Found"],
      caseworkerData.map((w) => [w.name, String(w.positive)]),
      `hts_caseworker_yield_${selectedDistrict}_${dateStr}.csv`
    );
  };

  // Render
  return (
    <DashboardLayout subtitle="HTS Register">

      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-emerald-200/60 bg-white/70 backdrop-blur-xl shadow-[0_30px_80px_-50px_rgba(15,118,110,0.55)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_30%,rgba(244,63,94,0.15),transparent_45%)]" />
        <div className="pointer-events-none absolute -top-40 -left-32 h-[24rem] w-[24rem] rounded-full bg-emerald-300/40 blur-[110px] animate-pulse [animation-duration:6s]" />
        <div className="pointer-events-none absolute -bottom-32 right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-rose-300/30 blur-[120px] animate-pulse [animation-duration:8s] [animation-delay:-3s]" />

        <div className="relative z-10 flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                HTS register
              </span>
              <span className="text-slate-400 text-[11px]">·</span>
              <span className="text-[11px] text-slate-600">
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </span>
              <Badge variant="outline" className="ml-1 gap-1 border-emerald-200 bg-emerald-50/80 text-[10px] text-emerald-700">
                <Activity className="h-3 w-3" /> {(displayStats?.total || 0).toLocaleString()} tests
              </Badge>

              {/* Active district chip */}
              {selectedDistrict !== "All" && (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-200 bg-emerald-50/70 text-[10px] text-emerald-700 cursor-pointer hover:border-emerald-400 hover:bg-emerald-100 transition-colors"
                  onClick={() => !lockedDistrict && setSelectedDistrict("All")}
                >
                  <MapPin className="h-3 w-3" />
                  {selectedDistrict}
                  {!lockedDistrict && <X className="h-2.5 w-2.5 ml-0.5 opacity-60" />}
                </Badge>
              )}
            </div>

            <h1 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-rose-700 bg-clip-text text-transparent">
                HIV Testing &amp; Services
              </span>
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              Testing outcomes, linkage to ART, and contact tracing across the cohort.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <Select
              value={selectedDistrict}
              onValueChange={(val) => {
                if (lockedDistrict) return; // District Users cannot change
                setSelectedDistrict(val);
              }}
              disabled={!!lockedDistrict}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-9 bg-white/80 border-slate-200 backdrop-blur-md text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <SelectValue
                    placeholder={htsQuery.isLoading ? "Loading…" : "Select District"}
                  />
                </div>
              </SelectTrigger>
              <SelectContent>
                {/* Hide "All Districts" for locked users */}
                {!lockedDistrict && (
                  <SelectItem value="All">All Districts</SelectItem>
                )}
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

      <Tabs defaultValue="overview" className="w-full">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div className="-mx-1 overflow-x-auto px-1 max-w-full">
            <TabsList className="inline-flex h-9 items-center gap-1 rounded-xl bg-slate-100/80 p-1 backdrop-blur-sm border border-slate-200/50 whitespace-nowrap">
              <TabsTrigger value="overview" className="h-7 px-4 rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="register" className="h-7 px-4 rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                Register
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="p-4 rounded-xl border bg-white shadow-sm border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><AlertCircle className="h-4 w-4" /></div>
                <span className="text-xs font-bold tracking-wider text-muted-foreground">Positives not on ART</span>
              </div>
              <div className="flex items-baseline gap-2"><span className="text-2xl font-black text-slate-900">{displayStats?.unlinked || 0}</span></div>
            </div>
            <div className="p-4 rounded-xl border bg-white shadow-sm border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Info className="h-4 w-4" /></div>
                <span className="text-xs font-bold tracking-wider text-muted-foreground">Pending Outcomes</span>
              </div>
              <div className="flex items-baseline gap-2"><span className="text-2xl font-black text-slate-900">{displayStats?.pending || 0}</span></div>
            </div>
            <div className="p-4 rounded-xl border bg-white border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Users className="h-4 w-4" /></div>
                <span className="text-xs font-bold tracking-wider text-muted-foreground">Total HTS Register</span>
              </div>
              <div className="flex items-baseline gap-2"><span className="text-2xl font-black text-slate-900">{displayStats?.total || 0}</span></div>
            </div>
            <div className="p-4 rounded-xl border bg-white shadow-sm border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp className="h-4 w-4" /></div>
                <span className="text-xs font-bold tracking-wider text-muted-foreground">New Positives</span>
              </div>
              <div className="flex items-baseline gap-2"><span className="text-2xl font-black text-slate-900">{displayStats?.newIntakes || 0}</span></div>
            </div>
          </div>
        </TabsContent>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <GlowCard className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Facility Linkage Gap</CardTitle>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider">Comparing positives vs ART initiation</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportFacility} disabled={facilityData.length === 0} className="h-8 px-3 text-xs font-bold border-slate-200 ml-auto">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="h-[250px] p-0 pb-4">
              {facilityData.length === 0 ? <div className="flex h-full items-center justify-center px-6 text-center text-xs font-semibold text-slate-400">No facility linkage data found for the current filters.</div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={facilityData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: "#94a3b8" }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} labelStyle={{ fontWeight: 800, color: "#0f172a", marginBottom: "4px" }} />
                    <Bar dataKey="positive" name="Positives" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="linked" name="Linked" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </GlowCard>

          <GlowCard className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Positive Yield by Caseworker</CardTitle>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider">Top 10 performing staff by raw count</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportCaseworker} disabled={caseworkerData.length === 0} className="h-8 px-3 text-xs font-bold border-slate-200 ml-auto">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="h-[250px] p-0 pb-4">
              {caseworkerData.length === 0 ? <div className="flex h-full items-center justify-center px-6 text-center text-xs font-semibold text-slate-400">No caseworker yield data found for the current filters.</div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={caseworkerData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: "#475569" }} width={80} />
                    <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                    <Bar dataKey="positive" name="Positives Found" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </GlowCard>
        </div>

        <TabsContent value="register" className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-xl shadow-sm p-4 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">HTS Register</h2>
                <p className="text-xs text-slate-500">Testing outcomes, linkage to ART, and contact tracing across the cohort.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">#</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">District</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Facility</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">HIV Result</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">ART Date</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Caseworker</th>
                  </tr>
                </thead>
                <tbody>
                  {allRecords.slice(0, 50).map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.district || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.health_facility || item.facility || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.hiv_result || item.hiv_status || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.art_date || item.art_date_initiated || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.caseworker_name || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allRecords.length === 0 && (
                <div className="py-10 text-center text-xs font-semibold text-slate-400">No records found for the current filters.</div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

    </DashboardLayout>
  );
};

export default HTSRegister;
