import { MapPin, Users, Home } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingDots from "@/components/aceternity/LoadingDots";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_DISTRICT,
  getHouseholdCountByDistrict,
  getVcaCountByDistrict,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const Districts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Fallback to DEFAULT_DISTRICT if user.location is not available, but prefer empty string to show "no data" if truly unknown
  const district = user?.location || DEFAULT_DISTRICT;

  const householdCountQuery = useQuery({
    queryKey: ["districts", "households", district],
    queryFn: () => getHouseholdCountByDistrict(district ?? ""),
    enabled: Boolean(district),
  });
  const vcaCountQuery = useQuery({
    queryKey: ["districts", "vcas", district],
    queryFn: () => getVcaCountByDistrict(district ?? ""),
    enabled: Boolean(district),
  });

  const formatCount = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return "0"; // Default to 0 instead of N/A for cleaner UI if data is missing but loading finished
    }
    return new Intl.NumberFormat("en-GB").format(value);
  };

  const summaryCards = [
    {
      title: "Households Screened",
      value: formatCount(householdCountQuery.data),
      helper: "All households in district",
      icon: Home,
      isLoading: householdCountQuery.isLoading,
    },
    {
      title: "Total VCAs Screened",
      value: formatCount(vcaCountQuery.data),
      helper: "All registered children in district",
      icon: Users,
      isLoading: vcaCountQuery.isLoading,
    },
  ];

  const handleOpenDistrict = () => {
    navigate("/households");
  };

  return (
    <DashboardLayout subtitle="Districts">
      <PageIntro
        eyebrow="Districts"
        title="District-level readiness at a glance."
        description="Compare screening coverage and caseloads for your assigned district."
        actions={
          <>
            <Badge className="bg-emerald-100 text-emerald-700">Live Coverage</Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <GlowCard key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className="text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">
                  {card.isLoading ? <LoadingDots className="text-slate-400" /> : card.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{card.helper}</p>
              </CardContent>
            </GlowCard>
          );
        })}
      </div>

      <GlowCard>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <CardTitle>District Coverage</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>District No.</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Households</TableHead>
                  <TableHead>VCAs</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!district && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                      No district assigned.
                    </TableCell>
                  </TableRow>
                )}
                {householdCountQuery.isLoading || vcaCountQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm">Loading district summary</span>
                        <LoadingDots className="text-slate-400" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  district && (
                    <TableRow>
                      <TableCell className="font-medium">1</TableCell>
                      <TableCell>{district}</TableCell>
                      <TableCell>{formatCount(householdCountQuery.data)}</TableCell>
                      <TableCell>{formatCount(vcaCountQuery.data)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={handleOpenDistrict}>Open</Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </GlowCard>
    </DashboardLayout>
  );
};

export default Districts;
