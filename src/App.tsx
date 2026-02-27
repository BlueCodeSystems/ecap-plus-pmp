import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "@/context/ThemeContext";

// --- CORE PAGES (Eagerly Loaded for instant navigation) ---
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import HouseholdRegister from "./pages/HouseholdRegister";
import VcaRegister from "./pages/VcaRegister";
import HouseholdServices from "./pages/HouseholdServices";
import HouseholdServicesPage from "./pages/HouseholdServicesPage";
import VcaServices from "./pages/VcaServicesDashboard";
import CaregiverServices from "./pages/CaregiverServices";
import Caseworkers from "./pages/CaseworkerServices";
import HTSRegister from "./pages/HTSRegister";
import PMTCTRegister from "./pages/PMTCTRegister";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import HouseholdProfile from "./pages/HouseholdProfile";
import VcaProfile from "./pages/VcaProfile";
import HTSProfile from "./pages/HTSProfile";
import VcaServiceProfile from "./pages/VcaServiceProfile";
import HouseholdServiceProfile from "./pages/HouseholdServiceProfile";
import CaregiverServiceProfile from "./pages/CaregiverServiceProfile";
import CaregiverRiskRegister from "./pages/CaregiverRiskRegister";
import VcaRiskRegister from "./pages/VcaRiskRegister";
import HouseholdRiskRegister from "./pages/HouseholdRiskRegister";
import HTSRiskRegister from "./pages/HTSRiskRegister";
import CaseworkerRegister from "./pages/CaseworkerRegister";
import CaseworkerProfile from "./pages/CaseworkerProfile";


// --- SECONDARY / HEAVY PAGES (Lazy Loaded to keep initial bundle size optimized) ---
const Districts = lazy(() => import("./pages/Districts"));
const Flags = lazy(() => import("./pages/Flags"));
const HouseholdArchivedRegister = lazy(() => import("./pages/HouseholdArchivedRegister"));
const VcaArchivedRegister = lazy(() => import("./pages/VcaArchivedRegister"));
const Charts = lazy(() => import("./pages/Charts"));
const AddUser = lazy(() => import("./pages/AddUser"));
const EditUser = lazy(() => import("./pages/EditUser"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FlaggedRecordForm = lazy(() => import("./pages/FlaggedRecordForm"));
const WeeklyExtracts = lazy(() => import("./pages/WeeklyExtracts"));
const SupportCenter = lazy(() => import("./pages/SupportCenter"));
const Calendar = lazy(() => import("./pages/Calendar"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-50/30 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
      <p className="text-[10px] font-bold text-slate-400 tracking-widest pl-1">Loading</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/districts"
                  element={
                    <ProtectedRoute>
                      <Districts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/households"
                  element={
                    <ProtectedRoute>
                      <HouseholdRegister />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vcas"
                  element={
                    <ProtectedRoute>
                      <VcaRegister />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/registers/hts"
                  element={
                    <ProtectedRoute>
                      <HTSRegister />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/registers/hts-risk"
                  element={
                    <ProtectedRoute>
                      <HTSRiskRegister />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/registers/pmtct"
                  element={
                    <ProtectedRoute>
                      <PMTCTRegister />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vca-services"
                  element={
                    <ProtectedRoute>
                      <VcaServices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/registers/vca-risk"
                  element={
                    <ProtectedRoute>
                      <VcaRiskRegister />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/household-services"
                  element={
                    <ProtectedRoute>
                      <HouseholdServices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/registers/household-risk"
                  element={
                    <ProtectedRoute>
                      <HouseholdRiskRegister />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/caregiver-services"
                  element={
                    <ProtectedRoute>
                      <CaregiverServices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/registers/caregiver-risk"
                  element={
                    <ProtectedRoute>
                      <CaregiverRiskRegister />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/caseworkers"
                  element={
                    <ProtectedRoute>
                      <Caseworkers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/registers/caseworker-drilldown"
                  element={
                    <ProtectedRoute>
                      <CaseworkerRegister />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/caseworker-details"
                  element={
                    <ProtectedRoute>
                      <CaseworkerProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/services/household-services"
                  element={
                    <ProtectedRoute>
                      <HouseholdServicesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/flags"
                  element={
                    <ProtectedRoute>
                      <Flags />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/households/archived"
                  element={
                    <ProtectedRoute>
                      <HouseholdArchivedRegister />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vcas/archived"
                  element={
                    <ProtectedRoute>
                      <VcaArchivedRegister />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/charts"
                  element={
                    <ProtectedRoute>
                      <Charts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/new"
                  element={
                    <ProtectedRoute>
                      <AddUser />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/:id/edit"
                  element={
                    <ProtectedRoute>
                      <EditUser />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/household-details"
                  element={
                    <ProtectedRoute>
                      <HouseholdProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/vca-details"
                  element={
                    <ProtectedRoute>
                      <VcaProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/hts-details"
                  element={
                    <ProtectedRoute>
                      <HTSProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/vca-service-details"
                  element={
                    <ProtectedRoute>
                      <VcaServiceProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/household-service-details"
                  element={
                    <ProtectedRoute>
                      <HouseholdServiceProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/caregiver-service-details"
                  element={
                    <ProtectedRoute>
                      <CaregiverServiceProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/flagged-record-form"
                  element={
                    <ProtectedRoute>
                      <FlaggedRecordForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/weekly-extracts"
                  element={
                    <ProtectedRoute>
                      <WeeklyExtracts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/support"
                  element={
                    <ProtectedRoute>
                      <SupportCenter />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <Calendar />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
