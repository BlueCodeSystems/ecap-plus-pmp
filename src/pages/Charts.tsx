import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import DataQualityChart from "@/components/dashboard/DataQualityChart";
import ProvincialBreakdown from "@/components/dashboard/ProvincialBreakdown";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { Button } from "@/components/ui/button";

const Charts = () => {
  return (
    <DashboardLayout subtitle="Charts">
      <PageIntro
        eyebrow="Charts"
        title="Visualize trends across program delivery."
        description="See where data quality is improving, where coverage is slowing, and what needs immediate attention."
        actions={
          <Button variant="outline" className="border-slate-200">
            Export Charts
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataQualityChart />
        <ProvincialBreakdown />
      </div>

      <RecentActivity />
    </DashboardLayout>
  );
};

export default Charts;
