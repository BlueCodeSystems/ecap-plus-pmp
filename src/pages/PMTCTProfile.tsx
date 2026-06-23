import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pick = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") return String(value);
  }
  return "N/A";
};

const PMTCTProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const record = ((location.state as { record?: Record<string, unknown> } | null)?.record ?? {}) as Record<string, unknown>;

  const id = pick(record, ["pmtct_id", "ecap_id", "ca_id", "id"]);
  const facility = pick(record, ["facility", "facility_name", "health_facility"]);
  const district = pick(record, ["district", "district_name"]);
  const hiv = pick(record, ["result_of_hiv_test", "result_r_nr", "test_result_at_birth", "infant_hiv_status", "hiv_status"]);

  return (
    <DashboardLayout subtitle={`PMTCT Profile: ${id}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">PMTCT profile</div>
            <h1 className="mt-2 text-2xl font-black text-slate-900">{id}</h1>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ["District", district],
            ["Facility", facility],
            ["HIV Status", hiv],
          ].map(([label, value]) => (
            <GlowCard key={label} className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
              <div className="mt-2 text-base font-semibold text-slate-800">{value}</div>
            </GlowCard>
          ))}
        </div>

        <GlowCard className="p-5">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">PMTCT record</Badge>
            <Badge variant="outline">{pick(record, ["date_enrolled_pmtct", "date_1st_visit", "dbs_at_birth_actual_date"])}</Badge>
          </div>
          <pre className="overflow-auto rounded-xl bg-slate-50 p-4 text-xs leading-6">{JSON.stringify(record, null, 2)}</pre>
        </GlowCard>
      </div>
    </DashboardLayout>
  );
};

export default PMTCTProfile;
