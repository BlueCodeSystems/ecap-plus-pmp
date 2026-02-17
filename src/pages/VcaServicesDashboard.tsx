import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  FileText,
  TrendingUp,
  Users,
  Activity,
  Target,
  Zap,
  ClipboardList,
  Flag,
  AlertCircle
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
import { getVcaServicesByDistrict, getChildrenByDistrict } from "@/lib/api";
import { useNavigate } from "react-router-dom";
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

const VcaServicesDashboard = () => {
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Discover districts
  const vcaListQuery = useQuery({
    queryKey: ["vca-districts-discovery"],
    queryFn: () => getChildrenByDistrict(""),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const districts = useMemo(() => {
    const distSet = new Set(["Lusaka", "Copperbelt", "Kafue", "Ndola", "Chongwe", "Kitwe"]);
    if (vcaListQuery.data) {
      vcaListQuery.data.forEach((v: any) => {
        if (v.district) distSet.add(v.district);
      });
    }
    return Array.from(distSet).sort();
  }, [vcaListQuery.data]);

  const servicesQuery = useQuery({
    queryKey: ["vca-services-all", selectedDistrict],
    queryFn: async () => {
      const data = await getVcaServicesByDistrict(selectedDistrict === "All" ? "" : selectedDistrict);
      return data;
    },
    retry: false,
  });

  const allServices = useMemo(() => {
    return servicesQuery.data ?? [];
  }, [servicesQuery.data]);

  const filteredServices = useMemo(() => {
    return allServices.filter((service: any) => {
      const vcaId = String(service.vca_id || service.vcaid || service.child_id || "").toLowerCase();
      const serviceName = String(service.service || service.service_name || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      return vcaId.includes(query) || serviceName.includes(query);
    });
  }, [allServices, searchQuery]);

  const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
    for (const key of keys) {
      const value = record[key];
      if (value !== null && value !== undefined && value !== "") return String(value);
    }
    return "N/A";
  };

  // --- DASHBOARD DATA CALCULATIONS ---

  const dashboardStats = useMemo(() => {
    if (!allServices.length) return null;

    const uniqueVcas = new Set(allServices.map(s => pickValue(s as any, ["vca_id", "vcaid", "child_id"]))).size;
    const completedServices = allServices.filter(s => {
      const status = pickValue(s as any, ["status", "state", "outcome"]).toLowerCase();
      return status.includes("complete") || status.includes("success") || status.includes("active");
    }).length;

    return {
      total: allServices.length,
      uniqueVcas,
      completionRate: Math.round((completedServices / allServices.length) * 100),
      avgEngagement: (allServices.length / uniqueVcas).toFixed(1)
    };
  }, [allServices]);

  const serviceDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    allServices.forEach(s => {
      const type = pickValue(s as any, ["service", "service_name", "form_name"]);
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [allServices]);

  const monthlyTrend = useMemo(() => {
    const months: Record<string, number> = {};
    allServices.forEach(s => {
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
  }, [allServices]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {
      Health: 0,
      Safe: 0,
      Schooled: 0,
      Stable: 0
    };

    allServices.forEach(s => {
      const name = pickValue(s as any, ["service", "service_name", "form_name"]).toLowerCase();
      if (name.includes("health") || name.includes("hiv") || name.includes("medical")) categories.Health++;
      else if (name.includes("safe") || name.includes("abuse") || name.includes("protection")) categories.Safe++;
      else if (name.includes("school") || name.includes("education") || name.includes("enrollment")) categories.Schooled++;
      else categories.Stable++;
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [allServices]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <DashboardLayout subtitle="VCA Services Intelligence">
      <PageIntro
        eyebrow="Intelligence Dashboard"
        title="VCA Services Insights"
        description={`Analyzing ${allServices.length} operations across ${selectedDistrict === "All" ? "all districts" : selectedDistrict}.`}
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
            <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 h-9">
              Export Analysis
            </Button>
          </div>
        }
      />

      {/* KPI Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {[
          { label: "Total Services", value: dashboardStats?.total || 0, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Unique VCAs", value: dashboardStats?.uniqueVcas || 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Completion Rate", value: `${dashboardStats?.completionRate || 0}%`, icon: Target, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Avg Engagement", value: dashboardStats?.avgEngagement || 0, icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((kpi, idx) => (
          <GlowCard key={idx} className="p-0 border-0 overflow-hidden group">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{kpi.label}</p>
                <p className="text-3xl font-black text-slate-900">
                  {servicesQuery.isLoading ? <LoadingDots className="h-2 w-2" /> : kpi.value}
                </p>
              </div>
              <div className={`${kpi.bg} ${kpi.color} p-4 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <kpi.icon className="h-6 w-6" />
              </div>
            </div>
          </GlowCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Distribution Chart */}
          <GlowCard>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-bold">Service Intensity</CardTitle>
                <CardDescription className="text-xs">Volume distribution by service type</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-emerald-500 opacity-50" />
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceDistribution} layout="vertical" margin={{ left: 120, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#10b981"
                    radius={[0, 8, 8, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </GlowCard>

          {/* Trend Chart */}
          <GlowCard>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-bold">Engagement Velocity</CardTitle>
                <CardDescription className="text-xs">Service delivery momentum over time</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-blue-500 opacity-50" />
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
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
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Strategic Balance</CardTitle>
              <CardDescription className="text-xs">Service categorization audit</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-4">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 700 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 p-5 rounded-2xl border border-slate-100 bg-slate-50/50 w-full">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Insight</span>
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed font-medium mt-1">
                  {categoryData.sort((a, b) => b.value - a.value)[0]?.value > 0 ? (
                    <>
                      The <span className="text-slate-900 font-black">{categoryData.sort((a, b) => b.value - a.value)[0]?.name}</span> domain represents your strongest delivery channel.
                      We recommend reviewing <span className="text-slate-900 font-black">{categoryData.sort((a, b) => a.value - b.value)[0]?.name}</span> indicators to ensure no case is lagging.
                    </>
                  ) : "Loading performance insights..."}
                </p>
              </div>
            </CardContent>
          </GlowCard>
        </div>
      </div>

      {/* Module Navigation & Audit Trail */}
      <div className="grid gap-6">
        <GlowCard className="overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Audit History</h3>
                <p className="text-xs text-slate-500 font-medium">Audited operations in {selectedDistrict}</p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search VCA ID or Service…"
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
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-6 h-12">VCA Identifier</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-12">District</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-12">Service Item</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-12">Audit Date</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right pr-6 h-12">Outcome</TableHead>
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
                        <p className="text-xs font-bold uppercase tracking-widest opacity-50">No matching logs</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.slice(0, 15).map((service: any, index: number) => (
                    <TableRow key={`${index}-${service.id}`} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell
                        className="font-bold text-slate-900 cursor-pointer hover:text-emerald-600 pl-6"
                        onClick={() => {
                          const id = pickValue(service, ["vca_id", "vcaid", "child_id", "unique_id"]);
                          navigate(`/profile/vca-details`, { state: { id: String(id) } });
                        }}
                      >
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-md">{pickValue(service, ["vca_id", "vcaid", "child_id", "unique_id"])}</span>
                      </TableCell>
                      <TableCell className="text-[11px] font-bold text-slate-500">{service.district || "N/A"}</TableCell>
                      <TableCell>
                        <span className="text-sm font-black text-slate-800">
                          {pickValue(service, ["service", "service_name", "form_name"])}
                        </span>
                      </TableCell>
                      <TableCell className="text-[11px] font-bold text-slate-500">
                        {pickValue(service, ["service_date", "visit_date", "date"])}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge variant="outline" className="text-[10px] h-6 px-2 font-black border-slate-200 bg-slate-50 text-slate-600 shadow-sm uppercase tracking-tighter">
                          {pickValue(service, ["status", "state", "outcome"])}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </GlowCard>
      </div>

      {/* Support & Modules */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-slate-900 rounded-3xl shadow-xl shadow-slate-900/10">
        <div className="flex items-center gap-4 text-white">
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-black">Field Intelligence Unit</p>
            <p className="text-xs text-white/60">Operational tools for district-level service delivery.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold px-6">New Intervention</Button>
          <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 font-bold px-6">Protocol Guide</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VcaServicesDashboard;
