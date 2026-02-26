import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";

import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

const Charts = () => {
  return (
    <DashboardLayout subtitle="Charts">
      <PageIntro

        title="Program Dashboard"

      />

      <div className="space-y-6">


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
                {/* <Button
                  onClick={() => window.open(import.meta.env.VITE_SUPERSET_DASHBOARD_URL, "_blank")}
                  variant="outline"
                >
                  Open Dashboard in New Tab
                </Button> */}
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
