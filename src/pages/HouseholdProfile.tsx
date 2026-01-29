import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getHouseholdsByDistrict, getHouseholdArchivedRegister, DEFAULT_DISTRICT, getCaregiverServicesByHousehold, getCaregiverReferralsByMonth, getFlaggedRecords, getChildrenByDistrict, getCaregiverCasePlansByDistrict, getCaregiverCasePlansByHousehold, getHouseholdReferralsById, getHouseholdMembers } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, MapPin, Calendar, ClipboardCheck, Briefcase, Layers, ShieldCheck, HeartPulse, FileText, Activity, Link2, Home, Flag } from "lucide-react";
import LoadingDots from "@/components/aceternity/LoadingDots";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useMemo, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const subPopulationFilterLabels: Record<string, string> = {
  calhiv: "CALHIV",
  hei: "HEI",
  cwlhiv: "CWLHIV",
  agyw: "AGYW",
  csv: "C/SV",
  cfsw: "CFSW",
  abym: "ABYM",
};

const HouseholdProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const district = user?.location ?? DEFAULT_DISTRICT;

  const { data: households, isLoading: isLoadingActive } = useQuery({
    queryKey: ["households", "district", district],
    queryFn: () => getHouseholdsByDistrict(district ?? ""),
    enabled: Boolean(district),
  });

  const { data: archivedHouseholds, isLoading: isLoadingArchived } = useQuery({
    queryKey: ["households", "archived", "district", district],
    queryFn: () => getHouseholdArchivedRegister(district ?? ""),
    enabled: Boolean(district),
  });

  const { data: allServices } = useQuery({
    queryKey: ["caregiver-services", "household", id],
    queryFn: () => getCaregiverServicesByHousehold(id ?? ""),
    enabled: Boolean(id),
  });

  const { data: householdCasePlans = [], isLoading: isLoadingCasePlans } = useQuery({
    queryKey: ["caregiver-caseplans", "household", id],
    queryFn: () => getCaregiverCasePlansByHousehold(id ?? ""),
    enabled: Boolean(id),
  });

  const { data: householdReferrals = [], isLoading: isLoadingReferrals } = useQuery({
    queryKey: ["caregiver-referrals", "household", id],
    queryFn: () => getHouseholdReferralsById(id ?? ""),
    enabled: Boolean(id),
  });

  const { data: vcas } = useQuery({
    queryKey: ["vcas", "district", district],
    queryFn: () => getChildrenByDistrict(district ?? ""),
    enabled: Boolean(district),
  });

  const { data: flaggedRecords } = useQuery({
    queryKey: ["flagged-records"],
    queryFn: () => getFlaggedRecords(),
  });

  const { data: householdMembers = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["household-members", id],
    queryFn: () => getHouseholdMembers(id ?? ""),
    enabled: Boolean(id),
  });

  const household = useMemo(() => {
    return [...(households || []), ...(archivedHouseholds || [])].find((h: any) => {
      const vId = id?.toLowerCase();
      return (
        String(h.household_id || "").toLowerCase() === vId ||
        String(h.householdId || "").toLowerCase() === vId ||
        String(h.hh_id || "").toLowerCase() === vId ||
        String(h.id || "").toLowerCase() === vId ||
        String(h.unique_id || "").toLowerCase() === vId
      );
    });
  }, [households, archivedHouseholds, id]);



  const householdServices = useMemo(() => {
    if (!allServices || !id) return [];
    return allServices.filter((s: any) => {
      const hhId = id.toLowerCase();
      // Try to match household ID in service record
      return String(s.household_id || s.householdId || s.hh_id || "").toLowerCase() === hhId;
    });
  }, [allServices, id]);

  const householdFlags = useMemo(() => {
    if (!flaggedRecords || !id) return [];
    return (flaggedRecords || []).filter((f: any) => {
      const hhId = id.toLowerCase();
      return String(f.household_id || f.hh_id || "").toLowerCase() === hhId;
    });
  }, [flaggedRecords, id]);

  const householdVcas = useMemo(() => {
    if (!vcas || !id) return [];
    return vcas.filter((v: any) => {
      const hhId = id.toLowerCase();
      return String(v.household_code || v.household_id || "").toLowerCase() === hhId;
    });
  }, [vcas, id]);

  if (isLoadingActive || isLoadingArchived) {
    return (
      <DashboardLayout subtitle="Household Profile">
        <div className="flex h-[50vh] items-center justify-center">
          <LoadingDots />
        </div>
      </DashboardLayout>
    );
  }

  if (!household) {
    return (
      <DashboardLayout subtitle="Household Not Found">
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <p className="text-slate-500 font-medium">Household record not found.</p>
          <Button onClick={() => navigate("/households")} variant="outline" className="rounded-full">Back to Register</Button>
        </div>
      </DashboardLayout>
    );
  }

  const caregiverName = String(household.caregiver_name || household.name || "N/A");
  const isArchived = Boolean(household.de_registration_date);

  return (
    <DashboardLayout subtitle={`Household: ${id}`}>
      <div className="space-y-6 pb-20">
        {/* Header Section */}
        <div className="overflow-hidden rounded-lg bg-white p-6 lg:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={cn(
                  "text-xs",
                  isArchived ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                )}>
                  {isArchived ? "Archived Household" : "Active Household"}
                </Badge>
                <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                  {householdVcas.length} VCAs
                </Badge>
              </div>
              <h1 className="text-3xl font-semibold text-slate-900 lg:text-4xl mb-4">
                {caregiverName}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4" /> ID: {id}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {String(household.district || "N/A")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" /> {String(household.caseworker_name || "N/A")}
                </span>
              </div>
            </div>

            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <HeartPulse className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Primary Facility</p>
                  <p className="text-sm font-medium text-slate-900">{String(household.facility || "N/A")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <Calendar className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last Service Date</p>
                  <p className="text-sm font-medium text-slate-900">{String(household.last_service_date || "N/A")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <ShieldCheck className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Screening Status</p>
                  <p className="text-sm font-medium text-slate-900">
                    {household.screened === "1" || household.screened === true ? "Verified" : "Pending"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="mb-8 flex flex-col items-center justify-between gap-6 md:flex-row">
            <TabsList className="h-auto w-full gap-2 rounded-[2rem] border border-slate-200 bg-white/50 p-2 md:w-auto">
              <TabsTrigger value="overview" className="rounded-full px-8 py-3 text-xs font-black uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Summary
              </TabsTrigger>
              <TabsTrigger value="family" className="rounded-full px-8 py-3 text-xs font-black uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Family Members
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-full px-8 py-3 text-xs font-black uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Caseplans
              </TabsTrigger>
              <TabsTrigger value="audit" className="rounded-full px-8 py-3 text-xs font-black uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Referrals
              </TabsTrigger>
              <TabsTrigger value="flags" className="rounded-full px-8 py-3 text-xs font-black uppercase tracking-wider transition-all data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Flag Record Form
              </TabsTrigger>
            </TabsList>
            <div className="hidden text-xs font-bold text-slate-400 md:block">
              Household ID: <span className="text-slate-900">{id}</span>
            </div>
          </div>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Caregiver & Personal Info */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <User className="h-5 w-5 text-slate-600" /> Caregiver Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem label="Caregiver Name" value={caregiverName} icon={<User className="h-3.5 w-3.5" />} />
                  <InfoItem label="Caregiver Sex" value={String(household.caregiver_sex || household.sex || household.gender || "N/A")} />
                  <InfoItem label="Date of Birth" value={String(household.caregiver_birth_date || household.dob || "N/A")} icon={<Calendar className="h-3.5 w-3.5" />} />
                  <InfoItem label="HIV Status" value={String(household.caregiver_hiv_status || household.hiv_status || "N/A")} icon={<Activity className="h-3.5 w-3.5" />} />
                  <InfoItem label="Marital Status" value={String(household.marital_status || "N/A")} />
                  <InfoItem label="Relation to VCAs" value={String(household.caregiver_relation || "N/A")} />
                  <InfoItem label="Phone Number" value={String(household.phone_number || household.contact || "N/A")} />
                </CardContent>
              </Card>

              {/* Household Details */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <Home className="h-5 w-5 text-slate-600" /> Household Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <InfoItem label="Home Address" value={String(household.home_address || household.homeaddress || "N/A")} icon={<MapPin className="h-3.5 w-3.5" />} />
                  </div>
                  <InfoItem label="Family Source of Income" value={String(household.family_source_of_income || household.source_of_income || "N/A")} />
                  <InfoItem label="Monthly Expenses" value={String(household.monthly_expenses || "N/A")} />
                  <InfoItem label="Number of Beds" value={String(household.beds || household.number_of_beds || "N/A")} />
                  <InfoItem label="Malaria ITNs" value={String(household.malaria_itns || household.itns || "N/A")} />
                  <InfoItem label="Sanitary Facilities" value={String(household.sanitary_facilities || "N/A")} />
                </CardContent>
              </Card>

              {/* Location & System */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                      <MapPin className="h-5 w-5 text-slate-600" /> Location & Facility
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <InfoItem label="Province" value={String(household.province || "N/A")} />
                    <InfoItem label="District" value={String(household.district || "N/A")} />
                    <InfoItem label="Ward" value={String(household.ward || "N/A")} />
                    <InfoItem label="Health Facility" value={String(household.facility || "N/A")} icon={<HeartPulse className="h-3.5 w-3.5" />} />
                    <InfoItem label="Community Entry" value={String(household.entry_type || "N/A")} />
                    <InfoItem label="Partner" value={String(household.partner || "PCZ")} />
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                      <Briefcase className="h-5 w-5 text-slate-600" /> Caseworker & System
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <InfoItem label="Caseworker Name" value={String(household.caseworker_name || "N/A")} icon={<User className="h-3.5 w-3.5" />} />
                    <InfoItem label="Caseworker Phone" value={String(household.caseworker_phone || "N/A")} />
                    <InfoItem label="Date Enrolled" value={String(household.date_enrolled || household.enrollment_date || "N/A")} icon={<Calendar className="h-3.5 w-3.5" />} />
                    <InfoItem label="Date Screened" value={String(household.screening_date || household.date_screened || "N/A")} icon={<Calendar className="h-3.5 w-3.5" />} />
                    <InfoItem label="Provider ID" value={String(household.provider_id || "N/A")} />
                    <InfoItem label="Case Status" value={String(household.status || "Active")} />
                  </CardContent>
                </Card>
              </div>

              {/* Eligibility Markers */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <ShieldCheck className="h-5 w-5 text-slate-600" /> Eligibility Markers
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {Object.entries(household).some(([key, value]) => (value === "1" || value === "true" || value === 1 || value === true)) ? (
                    Object.entries(household).map(([key, value]) => {
                      if ((value === "1" || value === "true" || value === 1 || value === true) && subPopulationFilterLabels[key]) {
                        return (
                          <div key={key} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-100">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{subPopulationFilterLabels[key]}</span>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-0 px-3 font-bold">ACTIVE</Badge>
                          </div>
                        );
                      }
                      return null;
                    })
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-6 text-center text-slate-400">
                      <ClipboardCheck className="h-8 w-8 opacity-10 mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest">No Active Markers</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="family">
            <Card className="overflow-hidden border-slate-200">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-xl font-bold">Family Members</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingMembers ? (
                  <div className="py-12 text-center"><LoadingDots /></div>
                ) : householdMembers.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="pl-6">Member Details</TableHead>
                        <TableHead>Birthdate</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Disability</TableHead>
                        <TableHead>Relationship</TableHead>
                        <TableHead className="text-right pr-6"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {householdMembers.map((m: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="pl-6 font-bold text-slate-900">
                            {String(m.firstname || "")} {String(m.lastname || "")}
                            <p className="text-[10px] font-normal text-slate-500 mt-0.5">{String(m.uid || m.vca_id || "N/A")}</p>
                          </TableCell>
                          <TableCell className="text-sm">
                            {String(m.birthdate || "N/A")}
                          </TableCell>
                          <TableCell className="text-sm border-slate-200">
                            {String(m.vca_gender || m.gender || "N/A")}
                          </TableCell>
                          <TableCell className="text-sm">
                            {String(m.disability || "None")}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {String(m.relation || m.relationship || "N/A")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button onClick={() => navigate(`/profile/vca-profile/${encodeURIComponent(String(m.uid || m.vca_id || m.unique_id))}`)} size="sm" className="h-8 text-xs font-bold bg-primary text-white hover:bg-primary/90">View Profile</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-20 text-center text-slate-400 uppercase tracking-widest text-xs font-bold">No family members found</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Caregiver Caseplans</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCasePlans ? (
                  <div className="py-12 text-center"><LoadingDots /></div>
                ) : householdCasePlans.length > 0 ? (
                  <div className="space-y-4">
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
                        {householdCasePlans.map((plan: any, idx) => (
                          <CasePlanRow key={idx} plan={plan} servicesSource={householdServices} />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 uppercase tracking-widest text-xs font-bold">No caseplans recorded</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="overflow-hidden border-slate-200">
              <div className="bg-slate-900 p-6 flex items-center justify-between border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">Household Referrals</h3>
                <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold">Export</Button>
              </div>
              <ScrollArea className="h-[500px]">
                <ActivityTable data={householdReferrals} isLoading={isLoadingReferrals} type="referral" emptyMessage="No referral tracking found" />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="flags">
            <Card className="overflow-hidden border-slate-200">
              <div className="bg-red-900/10 p-6 flex items-center justify-between border-b border-red-100">
                <h3 className="text-lg font-bold text-red-900">Flagged Record Forms</h3>
                <Button
                  size="sm"
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                  onClick={() => navigate("/flagged-record-form", { state: { household } })}
                >
                  <Flag className="mr-2 h-3.5 w-3.5" />
                  Flag Record
                </Button>
              </div>
              <CardContent className="p-0">
                {householdFlags.length > 0 ? (
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
                      {householdFlags.map((item: any, idx: number) => (
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
                  <div className="py-20 text-center text-slate-400 uppercase tracking-widest text-xs font-bold">No flagged records found</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

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
                {isFallback && <span className="text-sm text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-sm">Showing all household services </span>}
              </div>

              {linkedServices.length > 0 ? (
                <div className="w-full space-y-2">
                  {/* Top Scrollbar */}
                  <div
                    ref={topScrollRef}
                    className="w-full overflow-x-auto overflow-y-hidden h-4 bg-slate-50 border-b border-slate-200"
                  >
                    <div className="min-w-[1800px] h-px" />
                  </div>

                  <div ref={bottomScrollRef} className="w-full overflow-x-auto">
                    <Table className="min-w-[1800px]">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent bg-slate-50/50">
                          <TableHead className="text-sm font-bold h-12 text-slate-900">Service Date</TableHead>
                          <TableHead className="text-sm font-bold h-12 text-slate-900">HIV Pos</TableHead>
                          <TableHead className="text-sm font-bold h-12 text-slate-900">Viral Load</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">Health Services</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">HIV Services</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">Other Health</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">Safe</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">Other Safe</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">Schooled</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">Other Schooled</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">Stable</TableHead>
                          <TableHead className="text-sm font-bold h-12 w-48 text-slate-900">Other Stable</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {linkedServices.map((svc: any, i: number) => (
                          <TableRow key={i} className="hover:bg-slate-50/30">
                            <TableCell className="text-sm py-4 font-bold text-slate-900">{svc.service_date || "N/A"}</TableCell>
                            <TableCell className="text-sm py-4 text-slate-700">{svc.is_hiv_positive || "N/A"}</TableCell>
                            <TableCell className="text-sm py-4 text-slate-700">{svc.vl_last_result || "N/A"}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.health_services)}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.hiv_services)}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.other_health_services)}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.safe_services)}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.other_safe_services)}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.schooled_services)}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.other_schooled_services)}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.stable_services)}</TableCell>
                            <TableCell className="text-sm py-4 whitespace-normal text-slate-700 min-w-[200px] leading-relaxed">{cleanArrayString(svc.other_stable_services)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No services found.
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const ActivityTable = ({ data, isLoading, type, emptyMessage }: { data: any[], isLoading: boolean, type: 'service' | 'case-plan' | 'referral', emptyMessage: string }) => {
  if (isLoading) return <div className="p-20 text-center"><LoadingDots /></div>;
  if (data.length === 0) return <div className="p-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">{emptyMessage}</div>;

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
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600">
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

export default HouseholdProfile;
