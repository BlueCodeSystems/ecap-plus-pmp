import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getChildrenByDistrict, getChildrenArchivedRegister, DEFAULT_DISTRICT, getVcaServicesByDistrict, getVcaReferralsByMonth } from "@/lib/api";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, MapPin, Calendar, ClipboardCheck, Baby, HeartPulse, FileText, Activity, Link2 } from "lucide-react";
import LoadingDots from "@/components/aceternity/LoadingDots";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const calculateAge = (birthdate: any): number => {
  if (!birthdate) return 0;
  const dateStr = String(birthdate);

  const formats = [
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  ];

  let parsedDate: Date | null = null;

  for (const format of formats) {
    const parts = dateStr.match(format);
    if (parts) {
      if (format === formats[0]) {
        parsedDate = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
      } else if (format === formats[1]) {
        parsedDate = new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]));
      } else {
        parsedDate = new Date(parseInt(parts[3]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      break;
    }
  }

  if (!parsedDate && !isNaN(Date.parse(dateStr))) {
    parsedDate = new Date(dateStr);
  }

  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - parsedDate.getFullYear();
  const m = today.getMonth() - parsedDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < parsedDate.getDate())) {
    age--;
  }
  return age;
};

const VcaProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const district = user?.location ?? DEFAULT_DISTRICT;

  const { data: vcas, isLoading: isLoadingActive } = useQuery({
    queryKey: ["vcas", "district", district],
    queryFn: () => getChildrenByDistrict(district ?? ""),
    enabled: Boolean(district),
    staleTime: 1000 * 60 * 5,
  });

  const { data: archivedVcas, isLoading: isLoadingArchived } = useQuery({
    queryKey: ["vcas", "archived", "district", district],
    queryFn: () => getChildrenArchivedRegister(district ?? ""),
    enabled: Boolean(district),
    staleTime: 1000 * 60 * 5,
  });

  const { data: allServices, isLoading: isLoadingServices } = useQuery({
    queryKey: ["vca-services", "district", district],
    queryFn: () => getVcaServicesByDistrict(district ?? ""),
    enabled: Boolean(district),
    staleTime: 1000 * 60 * 5,
  });

  const { data: allReferrals, isLoading: isLoadingReferrals } = useQuery({
    queryKey: ["vca-referrals", "district", district],
    queryFn: () => getVcaReferralsByMonth(district ?? ""),
    enabled: Boolean(district),
    staleTime: 1000 * 60 * 5,
  });

  const vca = [...(vcas || []), ...(archivedVcas || [])].find((v: any) => {
    const vId = id?.toLowerCase();
    return (
      String(v.uid || "").toLowerCase() === vId ||
      String(v.unique_id || "").toLowerCase() === vId ||
      String(v.vca_id || "").toLowerCase() === vId ||
      String(v.vcaid || "").toLowerCase() === vId ||
      String(v.child_id || "").toLowerCase() === vId ||
      String(v.id || "").toLowerCase() === vId
    );
  });

  const vcaServices = useMemo(() => {
    if (!allServices || !id) return [];
    return allServices.filter((s: any) => {
      const vId = id.toLowerCase();
      const sId = String(s.vca_id || s.vcaid || s.child_id || s.unique_id || s.id || "").toLowerCase();
      return sId === vId && !String(s.service || s.form_name || "").toLowerCase().includes("case plan");
    });
  }, [allServices, id]);

  const vcaCasePlans = useMemo(() => {
    if (!allServices || !id) return [];
    return allServices.filter((s: any) => {
      const vId = id.toLowerCase();
      const sId = String(s.vca_id || s.vcaid || s.child_id || s.unique_id || s.id || "").toLowerCase();
      return sId === vId && String(s.service || s.form_name || "").toLowerCase().includes("case plan");
    });
  }, [allServices, id]);

  const vcaReferrals = useMemo(() => {
    if (!allReferrals || !id) return [];
    return allReferrals.filter((r: any) => {
      const vId = id.toLowerCase();
      const rId = String(r.vca_id || r.vcaid || r.child_id || r.unique_id || r.id || "").toLowerCase();
      return rId === vId;
    });
  }, [allReferrals, id]);

  if (isLoadingActive || isLoadingArchived) {
    return (
      <DashboardLayout subtitle="VCA Profile">
        <div className="flex h-[50vh] items-center justify-center">
          <LoadingDots />
        </div>
      </DashboardLayout>
    );
  }

  if (!vca) {
    return (
      <DashboardLayout subtitle="VCA Not Found">
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <p className="text-slate-500 font-medium">VCA record not found.</p>
          <Button onClick={() => navigate("/vcas")} variant="outline" className="rounded-full">Back to Register</Button>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = `${vca.firstname || vca.name || ""} ${vca.lastname || ""}`.trim() || "N/A";
  const age = calculateAge(vca.birthdate);
  const isArchived = Boolean(vca.de_registration_date || vca.reason);

  return (
    <DashboardLayout subtitle={`VCA: ${id}`}>
      <div className="space-y-6 pb-12">
        {/* Header/Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-2xl">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-white/10 bg-white/5 backdrop-blur-sm md:h-28 md:w-28">
                <Avatar className="h-full w-full rounded-none">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${fullName}&backgroundColor=f1f5f9`} />
                  <AvatarFallback className="text-2xl font-bold text-slate-900">{fullName[0]}</AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center md:text-left">
                <Badge className="mb-2 bg-primary/20 text-primary-foreground backdrop-blur-md border-0">
                  {isArchived ? "Archived Record" : "Active VCA"}
                </Badge>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{fullName}</h1>
                <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm text-slate-400 md:justify-start">
                  <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {String(vca.vca_gender || vca.gender || "N/A")}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {age} Years Old</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {String(vca.district || "N/A")}</span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)} className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Register
            </Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Details */}
          <GlowCard className="lg:col-span-2">
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Baby className="h-5 w-5 text-primary" />
                  Primary Information
                </h3>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <InfoItem label="Unique ID" value={String(id)} />
                <InfoItem label="Birthdate" value={String(vca.birthdate || "N/A")} icon={<Calendar className="h-3.5 w-3.5" />} />
                <div className="sm:col-span-1">
                  <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50 cursor-pointer" onClick={() => vca.household_code && navigate(`/profile/household-profile/${encodeURIComponent(vca.household_code)}`)}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Household Code</p>
                    <div className="flex items-center gap-2">
                      <Link2 className="h-3.5 w-3.5 text-primary" />
                      <p className="text-sm font-bold text-primary hover:underline">{String(vca.household_code || "N/A")}</p>
                    </div>
                  </div>
                </div>
                <InfoItem label="Facility" value={String(vca.facility || "N/A")} icon={<HeartPulse className="h-3.5 w-3.5" />} />
                <InfoItem label="Ward" value={String(vca.ward || "N/A")} />
                <InfoItem label="Province" value={String(vca.province || "N/A")} />
                <div className="sm:col-span-2">
                  <InfoItem label="Home Address" value={String(vca.homeaddress || "N/A")} icon={<MapPin className="h-3.5 w-3.5" />} />
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Sub-Population Section */}
          <GlowCard>
            <div className="p-6">
              <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                Sub-Population
              </h3>

              <div className="flex flex-col gap-3">
                {Object.entries(vca).some(([key, value]) => (value === "1" || value === "true" || value === 1 || value === true)) ? (
                  Object.entries(vca).map(([key, value]) => {
                    if (value === "1" || value === "true" || value === 1 || value === true) {
                      return (
                        <div key={key} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{subPopulationFilterLabels[key] || key.replace(/_/g, " ")}</span>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-0">YES</Badge>
                        </div>
                      );
                    }
                    return null;
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                    <div className="mb-2 rounded-full bg-slate-50 p-3">
                      <ClipboardCheck className="h-6 w-6 opacity-20" />
                    </div>
                    <p className="text-xs">No active markers for this VCA</p>
                  </div>
                )}
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Additional Stats/Insights (Placeholder for future data) */}
        <div className="grid gap-4 md:grid-cols-3">
          <InsightCard
            title="Last Service"
            value={String(vca.last_service_date || "N/A")}
            subtitle="The most recent date a service was recorded"
            color="blue"
          />
          <InsightCard
            title="Virally Suppressed"
            value={String(vca.virally_suppressed || "N/A")}
            subtitle="Clinical status indicator"
            color="amber"
          />
        </div>

        {/* Activity, Case Plans, and Referrals Tabs */}
        <GlowCard className="overflow-hidden">
          <Tabs defaultValue="services" className="w-full">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Activity History</h3>
                <div className="text-xs text-slate-500 font-medium bg-white px-3 py-1 rounded-full border border-slate-100 italic">
                  Showing data for VCA {id}
                </div>
              </div>
              <TabsList className="bg-slate-100 p-1 mb-0 border-b-0 rounded-t-xl rounded-b-none">
                <TabsTrigger value="services" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6 py-2">
                  <Activity className="h-4 w-4 mr-2" /> Services
                </TabsTrigger>
                <TabsTrigger value="case-plans" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6 py-2">
                  <FileText className="h-4 w-4 mr-2" /> Case Plans
                </TabsTrigger>
                <TabsTrigger value="referrals" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6 py-2">
                  <Link2 className="h-4 w-4 mr-2" /> Referrals
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[400px]">
              <TabsContent value="services" className="m-0 p-0">
                <ActivityTable
                  data={vcaServices}
                  isLoading={isLoadingServices}
                  type="service"
                  emptyMessage="No service history found for this VCA."
                />
              </TabsContent>
              <TabsContent value="case-plans" className="m-0 p-0">
                <ActivityTable
                  data={vcaCasePlans}
                  isLoading={isLoadingServices}
                  type="case-plan"
                  emptyMessage="No case plans found for this VCA."
                />
              </TabsContent>
              <TabsContent value="referrals" className="m-0 p-0">
                <ActivityTable
                  data={vcaReferrals}
                  isLoading={isLoadingReferrals}
                  type="referral"
                  emptyMessage="No referral records found for this VCA."
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </GlowCard>
      </div>
    </DashboardLayout>
  );
};

const ActivityTable = ({ data, isLoading, type, emptyMessage }: { data: any[], isLoading: boolean, type: 'service' | 'case-plan' | 'referral', emptyMessage: string }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <LoadingDots />
        <p className="text-sm text-slate-500">Fetching records...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="mb-4 rounded-full bg-slate-50 p-4 border border-slate-100">
          {type === 'service' && <Activity className="h-8 w-8 text-slate-300" />}
          {type === 'case-plan' && <FileText className="h-8 w-8 text-slate-300" />}
          {type === 'referral' && <Link2 className="h-8 w-8 text-slate-300" />}
        </div>
        <p className="text-slate-500 font-medium">{emptyMessage}</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Try checking other categories or ensuring the VCA ID is correctly registered.</p>
      </div>
    );
  }

  const pickValue = (record: any, keys: string[]): string => {
    for (const key of keys) {
      const value = record[key];
      if (value !== null && value !== undefined && value !== "") return String(value);
    }
    return "N/A";
  };

  return (
    <Table>
      <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
        <TableRow>
          <TableHead className="font-bold text-slate-700 py-4 pl-6">Record Name</TableHead>
          <TableHead className="font-bold text-slate-700 py-4">Date</TableHead>
          <TableHead className="font-bold text-slate-700 py-4">Status & Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, idx) => (
          <TableRow key={idx} className="hover:bg-slate-50/50">
            <TableCell className="py-4 pl-6">
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 leading-tight">
                  {pickValue(item, ["service", "service_name", "form_name", "referral_type", "name"])}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                  {pickValue(item, ["facility", "ward", "provider"])}
                </span>
              </div>
            </TableCell>
            <TableCell className="py-4">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-700">
                  {pickValue(item, ["service_date", "visit_date", "date", "created_at"])}
                </span>
              </div>
            </TableCell>
            <TableCell className="py-4 pr-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-white border-primary/20 text-primary font-bold text-[10px] uppercase px-2 py-0.5">
                  {pickValue(item, ["status", "state", "outcome", "referral_status"])}
                </Badge>
                {item.remarks && (
                  <span className="text-xs text-slate-500 italic truncate max-w-[200px]">
                    "{item.remarks}"
                  </span>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const InfoItem = ({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) => (
  <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
    <div className="flex items-center gap-2">
      {icon && <span className="text-slate-400">{icon}</span>}
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const InsightCard = ({ title, value, subtitle, color }: { title: string, value: string, subtitle: string, color: 'blue' | 'emerald' | 'amber' }) => {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
  };

  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-70">{title}</p>
      <p className="my-1.5 text-2xl font-black">{value}</p>
      <p className="text-[10px] opacity-80">{subtitle}</p>
    </div>
  );
};


export default VcaProfile;
