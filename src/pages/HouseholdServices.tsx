import { useState, useMemo } from "react";
import {
  Search,
  AlertCircle,
  FileText,
  UserCheck,
  RefreshCcw,
  Zap,
  Trophy,
  History,
  TrendingUp,
  Activity,
  Award
} from "lucide-react";
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
import { getCaregiverServicesByDistrict, getHouseholdsByDistrict } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

const HouseholdServices = () => {
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Discover districts
  const householdsListQuery = useQuery({
    queryKey: ["districts-discovery"],
    queryFn: () => getHouseholdsByDistrict(""),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const districts = useMemo(() => {
    const distSet = new Set(["Lusaka", "Copperbelt", "Kafue", "Ndola", "Chongwe"]);
    if (householdsListQuery.data) {
      householdsListQuery.data.forEach((h: any) => {
        if (h.district) distSet.add(h.district);
      });
    }
    return Array.from(distSet).sort();
  }, [householdsListQuery.data]);

  const servicesQuery = useQuery({
    queryKey: ["caregiver-services", "all-districts", selectedDistrict],
    queryFn: async () => {
      return getCaregiverServicesByDistrict(selectedDistrict === "All" ? "" : selectedDistrict);
    },
    retry: false,
  });

  const allServices = servicesQuery.data ?? [];

  // Aggregated Stats and Leaderboard from real data
  const { filteredWorkers, stats, trendData } = useMemo(() => {
    const workerMap = new Map<string, {
      id: string,
      name: string,
      district: string,
      totalServices: number,
      interactions: number,
      lastSync: string,
      rating: number,
      lastTimestamp: number
    }>();

    const dailyInteractions: Record<string, number> = {
      "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0
    };

    allServices.forEach((s: any) => {
      const workerName = s.caseworker || pickValue(s, ["created_by", "worker", "user_id"]);
      const district = s.district || "Unknown";
      const dateStr = pickValue(s, ["service_date", "visit_date", "date"]);
      const timestamp = dateStr !== "N/A" ? new Date(dateStr).getTime() : 0;

      // Filter by district
      if (selectedDistrict !== "All" && district !== selectedDistrict) return;

      // Interaction Trend
      if (timestamp) {
        const day = new Date(timestamp).toLocaleString('default', { weekday: 'short' });
        if (dailyInteractions[day] !== undefined) dailyInteractions[day]++;
      }

      if (workerName !== "N/A") {
        const existing = workerMap.get(workerName) || {
          id: workerName,
          name: workerName,
          district: district,
          totalServices: 0,
          interactions: 0,
          lastSync: "N/A",
          rating: 4.5, // Default/Placeholder
          lastTimestamp: 0
        };

        existing.totalServices++;
        existing.interactions++;
        if (timestamp > existing.lastTimestamp) {
          existing.lastTimestamp = timestamp;
          existing.lastSync = dateStr !== "N/A" ? new Date(dateStr).toLocaleDateString() : "N/A";
        }
        workerMap.set(workerName, existing);
      }
    });

    const workers = Array.from(workerMap.values())
      .filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.totalServices - a.totalServices);

    const trend = Object.entries(dailyInteractions).map(([name, value]) => ({ name, value }));

    return {
      filteredWorkers: workers,
      stats: {
        activeWorkers: workers.length,
        totalInteractions: workers.reduce((acc, curr) => acc + curr.interactions, 0),
        avgSync: "Real-time",
        topPerformer: workers[0]?.name || "N/A"
      },
      trendData: trend
    };
  }, [allServices, selectedDistrict, searchQuery]);

  const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
    for (const key of keys) {
      const value = record[key];
      if (value !== null && value !== undefined && value !== "") return String(value);
    }
    return "N/A";
  };

  return (
    <DashboardLayout subtitle="Caseworker Performance Ops">
      <PageIntro
        eyebrow="Caseworker Intelligence"
        title="Worker Performance Dashboard"
        description="Monitor field worker sync status, interaction depth, and service delivery milestones."
        actions={
          <div className="flex items-center gap-3">
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger className="w-[180px] bg-white border-slate-200 font-bold text-slate-700 h-9">
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Districts</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 h-9 font-bold">
              Worker Sync Report
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {[
          { label: "Active Workers", value: stats.activeWorkers, icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Interactions", value: stats.totalInteractions, icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Sync Velocity", value: stats.avgSync, icon: RefreshCcw, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Top Performer", value: stats.topPerformer, icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50", isName: true },
        ].map((kpi, idx) => (
          <GlowCard key={idx} className="p-0 border-0 overflow-hidden group">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{kpi.label}</p>
                <p className={`${kpi.isName ? 'text-lg' : 'text-3xl'} font-black text-slate-900 truncate max-w-[150px]`}>
                  {kpi.value}
                </p>
              </div>
              <div className={`${kpi.bg} ${kpi.color} p-4 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <kpi.icon className="h-6 w-6" />
              </div>
            </div>
          </GlowCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        {/* Performance Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          <GlowCard className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-black text-slate-900">Performance Leaderboard</CardTitle>
                <CardDescription className="text-xs font-medium">Ranked by total services provided</CardDescription>
              </div>
              <Award className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-6 h-10">Caseworker</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-10">District</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-10">Services</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-10">Last Sync</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right pr-6 h-10">Efficiency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkers.map((cw, idx) => (
                    <TableRow key={cw.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{cw.name}</p>
                            <p className="text-[10px] font-mono text-slate-400 uppercase">{cw.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] font-bold text-slate-500">{cw.district}</TableCell>
                      <TableCell>
                        <Badge className="bg-slate-900 text-white font-bold h-5">{cw.totalServices}</Badge>
                      </TableCell>
                      <TableCell className="text-[11px] font-bold text-slate-500 italic">{cw.lastSync}</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                          <span className="text-[11px] font-black text-slate-900">{cw.rating}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </GlowCard>
        </div>

        {/* Interaction Momentum Chart */}
        <div className="space-y-6">
          <GlowCard className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Interactions</CardTitle>
                  <CardDescription className="text-xs">Weekly velocity</CardDescription>
                </div>
                <Activity className="h-5 w-5 text-blue-500 opacity-50" />
              </div>
            </CardHeader>
            <CardContent className="pt-4 px-2">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorInt)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <History className="h-4 w-4 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Activity</span>
                </div>
                <div className="space-y-3">
                  {allServices.slice(0, 3).map((s: any, i: number) => {
                    const workerName = s.caseworker || pickValue(s, ["created_by", "worker", "user_id"]);
                    const serviceName = s.service || pickValue(s, ["service", "service_name", "form_name"]);
                    const status = pickValue(s, ["status", "state", "outcome", "form_name"]);
                    return (
                      <div key={i} className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-black text-slate-800">{workerName}</p>
                          <p className="text-[10px] text-slate-400">{serviceName}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] h-4 leading-none font-bold uppercase tracking-tighter border-slate-200">
                          {status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </GlowCard>
        </div>
      </div>

      {/* Global Audit Trail */}
      <div className="mt-8">
        <GlowCard className="overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  Intervention Audit Trail
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 h-5 text-[10px]">Real-Time</Badge>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Monitoring nationwide household engagements</p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search Worker or Household..."
                  className="pl-9 bg-white border-slate-200 h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-6 h-12">Caseworker / ID</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-12">Household Focus</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-12">Intervention Type</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-12">Activity Date</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right pr-6 h-12">Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Combining mock and real data for the audit trail */}
                {allServices.slice(0, 20).map((service: any, index: number) => {
                  const workerName = service.caseworker || pickValue(service, ["created_by", "worker", "user_id"]);
                  const hhId = service.hhId || pickValue(service, ["household_id", "householdId", "hh_id"]);
                  const serviceName = service.service || pickValue(service, ["service", "service_name", "form_name"]);

                  return (
                    <TableRow key={`${index}-${service.id}`} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <p className="text-sm font-black text-slate-900">{workerName}</p>
                        <p className="text-[10px] font-mono text-slate-400">{service.id || "N/A"}</p>
                      </TableCell>
                      <TableCell>
                        <span
                          className="font-bold text-emerald-600 cursor-pointer hover:underline text-xs"
                          onClick={() => navigate(`/profile/household-details`, { state: { id: String(hhId) } })}
                        >
                          {hhId}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-slate-700">{serviceName}</span>
                      </TableCell>
                      <TableCell className="text-[11px] font-bold text-slate-500">
                        {pickValue(service, ["service_date", "visit_date", "date", "created_at"])}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge variant="outline" className="text-[10px] h-6 px-2 font-black border-slate-200 bg-emerald-50 text-emerald-700 shadow-sm uppercase tracking-tighter">
                          {pickValue(service, ["status", "state", "outcome", "form_name"])}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </GlowCard>
      </div>
    </DashboardLayout>
  );
};

export default HouseholdServices;
