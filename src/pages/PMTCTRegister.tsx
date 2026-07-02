import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { Users, Search, Download, Activity, Calendar, MapPin, RefreshCw, TrendingUp, AlertCircle, HeartPulse, Baby } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import LoadingDots from "@/components/aceternity/LoadingDots";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlowCard from "@/components/aceternity/GlowCard";
import { useFyFilter } from "@/context/FyFilterContext";
import { useEffectiveDistrict } from "@/hooks/useEffectiveDistrict";
import { getPmtctChildRegisterByDistrict, getPmtctMotherRegisterByDistrict, clearApiCache } from "@/lib/api";
import { ALL_DISTRICTS } from "@/constants/districts";
import { keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const pickValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") return String(value);
  }
  return "N/A";
};

const pickPmctctId = (record: Record<string, unknown>) =>
  pickValue(record, [
    "pmtct_id",
    "pmtctid",
    "ecap_id",
    "ecapid",
    "mother_id",
    "motherid",
    "client_number",
    "client_no",
    "ca_id",
    "caid",
    "household_id",
    "householdId",
    "unique_id",
    "uid",
    "id",
  ]);

const dateToTime = (date: any) => {
  if (!date || date === "N/A") return 0;
  const d = new Date(date);
  if (!Number.isNaN(d.getTime())) return d.getTime();
  const parts = String(date).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return parts ? new Date(`${parts[3]}-${parts[2]}-${parts[1]}`).getTime() : 0;
};

const PMTCTRegister = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { district: initialDistrict, isRestrictedToDistrict, availableDistricts, isAdmin } = useEffectiveDistrict();
  const { resolved: fy } = useFyFilter();
  const fyArg = fy.fromDate && fy.toDate ? { from: fy.fromDate, to: fy.toDate } : undefined;

  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict || (isAdmin ? "All Districts" : ""));
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const deferredSearch = useDeferredValue(searchQuery);

  useEffect(() => {
    if (initialDistrict) setSelectedDistrict(initialDistrict);
    else if (isAdmin && !selectedDistrict) setSelectedDistrict("All Districts");
  }, [initialDistrict, isAdmin, selectedDistrict]);

  const districtsToFetch = useMemo(() => {
    if (selectedDistrict !== "All Districts") return [selectedDistrict];
    const actual = availableDistricts.filter((d) => d !== "All Districts");
    return actual.length > 0 ? actual : ALL_DISTRICTS;
  }, [selectedDistrict, availableDistricts]);

  const childQueries = useQueries({
    queries: districtsToFetch.map((d) => ({
      queryKey: ["pmtct", "child-register", d, fy.mode, fy.fromDate, fy.toDate],
      queryFn: () => getPmtctChildRegisterByDistrict(d, fyArg),
      placeholderData: keepPreviousData,
      retry: 1,
    })),
  });

  const motherQueries = useQueries({
    queries: districtsToFetch.map((d) => ({
      queryKey: ["pmtct", "mother-register", d, fy.mode, fy.fromDate, fy.toDate],
      queryFn: () => getPmtctMotherRegisterByDistrict(d, fyArg),
      placeholderData: keepPreviousData,
      retry: 1,
    })),
  });

  const isLoading = childQueries.some((q) => q.isLoading) || motherQueries.some((q) => q.isLoading);

  const rows = useMemo(() => {
    const infants = childQueries.flatMap((q) => (q.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: pickPmctctId(r),
      householdId: pickValue(r, ["ca_id", "child_id", "unique_id"]),
      hivStatus: pickValue(r, ["test_result_at_birth", "infant_hiv_status", "hiv_status"]),
      facility: pickValue(r, ["facility", "facility_name"]),
      district: pickValue(r, ["district", "district_name"]),
      type: "Infant (HEI)" as const,
      date: pickValue(r, ["dbs_at_birth_actual_date", "dbs_at_birth_due_date", "date_tested"]),
      raw: r,
    }));
    const mothers = motherQueries.flatMap((q) => (q.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: pickPmctctId(r),
      householdId: pickValue(r, ["ecap_id", "household_id", "hh_id"]),
      hivStatus: pickValue(r, ["result_of_hiv_test", "result_r_nr", "hiv_status"]),
      facility: pickValue(r, ["facility", "facility_name"]),
      district: pickValue(r, ["district", "district_name"]),
      type: "Mother" as const,
      date: pickValue(r, ["date_enrolled_pmtct", "date_1st_visit", "date_tested"]),
      raw: r,
    }));

    const combined = [...infants, ...mothers].filter((row) => {
      if (!deferredSearch.trim()) return true;
      const q = deferredSearch.toLowerCase();
      return [row.id, row.householdId, row.facility, row.district, row.hivStatus].join(" ").toLowerCase().includes(q);
    });

    combined.sort((a, b) => dateToTime(b.date) - dateToTime(a.date));
    return combined;
  }, [childQueries, motherQueries, deferredSearch]);

  const stats = useMemo(() => {
    const total = rows.length;
    const infants = rows.filter((r) => r.type === "Infant (HEI)").length;
    const mothers = rows.filter((r) => r.type === "Mother").length;
    const hivPositive = rows.filter((r) => {
      const s = r.hivStatus.toLowerCase();
      return s.includes("positive") || s.includes("reactive") || s === "yes";
    }).length;
    const hivByType = [
      {
        type: "Mothers",
        positive: rows.filter((r) => r.type === "Mother" && /positive|reactive/i.test(r.hivStatus)).length,
        negative: rows.filter((r) => r.type === "Mother" && /negative|non-reactive/i.test(r.hivStatus)).length,
        unknown: rows.filter((r) => r.type === "Mother" && r.hivStatus === "N/A").length,
      },
      {
        type: "Infants (HEI)",
        positive: rows.filter((r) => r.type === "Infant (HEI)" && /positive|reactive/i.test(r.hivStatus)).length,
        negative: rows.filter((r) => r.type === "Infant (HEI)" && /negative|non-reactive/i.test(r.hivStatus)).length,
        unknown: rows.filter((r) => r.type === "Infant (HEI)" && r.hivStatus === "N/A").length,
      },
    ];
    const facilityMap = new Map<string, number>();
    rows.forEach((r) => facilityMap.set(r.facility, (facilityMap.get(r.facility) ?? 0) + 1));
    const byFacility = Array.from(facilityMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([facility, count]) => ({ facility: facility.length > 18 ? `${facility.slice(0, 16)}...` : facility, count }));
    const typeDistribution = [
      { name: "Mothers", value: mothers, color: "#ec4899" },
      { name: "Infants (HEI)", value: infants, color: "#0ea5e9" },
    ].filter((d) => d.value > 0);
    const monthMap = new Map<string, number>();
    rows.forEach((r) => {
      const dt = dateToTime(r.date);
      if (dt) {
        const d = new Date(dt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
      }
    });
    const enrolmentTrend = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([month, count]) => {
      const [y, m] = month.split("-");
      return { month: new Date(Number(y), Number(m) - 1).toLocaleString("en", { month: "short", year: "2-digit" }), enrolments: count };
    });
    return { total, infants, mothers, hivPositive, hivByType, byFacility, typeDistribution, enrolmentTrend };
  }, [rows]);

  const handleSync = async () => {
    await clearApiCache();
    await queryClient.invalidateQueries({ queryKey: ["pmtct"] });
    toast.success("PMTCT data refreshed.");
  };

  const handleExport = () => {
    const headers = ["PMTCT ID", "Type", "HIV Status", "Enrolment Date", "Facility", "District"];
    const exportRows = rows.map((row) => [row.id, row.type, row.hivStatus, row.date, row.facility, row.district]);
    downloadCsv(`pmtct-register-${selectedDistrict.toLowerCase().replace(/\s+/g, "-")}.csv`, headers, exportRows);
  };

  return (
    <DashboardLayout subtitle="PMTCT Register">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-white/70 backdrop-blur-xl shadow-[0_30px_80px_-50px_rgba(15,118,110,0.55)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(16,185,129,0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_30%,rgba(14,165,233,0.15),transparent_45%)]" />
          <div className="relative z-10 flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">PMTCT register</span>
                <Badge variant="outline" className="ml-1 gap-1 border-emerald-200 bg-emerald-50/80 text-[10px] text-emerald-700"><Activity className="h-3 w-3" /> {isLoading ? "—" : stats.total.toLocaleString()} records</Badge>
                <Badge variant="outline" className="gap-1 border-slate-200 bg-white/70 text-[10px] text-slate-600"><MapPin className="h-3 w-3" /> {selectedDistrict}</Badge>
              </div>
              <h1 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-700 bg-clip-text text-transparent">Prevention of mother-to-child transmission</span>
              </h1>
              <p className="mt-1 text-xs text-slate-600">Mother &amp; infant pairs, HIV exposure, and follow-up status.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleSync}><RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} /> Sync data</Button>
              <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
              {!isRestrictedToDistrict && (
                <Select value={selectedDistrict} onValueChange={(val) => setSelectedDistrict(val)}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Districts" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Districts">All Districts</SelectItem>
                    {availableDistricts.filter((d) => d !== "All Districts").map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="bg-slate-100/50 p-1 rounded-xl h-11 w-full max-w-md border border-slate-200">
              <TabsTrigger value="overview" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider"><TrendingUp className="h-3.5 w-3.5 mr-2" />Overview</TabsTrigger>
              <TabsTrigger value="register" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider"><Users className="h-3.5 w-3.5 mr-2" />Register</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: "Total Records", value: stats.total, icon: Users },
                { title: "Infants (HEI)", value: stats.infants, icon: Baby },
                { title: "Mothers", value: stats.mothers, icon: HeartPulse },
                { title: "HIV Positive", value: stats.hivPositive, icon: AlertCircle },
              ].map((card, i) => (
                <div key={i} className="cursor-pointer" onClick={() => setActiveTab("register")}>
                  <GlowCard className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.title}</span>
                      <card.icon className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{isLoading ? <LoadingDots /> : card.value.toLocaleString()}</div>
                  </GlowCard>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <GlowCard className="p-4 h-[340px]">
                <div className="mb-2">
                  <div className="text-sm font-bold text-slate-900">HIV Status by Beneficiary Type</div>
                  <p className="text-[10px] text-slate-400 font-medium">Mothers vs Infants (HEI)</p>
                </div>
                <div className="h-[280px]">{isLoading ? <LoadingDots /> : <ResponsiveContainer width="100%" height="100%"><BarChart data={stats.hivByType}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} /><Tooltip /><Bar dataKey="positive" fill="#f43f5e" radius={[4,4,0,0]} /><Bar dataKey="negative" fill="#10b981" radius={[4,4,0,0]} /><Bar dataKey="unknown" fill="#94a3b8" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>}</div>
              </GlowCard>
              <GlowCard className="p-4 h-[340px]">
                <div className="mb-2">
                  <div className="text-sm font-bold text-slate-900">Records by Facility</div>
                  <p className="text-[10px] text-slate-400 font-medium">Top 8 facilities by caseload</p>
                </div>
                <div className="h-[280px]">{isLoading ? <LoadingDots /> : <ResponsiveContainer width="100%" height="100%"><BarChart layout="vertical" data={stats.byFacility}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" /><XAxis type="number" hide /><YAxis dataKey="facility" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: "#64748b" }} width={120} /><Tooltip /><Bar dataKey="count" fill="#0d9488" radius={[0,4,4,0]} /></BarChart></ResponsiveContainer>}</div>
              </GlowCard>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <GlowCard className="p-4 h-[340px]">
                <div className="mb-2">
                  <div className="text-sm font-bold text-slate-900">Enrolment Trend</div>
                  <p className="text-[10px] text-slate-400 font-medium">Monthly enrolments over last 6 months</p>
                </div>
                <div className="h-[280px]">{isLoading ? <LoadingDots /> : stats.enrolmentTrend.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={stats.enrolmentTrend}><defs><linearGradient id="enrolmentGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} /><stop offset="95%" stopColor="#0d9488" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} /><Tooltip /><Area type="monotone" dataKey="enrolments" stroke="#0d9488" strokeWidth={2} fill="url(#enrolmentGradient)" /></AreaChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-sm text-slate-400">No enrolment date data available</div>}</div>
              </GlowCard>
              <GlowCard className="p-4 h-[340px]">
                <div className="mb-2">
                  <div className="text-sm font-bold text-slate-900">Beneficiary Type Distribution</div>
                  <p className="text-[10px] text-slate-400 font-medium">Mothers vs Infants breakdown</p>
                </div>
                <div className="h-[280px] flex flex-col">{isLoading ? <LoadingDots /> : <>
                  <div className="flex-1 min-h-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.typeDistribution} cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{stats.typeDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
                  <div className="flex items-center justify-center gap-6 pt-2">{stats.typeDistribution.map((entry, i) => <div key={i} className="flex items-center gap-2"><div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} /><span className="text-xs font-bold text-slate-600">{entry.name}</span><span className="text-xs font-bold text-slate-900">{entry.value.toLocaleString()}</span></div>)}</div>
                </>}</div>
              </GlowCard>
            </div>
          </TabsContent>
          <TabsContent value="register" className="space-y-4">
            <GlowCard noHover>
              <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search by ID, HHID or facility..." className="pl-10 h-11 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-[#00a67e] transition-all font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setSearchQuery("")} className="h-10 rounded-xl px-4 text-xs font-bold text-slate-600 border-slate-200">Clear Filters</Button>
                  <Button variant="outline" onClick={handleExport} className="h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all shadow-sm px-4 text-xs uppercase tracking-wider"><Download className="h-4 w-4 mr-2 text-slate-400" />EXPORT CSV</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-sky-50/40">
                    <TableRow className="hover:bg-transparent border-b border-emerald-100/60">
                      <TableHead className="py-4 pl-8 text-[11px] font-bold uppercase tracking-wider text-emerald-800">PMTCT ID</TableHead>
                      <TableHead className="py-4 text-[11px] font-bold uppercase tracking-wider text-emerald-800">Type</TableHead>
                      <TableHead className="py-4 text-[11px] font-bold uppercase tracking-wider text-emerald-800">HIV Status</TableHead>
                      <TableHead className="py-4 text-[11px] font-bold uppercase tracking-wider text-emerald-800">Enrolment Date</TableHead>
                      <TableHead className="py-4 text-[11px] font-bold uppercase tracking-wider text-emerald-800">Facility</TableHead>
                      <TableHead className="py-4 text-right pr-8 text-[11px] font-bold uppercase tracking-wider text-emerald-800">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? <TableRow><TableCell colSpan={6} className="py-24 text-center"><LoadingDots /></TableCell></TableRow> : rows.length === 0 ? <TableRow><TableCell colSpan={6} className="py-24 text-center text-slate-500">No PMTCT records found</TableCell></TableRow> : rows.map((item, i) => (
                      <TableRow key={`${item.id}-${i}`} className="group border-b border-emerald-50/60 transition-colors hover:bg-gradient-to-r hover:from-emerald-50/40 hover:via-teal-50/20 hover:to-transparent">
                        <TableCell className="py-4 pl-8 font-mono text-xs font-semibold text-[#00a67e]">{item.id}</TableCell>
                        <TableCell className="py-4 text-slate-600">{item.type}</TableCell>
                        <TableCell className="py-4 text-slate-600">{item.hivStatus}</TableCell>
                        <TableCell className="py-4 text-slate-600">{item.date}</TableCell>
                        <TableCell className="py-4 text-slate-600">{item.facility}</TableCell>
                        <TableCell className="py-4 pr-8 text-right"><Button variant="ghost" size="sm" onClick={() => {
                          try {
                            sessionStorage.setItem("pmtct_profile_record", JSON.stringify(item.raw));
                          } catch {
                            // ignore storage failures
                          }
                          navigate("/profile/pmtct-details", { state: { record: item.raw } });
                        }}>View</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </GlowCard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PMTCTRegister;
