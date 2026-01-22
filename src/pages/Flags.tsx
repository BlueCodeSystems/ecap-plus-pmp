import { useState, useMemo } from "react";
import { Flag, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getFlaggedRecords } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Flags = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const flagsQuery = useQuery({
    queryKey: ["flags", "records"],
    queryFn: getFlaggedRecords,
  });

  const records = useMemo(() => flagsQuery.data ?? [], [flagsQuery.data]);

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
    navigate(`/profile/household-profile/${encodeURIComponent(householdId)}`);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-amber-100 text-amber-700 hover:bg-amber-100";
      case "approved":
        return "bg-green-100 text-green-700 hover:bg-green-100";
      case "rejected":
        return "bg-red-100 text-red-700 hover:bg-red-100";
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-100";
    }
  };

  return (
    <DashboardLayout subtitle="Flags">
      <PageIntro
        eyebrow="Flags"
        title="Flagged Records"
        description="Review and resolve flagged issues from data quality checks."
        actions={
          <Button variant="outline" className="border-slate-200" onClick={handleExport}>
            Export to CSV
          </Button>
        }
      />

      <GlowCard>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-primary" />
            <CardTitle>{user?.location} District Flagged Records</CardTitle>
          </div>
          <div className="relative w-full lg:w-64">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {flagsQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm">Loading flagged records</span>
                        <LoadingDots className="text-slate-400" />
                      </div>
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
                      <span className="text-xs">{record.household_id}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell align-top text-[10px] text-slate-500">{record.caseworker_name}</TableCell>
                    <TableCell className="align-top px-2 sm:px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 sm:hidden">
                           <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1 rounded">{record.household_id}</span>
                        </div>
                        <span className="text-sm font-medium leading-tight">{record.caregiver_name}</span>
                        <div className="mt-1 flex flex-col gap-0.5 sm:hidden">
                          <span className="text-[10px] text-slate-500 italic truncate max-w-[140px]">{record.facility}</span>
                          <span className="text-[10px] text-slate-400">
                             {record.date_created ? new Date(record.date_created).toLocaleDateString() : ""} • CW: {record.caseworker_name}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell align-top">
                      <div className="text-[10px] text-slate-600 leading-tight max-w-[200px] line-clamp-2" title={record.comment}>
                        {record.comment}
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top px-2 sm:px-4">
                      <Badge className={cn("text-[9px] h-4.5 px-1 font-normal", getStatusColor(record.status))}>
                        {record.status?.toUpperCase() || "UNKNOWN"}
                      </Badge>
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
