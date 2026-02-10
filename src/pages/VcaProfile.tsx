import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getChildrenByDistrict, getChildrenArchivedRegister, DEFAULT_DISTRICT, getVcaServicesByDistrict, getVcaReferralsByMonth, getVcaCasePlansById, getFlaggedRecords, getVcaServicesByChildId } from "@/lib/api";
import { useMemo, useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, MapPin, Calendar, ClipboardCheck, Baby, HeartPulse, FileText, Activity, Link2, ShieldCheck } from "lucide-react";
import LoadingDots from "@/components/aceternity/LoadingDots";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/ui/TableSkeleton";

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
  if (!parsedDate || isNaN(parsedDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - parsedDate.getFullYear();
  const m = today.getMonth() - parsedDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < parsedDate.getDate())) age--;
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
  });

  const { data: archivedVcas, isLoading: isLoadingArchived } = useQuery({
    queryKey: ["vcas", "archived", "district", district],
    queryFn: () => getChildrenArchivedRegister(district ?? ""),
    enabled: Boolean(district),
  });

  const { data: vcaServices, isLoading: isLoadingVcaServices } = useQuery({
    queryKey: ["vca-services", "vca", id],
    queryFn: () => getVcaServicesByChildId(id ?? ""),
    enabled: Boolean(id),
  });

  const { data: allReferrals, isLoading: isLoadingReferrals } = useQuery({
    queryKey: ["vca-referrals", "district", district],
    queryFn: () => getVcaReferralsByMonth(district ?? ""),
    enabled: Boolean(district),
  });

  const { data: vcaCasePlans = [], isLoading: isLoadingCasePlans } = useQuery({
    queryKey: ["vca-caseplans", "vca", id],
    queryFn: () => getVcaCasePlansById(id ?? ""),
    enabled: Boolean(id),
  });

  const { data: flaggedRecords } = useQuery({
    queryKey: ["flagged-records"],
    queryFn: () => getFlaggedRecords(),
  });

  const vca = useMemo(() => {
    return [...(vcas || []), ...(archivedVcas || [])].find((v: any) => {
      const vId = id?.toLowerCase();
      return (
        String(v.uid || "").toLowerCase() === vId ||
        String(v.unique_id || "").toLowerCase() === vId ||
        String(v.vca_id || "").toLowerCase() === vId ||
        String(v.id || "").toLowerCase() === vId
      );
    });
  }, [vcas, archivedVcas, id]);

  /* Removed old vcaServices useMemo since we now fetch directly
  const vcaServices = useMemo(() => {
    if (!allServices || !id) return [];
    return allServices.filter((s: any) => {
      //...
    });
  }, [allServices, id]);
  */



  const vcaReferrals = useMemo(() => {
    if (!allReferrals || !id) return [];
    return allReferrals.filter((r: any) => {
      const vId = id.toLowerCase();
      const rId = String(r.vca_id || r.vcaid || r.child_id || r.unique_id || r.id || "").toLowerCase();
      return rId === vId;
    });
  }, [allReferrals, id]);

  const vcaFlags = useMemo(() => {
    if (!flaggedRecords || !id) return [];
    return flaggedRecords.filter((f: any) => {
      const vId = id.toLowerCase();
      return String(f.vca_id || f.child_id || "").toLowerCase() === vId;
    });
  }, [flaggedRecords, id]);

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
        <EmptyState
          icon={<User className="h-7 w-7" />}
          title="VCA Not Found"
          description="The VCA record you're looking for doesn't exist or has been moved."
          action={{ label: "Back to Register", onClick: () => navigate("/vcas") }}
          className="h-[50vh]"
        />
      </DashboardLayout>
    );
  }

  const fullName = `${vca.firstname || vca.name || ""} ${vca.lastname || ""}`.trim() || "N/A";
  const age = calculateAge(vca.birthdate);
  const isArchived = Boolean(vca.de_registration_date || vca.reason);

  return (
    <DashboardLayout subtitle={`VCA: ${id}`}>
      <div className="space-y-6 pb-20">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg">
          {/* Gradient top section */}
          <div className="relative bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 p-6 lg:p-8">
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] bg-[length:200px_100%]" />

            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className={cn(
                    "text-xs border-0",
                    isArchived ? "bg-red-400/20 text-white" : "bg-white/20 text-white"
                  )}>
                    {isArchived ? "Deregistered" : "Active VCA"}
                  </Badge>
                  {vca.virally_suppressed === "YES" && (
                    <Badge className="text-xs border-0 bg-white/20 text-white">
                      Suppressed
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-white lg:text-4xl">
                  {fullName}
                </h1>
              </div>
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                size="sm"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </div>
          </div>

          {/* White metadata strip */}
          <div className="bg-white border border-slate-200 border-t-0 rounded-b-2xl px-6 py-4 lg:px-8">
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" /> {String(vca.vca_gender || vca.gender || "N/A")}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {age} Years
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {String(vca.ward || vca.district || "N/A")}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <Link2 className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Household Code</p>
                  <p
                    className="cursor-pointer text-sm font-medium text-slate-900 hover:text-primary hover:underline"
                    onClick={() => vca.household_code && navigate(`/profile/household-profile/${encodeURIComponent(String(vca.household_code))}`)}
                  >
                    {String(vca.household_code || "N/A")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <HeartPulse className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">DQA Facility</p>
                  <p className="text-sm font-medium text-slate-900">{String(vca.facility || "N/A")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <ClipboardCheck className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last Service Date</p>
                  <p className="text-sm font-medium text-slate-900">{String(vca.last_service_date || "N/A")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="mb-8 flex flex-col items-center justify-between gap-6 md:flex-row">
            <TabsList className="h-auto w-full flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/50 p-2 md:w-auto">
              <TabsTrigger value="overview" className="rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Summary
              </TabsTrigger>
              <TabsTrigger value="indicators" className="rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Indicators
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Caseplans
              </TabsTrigger>
              <TabsTrigger value="audit" className="rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Referrals
              </TabsTrigger>
              <TabsTrigger value="flags" className="rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider transition-all data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Flag Record Form
              </TabsTrigger>
            </TabsList>
            <div className="hidden text-xs font-bold text-slate-400 md:block">
              VCA Tracking ID: <span className="text-slate-900">{id}</span>
            </div>
          </div>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="h-full border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                      <Baby className="h-5 w-5 text-slate-600" /> Profile Demographics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 sm:grid-cols-2">
                    <InfoItem label="Full Legal Name" value={fullName} icon={<User className="h-3.5 w-3.5" />} />
                    <InfoItem label="Date of Birth" value={String(vca.birthdate || "N/A")} icon={<Calendar className="h-3.5 w-3.5" />} />
                    <InfoItem label="Gender Identity" value={String(vca.vca_gender || vca.gender || "N/A")} />
                    <InfoItem label="Age at Assessment" value={`${age} Years`} />
                    <div className="sm:col-span-2">
                      <InfoItem label="Primary Physical Address" value={String(vca.homeaddress || "N/A")} icon={<MapPin className="h-3.5 w-3.5" />} />
                    </div>
                    <InfoItem label="Geographic Ward" value={String(vca.ward || "N/A")} />
                    <InfoItem label="Province Jurisdiction" value={String(vca.province || "N/A")} />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                      <ClipboardCheck className="h-5 w-5 text-slate-600" /> Priority Markers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {Object.entries(vca).some(([key, value]) => (value === "1" || value === "true" || value === 1 || value === true)) ? (
                      Object.entries(vca).map(([key, value]) => {
                        if ((value === "1" || value === "true" || value === 1 || value === true) && subPopulationFilterLabels[key]) {
                          return (
                            <div key={key} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-100">
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{subPopulationFilterLabels[key]}</span>
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-0 px-3 font-bold">YES</Badge>
                            </div>
                          );
                        }
                        return null;
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                        <ClipboardCheck className="h-8 w-8 opacity-10 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">No Priority Markers</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="indicators">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(vca)
                    .filter(([key, val]) => (val === "1" || val === "true" || val === 1 || val === true) && !subPopulationFilterLabels[key])
                    .map(([key, _]) => (
                      <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{key.replace(/_/g, " ")}</p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <p className="text-sm font-black text-slate-900 capitalize">Met Requirement</p>
                        </div>
                      </div>
                    ))}
                  {Object.entries(vca).filter(([key, val]) => (val === "1" || val === "true" || val === 1 || val === true)).length === 0 && (
                    <div className="col-span-full">
                      <EmptyState icon={<Activity className="h-7 w-7" />} title="No Indicators Mapped" description="No performance indicators have been recorded for this VCA." />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold">VCA Caseplans</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCasePlans ? (
                  <TableSkeleton rows={4} columns={4} />
                ) : vcaCasePlans.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vcaCasePlans.map((plan: any, idx: number) => (
                        <CasePlanRow key={idx} plan={plan} servicesSource={vcaServices} />
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState icon={<FileText className="h-7 w-7" />} title="No Caseplans Recorded" description="No case plans have been created for this VCA yet." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="overflow-hidden border-slate-200">
              <div className="bg-slate-900 p-6 flex items-center justify-between border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">VCA Referrals</h3>
                <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold">Export</Button>
              </div>
              <ScrollArea className="h-[500px]">
                <ActivityTable data={vcaReferrals} isLoading={isLoadingReferrals} type="referral" emptyMessage="No referral tracking for this VCA." />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="flags">
            <Card className="overflow-hidden border-slate-200">
              <div className="bg-red-900/10 p-6 flex items-center justify-between border-b border-red-100">
                <h3 className="text-lg font-bold text-red-900">Flagged Record Forms</h3>
              </div>
              <CardContent className="p-0">
                {vcaFlags.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-red-50/50">
                      <TableRow>
                        <TableHead className="pl-6">Form Type</TableHead>
                        <TableHead>Date Flagged</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right pr-6">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vcaFlags.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="pl-6 font-bold text-slate-900">
                            {String(item.form_type || "General Form")}
                          </TableCell>
                          <TableCell className="text-sm">
                            {String(item.date_created || item.created_at || "N/A")}
                          </TableCell>
                          <TableCell className="text-sm max-w-md truncate">
                            {String(item.description || item.reason || "No description provided")}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-red-600 border-red-200 bg-red-50">
                              Flagged
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState icon={<ClipboardCheck className="h-7 w-7" />} title="No Flagged Records" description="This VCA has no flagged records." />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const ActivityTable = ({ data, isLoading, type, emptyMessage }: { data: any[], isLoading: boolean, type: 'service' | 'case-plan' | 'referral', emptyMessage: string }) => {
  if (isLoading) return <div className="p-20 text-center"><LoadingDots /></div>;
  if (data.length === 0) return (
    <div className="p-20 text-center text-slate-400">
      <p className="font-bold text-xs uppercase tracking-widest">{emptyMessage}</p>
    </div>
  );

  return (
    <Table>
      <TableHeader className="bg-slate-50">
        <TableRow>
          <TableHead className="pl-6">Record Name</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="pr-6">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, idx) => (
          <TableRow key={idx}>
            <TableCell className="pl-6 font-bold text-slate-900">
              {String(item.service || item.service_name || item.form_name || item.referral_type || "N/A")}
            </TableCell>
            <TableCell className="text-sm">
              {String(item.service_date || item.visit_date || item.date || "N/A")}
            </TableCell>
            <TableCell className="pr-6">
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary">
                {String(item.status || item.state || "N/A")}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const InfoItem = ({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) => (
  <div className="space-y-1 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    <div className="flex items-center gap-2">
      {icon && <span className="text-slate-400">{icon}</span>}
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

const cleanArrayString = (str: string | null | undefined) => {
  if (!str) return "-";
  try {
    // legacy logic: .replace(/[\[\]"]/g, '')
    return String(str).replace(/[\[\]"]/g, '').replace(/,/g, ', ');
  } catch (e) {
    return String(str);
  }
};

const CasePlanRow = ({ plan, servicesSource = [] }: { plan: any, servicesSource?: any[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const top = topScrollRef.current;
    const bottom = bottomScrollRef.current;

    if (!top || !bottom) return;

    const handleTopScroll = () => {
      if (bottom) bottom.scrollLeft = top.scrollLeft;
    };

    const handleBottomScroll = () => {
      if (top) top.scrollLeft = bottom.scrollLeft;
    };

    top.addEventListener('scroll', handleTopScroll);
    bottom.addEventListener('scroll', handleBottomScroll);

    return () => {
      top.removeEventListener('scroll', handleTopScroll);
      bottom.removeEventListener('scroll', handleBottomScroll);
    };
  }, [isOpen]);

  // Try to find services linked to this case plan
  let linkedServices = servicesSource.filter(s => {
    const serviceLinkId = String(s.case_plan_id || s.vcaid || s.caseplan_id || "");
    const planId = String(plan.case_plan_id || plan.unique_id || plan.id || "");
    return serviceLinkId && planId && serviceLinkId === planId;
  });

  const isFallback = linkedServices.length === 0 && servicesSource.length > 0;
  if (isFallback) {
    linkedServices = servicesSource;
  }

  return (
    <>
      <TableRow className={cn(isOpen ? "bg-slate-50 border-b-0" : "")}>
        <TableCell className="text-sm font-medium">
          {plan.case_plan_date ||
            plan.date_of_caseplan ||
            plan.case_plan?.date_of_caseplan ||
            plan.case_plan?.date ||
            plan.date ||
            "N/A"}
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
            {plan.case_plan_status ||
              plan.status ||
              plan.case_plan?.status ||
              plan.case_plan?.state ||
              "Initial"}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-slate-500">
          {plan.date_created || plan.created_at || plan.case_plan?.created_at ?
            new Date(plan.date_created || plan.created_at || plan.case_plan?.created_at).toLocaleDateString()
            : "N/A"}
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant={isOpen ? "secondary" : "outline"}
            size="sm"
            className="h-8 text-xs font-bold"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "Hide Services" : "View Services"}
          </Button>
        </TableCell>
      </TableRow>
      {isOpen && (
        <TableRow className="bg-slate-50 hover:bg-slate-50 border-b-0">
          <TableCell colSpan={4} className="p-4 pt-0 overflow-hidden" style={{ width: 0, minWidth: '100%' }}>
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col w-full">
              <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h4 className="text-lg font-bold uppercase tracking-wider text-slate-700">Service Details</h4>
                {isFallback && <span className="text-sm text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-sm">Showing all VCA services</span>}
              </div>
              {linkedServices.length > 0 ? (
                <div className="w-full space-y-2">
                  {/* Top Scrollbar container */}
                  <div
                    ref={topScrollRef}
                    className="w-full overflow-x-auto overflow-y-hidden h-4 bg-slate-50 border-b border-slate-200"
                  >
                    <div className="min-w-[1200px] h-px" />
                  </div>

                  <div ref={bottomScrollRef} className="w-full overflow-x-auto">
                    <Table className="min-w-[1200px]">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent bg-slate-50/50">
                          <TableHead className="text-sm font-bold h-12 text-slate-900">Service Date</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">Health Services</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">HIV Services</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">Other Health</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">Safe</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">School Services</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">Stable</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {linkedServices.map((svc: any, i: number) => (
                          <TableRow key={i} className="hover:bg-slate-50/30">
                            <TableCell className="text-sm py-4 font-bold text-slate-900">{svc.service_date || "N/A"}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.health_services)}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.hiv_services)}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.other_health_services)}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.safe_services)}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.schooled_services)}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.stable_services)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No detailed services found.
                </div>
              )}
            </div>
          </TableCell>
        </TableRow >
      )}
    </>
  );
};

export default VcaProfile;
