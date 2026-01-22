import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

const Charts = () => {
  return (
    <DashboardLayout subtitle="Charts">
      <PageIntro
        eyebrow="Visualization"
        title="Program Dashboard"
        description="Comprehensive view of program performance and trends."
      />

      <div className="space-y-6">
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Notice</AlertTitle>
          <AlertDescription className="text-blue-700">
            Some features, such as filtering and interaction with charts, depend on
            your permissions and may not be filtered based on user or province
            location. Contact admin or support for access.
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm min-h-[500px] flex flex-col relative">
          {/* 
            The Superset server sends a Content Security Policy (CSP) header "frame-ancestors" 
            that only allows embedding on specific domains (e.g., https://ecapplus.dqa.bluecodeltd.com).
            Browsers will block the iframe when running on localhost. This fallback handles that case.
          */}
          {window.location.hostname === "localhost" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/90 p-6 text-center backdrop-blur-sm">
              <div className="max-w-md space-y-4">
                <Info className="mx-auto h-12 w-12 text-blue-500 opacity-50" />
                <h3 className="text-lg font-semibold text-slate-900">
                  Dashboard Embedding Restricted Locally
                </h3>
                <p className="text-sm text-slate-600">
                  The security policy of the dashboard server prevents it from being displayed inside an iframe on <code>localhost</code>.
                  It will appear correctly when deployed to the production domain.
                </p>
                <Button
                  onClick={() => window.open(import.meta.env.VITE_SUPERSET_DASHBOARD_URL, "_blank")}
                  variant="outline"
                >
                  Open Dashboard in New Tab
                </Button>
              </div>
            </div>
          )}



          <iframe
            src={import.meta.env.VITE_SUPERSET_DASHBOARD_URL}
            style={{ width: "100%", height: "80vh", border: "none" }}
            title="Superset Dashboard"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Charts;
