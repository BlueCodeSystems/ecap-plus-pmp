import { CheckCircle2, Flag, ClipboardList, TrendingUp, Users, Activity, Target, Zap } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import LoadingDots from "@/components/aceternity/LoadingDots";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useEffect } from "react";
import { DEFAULT_DISTRICT, getVcaServicesByDistrict } from "@/lib/api";
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
  const district = DEFAULT_DISTRICT;
  const servicesQuery = useQuery({
    queryKey: ["vca-services", "district", district],
    queryFn: () => getVcaServicesByDistrict(district ?? ""),
    enabled: Boolean(district),
  });

  const services = servicesQuery.data ?? [];
  const recentServices = services.slice(0, 10);

  // --- DASHBOARD DATA CALCULATIONS ---

  const dashboardStats = useMemo(() => {
    if (!services.length) return null;

    const uniqueVcas = new Set(services.map(s => pickValue(s as any, ["vca_id", "vcaid", "child_id"]))).size;
    const completedServices = services.filter(s => {
      const status = pickValue(s as any, ["status", "state", "outcome"]).toLowerCase();
      return status.includes("complete") || status.includes("success") || status.includes("active");
    }).length;

    return {
      total: services.length,
      uniqueVcas,
      completionRate: Math.round((completedServices / services.length) * 100),
      avgEngagement: (services.length / uniqueVcas).toFixed(1)
    };
  }, [services]);

  const serviceDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(s => {
      const type = pickValue(s as any, ["service", "service_name", "form_name"]);
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [services]);

  const monthlyTrend = useMemo(() => {
    const months: Record<string, number> = {};
    services.forEach(s => {
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
  }, [services]);

  const categoryData = useMemo(() => {
    // Categorize services based on name keywords
    const categories = {
      Health: 0,
      Safe: 0,
      Schooled: 0,
      Stable: 0
    };

    services.forEach(s => {
      const name = pickValue(s as any, ["service", "service_name", "form_name"]).toLowerCase();
      if (name.includes("health") || name.includes("hiv") || name.includes("medical")) categories.Health++;
      else if (name.includes("safe") || name.includes("abuse") || name.includes("protection")) categories.Safe++;
      else if (name.includes("school") || name.includes("education") || name.includes("enrollment")) categories.Schooled++;
      else if (name.includes("stable") || name.includes("assessment") || name.includes("finance")) categories.Stable++;
      else categories.Stable++; // Default fallback
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [services]);

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
    <DashboardLayout subtitle="VCA Services Dashboard">
      <PageIntro
        eyebrow="Intelligence Dashboard"
        title="VCA Services Insights"
        description="Monitor service delivery trends, engagement depth, and operational performance across the district."
        actions={
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-700 font-bold py-1 px-3">
              {servicesQuery.isLoading ? <LoadingDots /> : `${services.length} Total Services`}
            </Badge>
            <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20">
              Generate Report
            </Button>
          </div>
        }
      />

      {/* KPI Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Services", value: dashboardStats?.total || 0, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Unique VCAs", value: dashboardStats?.uniqueVcas || 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Completion Rate", value: `${dashboardStats?.completionRate || 0}%`, icon: Target, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Avg Engagement", value: dashboardStats?.avgEngagement || 0, icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((kpi, idx) => (
          <GlowCard key={idx} className="p-0 border-0 overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{kpi.label}</p>
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
                  <CardTitle className="text-xl">Service Distribution</CardTitle>
                  <CardDescription>Frequency of services provided in {district}</CardDescription>
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
              <CardTitle className="text-xl">Engagement Velocity</CardTitle>
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
              <CardTitle className="text-xl">Core Domains</CardTitle>
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
                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Dashboard Insight</span>
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
          <CardTitle>Operative Modules</CardTitle>
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
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Logs</CardTitle>
              <CardDescription>Latest audited operations in {district}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-emerald-600 font-bold">View Audit Trail</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-w-full overflow-hidden">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-[150px] text-xs font-bold text-slate-400 uppercase tracking-widest pl-6">Identifier</TableHead>
                    <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest">Service Item</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Date</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-400 uppercase tracking-widest pr-6">Audited Status</TableHead>
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
                      return (
                        <TableRow key={index} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="pl-6 py-4">
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 uppercase">
                              {String(pickValue(record, ["vca_id", "vcaid", "child_id", "unique_id"]))}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-sm font-bold text-slate-900 block">
                              {String(pickValue(record, ["service", "service_name", "form_name"]))}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-center py-4">
                            <span className="text-xs font-medium text-slate-500">
                              {String(pickValue(record, ["service_date", "visit_date", "date"]))}
                            </span>
                          </TableCell>
                          <TableCell className="text-right pr-6 py-4">
                            <Badge variant="outline" className="text-[10px] h-6 px-2 font-black border-emerald-100 bg-emerald-50/50 text-emerald-700">
                              {String(pickValue(record, ["status", "state", "outcome"])).toUpperCase()}
                            </Badge>
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
