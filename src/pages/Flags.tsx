import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import LoadingDots from "@/components/aceternity/LoadingDots";
import TableSkeleton from "@/components/ui/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFlaggedRecords, updateFlagStatus } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { notifyUsersOfFlagResolution } from "@/lib/directus";
import { Flag, Search, Loader2, CheckCircle, XCircle, Download } from "lucide-react";

const Flags = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isResolving, setIsResolving] = useState<string | null>(null);

  const flagsQuery = useQuery({
    queryKey: ["flagged-records"],
    queryFn: getFlaggedRecords,
  });

  const records = useMemo(
    () => (flagsQuery.data ?? []).filter((r: any) => r.status?.toLowerCase() !== "resolved"),
    [flagsQuery.data]
  );

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records;
    const lowerQuery = searchQuery.toLowerCase();
    return records.filter((record: any) =>
      Object.values(record).some((val) =>
        String(val).toLowerCase().includes(lowerQuery)
      )
    );
  }, [records, searchQuery]);

  const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
    for (const key of keys) {
      const value = record[key];
      if (value !== null && value !== undefined && value !== "") return String(value);
    }
    return "N/A";
  };

  const handleExport = () => {
    try {
      const headers = [
        "Household ID",
        "Caseworker Name",
        "Caregiver Name",
        "Facility",
        "Comment",
        "Verifier",
        "Status",
        "Created At",
      ];
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [
          headers.join(","),
          ...filteredRecords.map((record: any) =>
            [
              record.household_id,
              record.caseworker_name,
              record.caregiver_name,
              record.facility,
              `"${(record.comment || "").replace(/"/g, '""')}"`, // Escape quotes in comments
              record.verifier,
              record.status,
              record.date_created,
            ].join(",")
          ),
        ].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `district_flagged_records_${user?.location || "all"}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const handleRowClick = (householdId: string) => {
    navigate(`/profile/household-details`, { state: { id: householdId } });
  };

  const resolveMutation = useMutation({
    mutationFn: async ({ id, household_id, vca_id }: { id: string; household_id: string; vca_id: string }) => {
      await updateFlagStatus(id, "resolved");
      const resolver = user ? `${user.first_name} ${user.last_name}` : "Unknown Resolver";
      await notifyUsersOfFlagResolution(household_id, resolver, "Issue marked as resolved via Flags dashboard.", vca_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flagged-records"] });
      queryClient.invalidateQueries({ queryKey: ["recent-flags"] });
      toast.success("Flag resolved successfully", {
        description: "All users have been notified of the resolution.",
      });
      setIsResolving(null);
    },
    onError: (error) => {
      console.error("Error resolving flag:", error);
      toast.error("Failed to resolve flag", {
        description: "An error occurred while updating the status.",
      });
      setIsResolving(null);
    }
  });

  const handleResolve = (e: React.MouseEvent, record: any) => {
    e.stopPropagation();
    setIsResolving(record.id);
    resolveMutation.mutate({
      id: record.id,
      household_id: record.household_id,
      vca_id: record.vca_id
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-amber-100 text-amber-700 hover:bg-amber-100";
      case "approved":
        return "bg-green-100 text-green-700 hover:bg-green-100";
      case "rejected":
        return "bg-red-100 text-red-700 hover:bg-red-100";
      case "resolved":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-100";
    }
  };

  return (
    <DashboardLayout subtitle="Flags">
      <PageIntro
        eyebrow=""
        title=""
        description=""
      />

      <GlowCard>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              <CardTitle>{user?.location} District Flagged Records</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-slate-200 text-slate-600 hover:text-primary transition-all font-bold text-xs"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
          <div className="relative w-full lg:w-64 mt-2 lg:mt-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search records..."
              className="pl-9 border-slate-200 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">HH ID</TableHead>
                  <TableHead className="hidden sm:table-cell">Caseworker</TableHead>
                  <TableHead>Caregiver</TableHead>
                  <TableHead className="hidden md:table-cell">Comment</TableHead>
                  <TableHead className="text-right w-[80px]">Status</TableHead>
                  <TableHead className="text-right w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flagsQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <TableSkeleton rows={6} columns={6} />
                    </TableCell>
                  </TableRow>
                )}

                {!flagsQuery.isLoading && filteredRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                      No flagged records found.
                    </TableCell>
                  </TableRow>
                )}

                {filteredRecords.map((record: any, index: number) => (
                  <TableRow
                    key={record.id || index}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => handleRowClick(record.household_id)}
                  >
                    <TableCell className="font-medium text-primary align-top hidden sm:table-cell">
                      <span className="text-sm">{record.household_id}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell align-top text-sm text-slate-500">{record.caseworker_name}</TableCell>
                    <TableCell className="align-top px-2 sm:px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 sm:hidden">
                          <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1 rounded">{record.household_id}</span>
                        </div>
                        <span className="text-sm font-medium leading-tight">{record.caregiver_name}</span>
                        <div className="mt-1 flex flex-col gap-0.5 sm:hidden">
                          <span className="text-xs text-slate-500 italic truncate max-w-[140px]">{record.facility}</span>
                          <span className="text-xs text-slate-400">
                            {record.date_created ? new Date(record.date_created).toLocaleDateString() : ""} • CW: {record.caseworker_name}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell align-top">
                      <div className="text-sm text-slate-600 leading-snug max-w-[250px] line-clamp-2" title={record.comment}>
                        {record.comment}
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top px-2 sm:px-4">
                      <Badge className={cn("text-xs h-5 px-2 font-normal", getStatusColor(record.status))}>
                        {record.status?.toUpperCase() || "UNKNOWN"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold text-[10px] uppercase tracking-wider"
                        onClick={(e) => handleResolve(e, record)}
                        disabled={isResolving === record.id}
                      >
                        {isResolving === record.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Resolve"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-xs text-slate-400 text-right">
            Showing {filteredRecords.length} records
          </div>
        </CardContent>
      </GlowCard>
    </DashboardLayout>
  );
};

export default Flags;
