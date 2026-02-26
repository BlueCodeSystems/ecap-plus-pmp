import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHouseholdsByDistrict, getHouseholdArchivedRegister, DEFAULT_DISTRICT, getCaregiverServicesByHousehold, getCaregiverReferralsByMonth, getFlaggedRecords, getChildrenByDistrict, getCaregiverCasePlansByDistrict, getCaregiverCasePlansByHousehold, getHouseholdReferralsById, getHouseholdMembers, updateFlagStatus } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, MapPin, Calendar, ClipboardCheck, Briefcase, Layers, ShieldCheck, HeartPulse, FileText, Activity, Link2, Home, Flag, AlertTriangle } from "lucide-react";
import LoadingDots from "@/components/aceternity/LoadingDots";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useMemo, useState, useRef, useEffect } from "react";
import { cn, toTitleCase } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/ui/TableSkeleton";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFlaggedRecord } from "@/lib/api";
import { notifyUsersOfFlag, notifyUsersOfFlagResolution } from "@/lib/directus";
import { toast } from "sonner";
import { format } from "date-fns";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const subPopulationFilterLabels: Record<string, string> = {
  calhiv: "CALHIV",
  hei: "HEI",
  cwlhiv: "CWLHIV",
  agyw: "AGYW",
  csv: "C/SV",
  cfsw: "CFSW",
  abym: "ABYM",
};

const flagSchema = z.object({
  category: z.string().optional(),
  severity: z.string().optional(),
  comment: z.string().min(10, "Flag observations must be at least 10 characters long."),
});

const safeParseDate = (dateStr: any) => {
  if (!dateStr) return 0;
  const str = String(dateStr);
  const dmY = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmY) {
    return new Date(parseInt(dmY[3]), parseInt(dmY[2]) - 1, parseInt(dmY[1])).getTime();
  }
  const parsed = Date.parse(str);
  return isNaN(parsed) ? 0 : parsed;
};

const HouseholdProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve ID from location state or sessionStorage fallback
  const id = useMemo(() => {
    const stateId = location.state?.id;
    if (stateId) {
      sessionStorage.setItem('ecap_last_household_id', stateId);
      return stateId;
    }
    return sessionStorage.getItem('ecap_last_household_id');
  }, [location.state?.id]);

  const { user } = useAuth();
  const isDistrictUser = user?.description === "District User";
  // Admins and Provincial Users have global view access at the profile level
  const district = isDistrictUser ? (user?.location || "None") : "";

  const { data: households, isLoading: isLoadingActive } = useQuery({
    queryKey: ["households", "district", district],
    queryFn: () => getHouseholdsByDistrict(district),
    enabled: true,
  });



  const { data: archivedHouseholds, isLoading: isLoadingArchived } = useQuery({
    queryKey: ["households", "archived", "district", district],
    queryFn: () => getHouseholdArchivedRegister(district),
    enabled: true,
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



  const { data: vcas } = useQuery({
    queryKey: ["vcas", "district", district],
    queryFn: () => getChildrenByDistrict(district),
    enabled: true,
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

  const queryClient = useQueryClient();

  const household = useMemo(() => {
    return [...(households || []), ...(archivedHouseholds || [])].find((h: any) => {
      const hId = id?.toLowerCase();
      return (
        String(h.uid || "").toLowerCase() === hId ||
        String(h.unique_id || "").toLowerCase() === hId ||
        String(h.household_code || "").toLowerCase() === hId ||
        String(h.household_id || "").toLowerCase() === hId ||
        String(h.id || "").toLowerCase() === hId
      );
    });
  }, [households, archivedHouseholds, id]);


  const form = useForm<z.infer<typeof flagSchema>>({
    resolver: zodResolver(flagSchema),
    defaultValues: {
      category: "",
      severity: "",
      comment: "",
    },
  });

  const mutation = useMutation({
    mutationFn: createFlaggedRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flagged-records"] });
      const verifier = user ? `${user.first_name} ${user.last_name}` : "Unknown Verifier";
      notifyUsersOfFlag(id || "N/A", verifier, form.getValues("comment") as string);

      toast.success("Flag submitted successfully", {
        description: "The record has been flagged for review.",
      });
      form.reset();
    },
    onError: (err: Error) => {
      toast.error("Submission failed", {
        description: err.message || "Please try again later.",
      });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (flagId: string) => {
      await updateFlagStatus(flagId, "resolved");
      const resolver = user ? `${user.first_name} ${user.last_name}` : "Unknown Resolver";
      const record = householdFlags.find((f: any) => f.id === flagId);
      if (record) {
        await notifyUsersOfFlagResolution(String(record.household_id ?? ""), resolver, "Resolved from Household profile.", String(record.vca_id ?? ""));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flagged-records"] });
      toast.success("Flag resolved", { description: "Caseworker and admins have been notified." });
    },
    onError: (err: any) => {
      toast.error("Failed to resolve flag", { description: err.message });
    }
  });

  const handleResolve = (flagId: string) => {
    resolveMutation.mutate(flagId);
  };

  const onFlagSubmit = (values: z.infer<typeof flagSchema>) => {
    const verifier = user ? `${user.first_name} ${user.last_name}` : "Unknown Verifier";
    const payload = {
      household_id: id,
      caseworker_phone: household?.caseworker_phone || "N/A",
      caseworker_name: household?.caseworker_name || household?.cwac_member_name || "N/A",
      caregiver_name: household?.caregiver_name || "N/A",
      facility: household?.facility || household?.health_facility || "N/A",
      comment: values.comment,
      category: values.category,
      severity: values.severity,
      verifier,
      status: "pending",
    };
    mutation.mutate(payload);
  };



  const householdServices = useMemo(() => {
    if (!allServices || !id) return [];
    const hhId = String(household?.household_id || id).toLowerCase();
    const filtered = allServices.filter((s: any) => {
      return String(s.household_id || s.householdId || s.hh_id || "").toLowerCase() === hhId;
    });

    return filtered.sort((a: any, b: any) => {
      const dateA = safeParseDate(a.service_date || a.visit_date || a.date);
      const dateB = safeParseDate(b.service_date || b.visit_date || b.date);
      return dateB - dateA;
    });
  }, [allServices, id, household?.household_id]);

  const sortedCasePlans = useMemo(() => {
    if (householdCasePlans?.length > 0) {
      console.log("Caregiver Plans Vulnerabilities Debug:", householdCasePlans.map((p: any) => ({
        id: p.id,
        date: p.case_plan_date || p.date_of_caseplan,
        vulnerabilities: p.vulnerabilities || p.caregiver_vulnerabilities || "not found"
      })));
    }
    return [...householdCasePlans].sort((a: any, b: any) => {
      const dateA = safeParseDate(a.case_plan_date || a.date_of_caseplan || a.date);
      const dateB = safeParseDate(b.case_plan_date || b.date_of_caseplan || b.date);
      return dateB - dateA;
    });
  }, [householdCasePlans]);

  const householdFlags = useMemo(() => {
    if (!flaggedRecords || !id) return [];
    const hhId = String(household?.household_id || id).toLowerCase();
    return (flaggedRecords || []).filter((f: any) => {
      const matchId = String(f.household_id || f.hh_id || "").toLowerCase() === hhId;
      return matchId && f.status !== "resolved";
    });
  }, [flaggedRecords, id, household?.household_id]);

  const householdVcas = useMemo(() => {
    if (!vcas || !id) return [];
    return vcas.filter((v: any) => {
      const hhId = id.toLowerCase();
      return String(v.household_code || v.household_id || "").toLowerCase() === hhId;
    });
  }, [vcas, id]);

  const { data: householdReferrals = [], isLoading: isLoadingReferrals } = useQuery({
    queryKey: ["caregiver-referrals", id],
    queryFn: () => getHouseholdReferralsById(id ?? ""),
    enabled: Boolean(id),
  });

  const sortedReferrals = useMemo(() => {
    return [...householdReferrals].sort((a: any, b: any) => {
      const dateA = safeParseDate(a.service_date || a.visit_date || a.date || a.referral_date);
      const dateB = safeParseDate(b.service_date || b.visit_date || b.date || b.referral_date);
      return dateB - dateA;
    });
  }, [householdReferrals]);

  if (isLoadingActive || isLoadingArchived) {
    return (
      <DashboardLayout subtitle="Household profile">
        <div className="flex h-[50vh] items-center justify-center">
          <LoadingDots />
        </div>
      </DashboardLayout>
    );
  }

  if (!household) {
    return (
      <DashboardLayout subtitle="Household not found">
        <EmptyState
          icon={<Home className="h-7 w-7" />}
          title="Household not found"
          description="The household record you're looking for doesn't exist or has been moved."
          action={{ label: "Back to Register", onClick: () => navigate("/households") }}
          className="h-[50vh]"
        />
      </DashboardLayout>
    );
  }

  const caregiverName = String(household.caregiver_name || household.name || "N/A");
  const isArchived = Boolean(household.de_registration_date);

  // Pick the latest service date dynamically from the sorted services list
  const lastServiceDate = householdServices[0]?.service_date || household.last_service_date || "N/A";

  return (
    <DashboardLayout subtitle={`Household: ${id}`}>
      <div className="space-y-6 pb-20">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg">
          {/* Gradient top section */}
          <div className="relative bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 p-6 lg:p-8">
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
                    {isArchived ? "Archived Household" : "Active Household"}
                  </Badge>
                  <Badge className="text-xs border-0 bg-white/20 text-white">
                    {householdVcas.length} VCAs
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold text-white lg:text-4xl">
                  Anonymous
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
        </div>

        {/* Quick Info Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Ward */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <MapPin className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ward</p>
                  <p className="text-sm font-medium text-slate-900">{String(household.ward || "N/A")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Primary Facility */}
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

          {/* Card 3: Last Service Date */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <Calendar className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last Service Date</p>
                  <p className="text-sm font-medium text-slate-900">{String(lastServiceDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="mb-8 flex flex-col items-center justify-between gap-6 md:flex-row">
            <TabsList className="h-auto w-full flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/50 p-2 md:w-auto">
              <TabsTrigger value="overview" className="rounded-full px-5 py-2 text-xs font-black tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Summary
              </TabsTrigger>
              <TabsTrigger value="family" className="rounded-full px-5 py-2 text-xs font-black tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Family members
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-full px-5 py-2 text-xs font-black tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Caseplans
              </TabsTrigger>
              <TabsTrigger value="audit" className="rounded-full px-5 py-2 text-xs font-black tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Referrals
              </TabsTrigger>
              <TabsTrigger value="flags" className="rounded-full px-5 py-2 text-xs font-black tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Flag record form
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
                    <User className="h-5 w-5 text-slate-600" /> Caregiver personal information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem label="Caregiver name" value={String(household.caregiver_name || "N/A")} icon={<User className="h-3.5 w-3.5" />} />
                  <InfoItem label="Caregiver sex" value={String(household.caregiver_sex || household.sex || household.gender || "N/A")} />
                  <InfoItem label="Date of birth" value={String(household.caregiver_birthdate || household.caregiver_birth_date || household.dob || "N/A")} icon={<Calendar className="h-3.5 w-3.5" />} />
                  <InfoItem label="Hiv status" value={String(household.caregiver_hiv_status || household.hiv_status || "N/A")} icon={<Activity className="h-3.5 w-3.5" />} />
                  <InfoItem label="Marital status" value={String(household.marital_status || "N/A")} />
                  <InfoItem label="Relation" value={String(household.caregiver_relation || household.relation || "N/A")} />
                  <InfoItem label="Phone number" value={String(household.caregiver_phone || household.phone || "N/A")} />
                </CardContent>
              </Card>

              {/* Household Details */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <Home className="h-5 w-5 text-slate-600" /> Household information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <InfoItem label="Home Address" value={String(household.homeaddress || household.home_address || "N/A")} icon={<MapPin className="h-3.5 w-3.5" />} />
                  </div>
                  <InfoItem label="Family Source of Income" value={String(household.fam_source_income || household.family_source_of_income || household.source_of_income || "N/A")} />
                  <InfoItem label="Monthly expenses" value={String(household.monthlyexpenses || household.monthly_expenses || "N/A")} />
                  <InfoItem label="Number of beds" value={String(household.beds || household.number_of_beds || "N/A")} />
                  <InfoItem label="Malaria itns" value={String(household.malaria_itns || household.itns || "N/A")} />
                  <InfoItem label="Sanitary facilities" value={String(household.sanitary_facilities || "N/A")} />
                </CardContent>
              </Card>

              {/* Location & System */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                      <MapPin className="h-5 w-5 text-slate-600" /> Location & facility
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <InfoItem label="Province" value={String(household.province || "N/A")} />
                    <InfoItem label="District" value={String(household.district || "N/A")} />
                    <InfoItem label="Ward" value={String(household.ward || "N/A")} />
                    <InfoItem label="Health facility" value={String(household.facility || "N/A")} icon={<HeartPulse className="h-3.5 w-3.5" />} />
                    <InfoItem label="Community entry" value={String(household.entry_type || "N/A")} />
                    <InfoItem label="Partner" value={String(household.partner || "PCZ")} />
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                      <Briefcase className="h-5 w-5 text-slate-600" /> Caseworker & system
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <InfoItem label="Caseworker name" value={String(household.caseworker_name || "N/A")} icon={<User className="h-3.5 w-3.5" />} />
                    <InfoItem label="Caseworker phone" value={String(household.caseworker_phone || "N/A")} />
                    <InfoItem label="Date enrolled" value={String(household.date_enrolled || household.enrollment_date || "N/A")} icon={<Calendar className="h-3.5 w-3.5" />} />
                    <InfoItem label="Date screened" value={String(household.screening_date || household.date_screened || "N/A")} icon={<Calendar className="h-3.5 w-3.5" />} />
                    <InfoItem label="Provider id" value={String(household.provider_id || "N/A")} />
                    <InfoItem label="Case status" value={String(household.case_status || household.status || "Active")} />
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>

          <TabsContent value="family" className="mt-0 w-full overflow-hidden">
            <Card className="overflow-hidden border-slate-200">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-xl font-bold">Family members</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingMembers ? (
                  <TableSkeleton rows={4} columns={5} />
                ) : householdMembers.length > 0 ? (
                  <div className="w-full overflow-x-auto">
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
                            <TableCell className="pl-6 align-top">
                              <span className="text-sm font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100">{String(m.uid || m.vca_id || "N/A")}</span>
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
                              <Badge variant="outline" className="text-[10px] font-bold tracking-wider text-slate-500">
                                {String(m.relation || m.relationship || "N/A")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button onClick={() => navigate(`/profile/vca-details`, { state: { id: String(m.uid || m.vca_id || m.unique_id) } })} size="sm" className="h-8 text-xs font-bold bg-primary text-white hover:bg-primary/90">View profile</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <EmptyState icon={<User className="h-7 w-7" />} title="No Family Members Found" description="No family members have been registered for this household." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0 w-full overflow-hidden min-w-0">
            <Card className="border-slate-200 min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Caregiver caseplans</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCasePlans ? (
                  <TableSkeleton rows={4} columns={4} />
                ) : householdCasePlans.length > 0 ? (
                  <div className="space-y-4">
                    <div className="w-full overflow-x-auto">
                      <Table className="table-fixed w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[120px]">Date</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead>
                            <TableHead className="w-[150px]">Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedCasePlans.map((plan: any, idx) => (
                            <CasePlanRow key={idx} plan={plan} servicesSource={householdServices} />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={<ClipboardCheck className="h-7 w-7" />} title="No Caseplans Recorded" description="No case plans have been created for this household yet." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-0 w-full overflow-hidden">
            <Card className="overflow-hidden border-slate-200">
              <div className="bg-white p-6 flex items-center justify-between border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">Household referrals</h3>
                <Button variant="outline" size="sm" className="text-xs font-bold" onClick={() => {/* logic moved if needed, currently just button */ }}>Export</Button>
              </div>
              <ScrollArea className="h-[500px]">
                <ActivityTable data={sortedReferrals} isLoading={isLoadingReferrals} type="referral" emptyMessage="No referral tracking found" />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="flags" className="mt-0 w-full overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="space-y-6">
              <Card className="overflow-hidden border-slate-200 border-none shadow-none bg-transparent">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-slate-900">Data quality flags</h3>
                </div>

                {householdFlags.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <p className="text-[10px] font-black tracking-widest text-orange-500 uppercase">Active attention required</p>
                    {householdFlags.map((flag: any) => (
                      <div key={flag.id} className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-xl shadow-sm border border-orange-100 flex-shrink-0">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{toTitleCase(flag.comment || "Suspicious data entry")}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Flagged by {flag.verifier} • {format(new Date(flag.date_created), "MMM d, yyyy")}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleResolve(flag.id)}
                          disabled={resolveMutation.isPending}
                          size="sm"
                          variant="ghost"
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] rounded-lg h-8 px-3 transition-all"
                        >
                          Resolve
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Card className="border-slate-200 shadow-sm overflow-hidden bg-slate-50/50">
                  <div className="p-6 border-b border-slate-100 bg-white/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Flag className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900">Record new flag</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest"></p>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onFlagSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Flag category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 text-sm font-medium">
                                      <SelectValue placeholder="Choose category...(optional)" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                    <SelectItem value="Missing Data">Missing data</SelectItem>
                                    <SelectItem value="Invalid Data">Invalid data</SelectItem>
                                    <SelectItem value="Duplicate Record">Duplicate record</SelectItem>
                                    <SelectItem value="Incorrect Service">Incorrect service logging</SelectItem>
                                    <SelectItem value="Case Plan Mismatch">Case plan mismatch</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="severity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Priority severity</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 text-sm font-medium">
                                      <SelectValue placeholder="Select severity... (optional)" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                    <SelectItem value="Low">Low severity</SelectItem>
                                    <SelectItem value="Medium">Medium severity</SelectItem>
                                    <SelectItem value="High">High severity</SelectItem>
                                    <SelectItem value="Critical">Critical issue</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="comment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Flag observations & action details</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Provide detailed observations about the data quality issue, any suspected causes, and recommended immediate actions..."
                                  className="min-h-[120px] bg-white border-slate-200 rounded-xl focus-visible:ring-emerald-500/20 text-sm italic font-medium"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                          <div className="flex items-center gap-2 text-slate-400">
                            <AlertCircle className="h-3 w-3" />
                            <p className="text-[10px] font-medium">Submitted flags will be reviewed by district monitors within 24 hours.</p>
                          </div>
                          <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="bg-slate-900 border-none hover:bg-slate-800 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-95 whitespace-nowrap">
                            {mutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Submit flag record
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </Card>

              <Card className="overflow-hidden border-slate-200 shadow-sm">
                <div className="p-6 flex items-center justify-between border-b bg-rose-50/50 border-rose-100">
                  <h3 className="text-lg font-bold text-rose-900">Flagging history</h3>
                  <Badge variant="outline" className="bg-white border-rose-200 text-rose-700 font-black text-[10px]">
                    {householdFlags.length} records
                  </Badge>
                </div>
                <CardContent className="p-0">
                  {householdFlags.length > 0 ? (
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow>
                            <TableHead className="pl-6 font-bold text-[10px] text-slate-400 uppercase tracking-widest">Category</TableHead>
                            <TableHead className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Date flagged</TableHead>
                            <TableHead className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Observations</TableHead>
                            <TableHead className="text-right pr-6 font-bold text-[10px] text-slate-400 uppercase tracking-widest">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {householdFlags.map((item: any, idx: number) => (
                            <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <TableCell className="pl-6">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 text-sm">{String(item.category || item.form_type || "General")}</span>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-tighter",
                                    item.severity === "Critical" ? "text-red-600" : "text-slate-400"
                                  )}>
                                    {item.severity || "Normal"} priority
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                                {String(item.date_created || item.created_at || "N/A") && format(new Date(item.date_created || item.created_at), "dd MMM yyyy") || "N/A"}
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 max-w-md italic leading-relaxed">
                                {String(item.comment || item.description || item.reason || "No description provided")}
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <Badge variant="outline" className="text-[9px] font-black text-rose-600 border-rose-100 bg-rose-50 px-2 rounded-md uppercase tracking-tighter">
                                  Flagged
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <EmptyState icon={<Flag className="h-7 w-7" />} title="No flagged records" description="This household has no documented data quality issues." />
                  )}
                </CardContent>
              </Card>
            </div>
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

  const [tableWidth, setTableWidth] = useState(0);

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

  useEffect(() => {
    if (!isOpen) return;

    let isSyncing = false;

    // Small delay to ensure refs are attached after render
    const timer = setTimeout(() => {
      const top = topScrollRef.current;
      const bottom = bottomScrollRef.current;

      if (!top || !bottom) return;

      // Update dummy width to match real table content
      const realWidth = bottom.scrollWidth;
      setTableWidth(realWidth);

      // Initial sync
      bottom.scrollLeft = top.scrollLeft;

      const handleTopScroll = () => {
        if (isSyncing) return;
        isSyncing = true;
        bottom.scrollLeft = top.scrollLeft;
        requestAnimationFrame(() => { isSyncing = false; });
      };

      const handleBottomScroll = () => {
        if (isSyncing) return;
        isSyncing = true;
        top.scrollLeft = bottom.scrollLeft;
        requestAnimationFrame(() => { isSyncing = false; });
      };

      top.addEventListener('scroll', handleTopScroll, { passive: true });
      bottom.addEventListener('scroll', handleBottomScroll, { passive: true });

      return () => {
        top.removeEventListener('scroll', handleTopScroll);
        bottom.removeEventListener("scroll", handleBottomScroll);
      };
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, linkedServices.length]);

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
          <Badge variant="secondary" className="text-[10px] font-bold tracking-wider">
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
            {isOpen ? "Hide services" : "View services"}
          </Button>
        </TableCell>
      </TableRow>
      {isOpen && (
        <TableRow className="bg-slate-50 hover:bg-slate-50 border-b-0">
          <TableCell colSpan={4} className="p-2 md:p-4 pt-0 overflow-hidden" style={{ maxWidth: '1px', width: '100%' }}>
            <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden flex flex-col w-full min-w-0">
              <div className="bg-slate-100 px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 flex justify-between items-center">
                <h4 className="text-sm md:text-lg font-black tracking-wider text-slate-700">Vulnerabilities</h4>
                {isFallback && <span className="text-sm text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-sm">Showing all household services </span>}
              </div>

              {linkedServices.length > 0 ? (
                <div className="w-full relative overflow-hidden">
                  {/* Top Scrollbar container for accessibility - h-6 to avoid clipping */}
                  <div
                    ref={topScrollRef}
                    className="w-full overflow-x-auto overflow-y-hidden h-6 bg-slate-50 border-b border-slate-200 scrollbar-thin shadow-inner z-10"
                  >
                    <div style={{ width: tableWidth || '1800px' }} className="h-px" />
                  </div>

                  <div ref={bottomScrollRef} className="w-full overflow-x-auto no-scrollbar">
                    <Table className="min-w-[1800px] table-fixed">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent bg-slate-50/50">
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 w-32 md:w-40 border-r border-slate-100">Service Date</TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100 w-32">HIV status</TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100 w-32">Viral Load</TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100">Health Services</TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100">HIV Services</TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100">Other Health</TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100">Safe</TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100">Other Safe</TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100">Schooled</TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100">Other Schooled</TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900 border-r border-slate-100">Stable</TableHead>
                          <TableHead className="text-[10px] md:text-sm font-black h-10 md:h-12 text-slate-900">Other Stable</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {linkedServices.map((svc: any, i: number) => (
                          <TableRow key={i} className="hover:bg-slate-50/30">
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 font-bold text-slate-900 border-r border-slate-100">{svc.service_date || "N/A"}</TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 text-slate-700 border-r border-slate-100">{svc.is_hiv_positive || "N/A"}</TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 text-slate-700 border-r border-slate-100">{svc.vl_last_result || "N/A"}</TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed border-r border-slate-100">{cleanArrayString(svc.health_services)}</TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed border-r border-slate-100">{cleanArrayString(svc.hiv_services)}</TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed border-r border-slate-100">{cleanArrayString(svc.other_health_services)}</TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed border-r border-slate-100">{cleanArrayString(svc.safe_services)}</TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed border-r border-slate-100">{cleanArrayString(svc.other_safe_services)}</TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed border-r border-slate-100">{cleanArrayString(svc.schooled_services)}</TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed border-r border-slate-100">{cleanArrayString(svc.other_schooled_services)}</TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed border-r border-slate-100">{cleanArrayString(svc.stable_services)}</TableCell>
                            <TableCell className="text-[10px] md:text-sm py-3 md:py-4 whitespace-normal text-slate-700 leading-relaxed">{cleanArrayString(svc.other_stable_services)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-[10px] md:text-xs italic font-bold tracking-widest">
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
  if (data.length === 0) return <div className="p-20 text-center text-slate-400 font-bold text-xs tracking-widest">{emptyMessage}</div>;

  return (
    <div className="w-full overflow-x-auto">
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
                {String(item.service || item.service_name || item.form_name || item.referral || item.referral_type || item.referral_name || "N/A")}
              </TableCell>
              <TableCell className="text-sm">
                {String(item.service_date || item.visit_date || item.date || item.referral_date || item.date_created || item.created_at || "N/A")}
              </TableCell>
              <TableCell className="pr-6">
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600">
                  {String(item.status || item.state || "N/A")}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};


const InfoItem = ({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) => (
  <div className="space-y-1 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
    <p className="text-[10px] font-bold tracking-wider text-slate-400">{label}</p>
    <div className="flex items-center gap-2">
      {icon && <span className="text-slate-400">{icon}</span>}
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

export default HouseholdProfile;
