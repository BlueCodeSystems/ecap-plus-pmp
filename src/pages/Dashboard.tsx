import DashboardLayout from "@/components/dashboard/DashboardLayout";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import DataQualityChart from "@/components/dashboard/DataQualityChart";
import ProvincialBreakdown from "@/components/dashboard/ProvincialBreakdown";
import RecentActivity from "@/components/dashboard/RecentActivity";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import CalendarWidget from "@/components/dashboard/CalendarWidget";

const Dashboard = () => {
  return (
    <DashboardLayout subtitle="Home">
      <WelcomeBanner />

      <MetricsGrid />

      <div className="grid grid-cols-1 gap-6">
        <DataQualityChart />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RecentActivity />
        <CalendarWidget />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
