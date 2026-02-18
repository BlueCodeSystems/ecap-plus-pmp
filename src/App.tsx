import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Districts from "./pages/Districts";
import HouseholdRegister from "./pages/HouseholdRegister";
import VcaRegister from "./pages/VcaRegister";
import HouseholdServices from "./pages/HouseholdServices";
import VcaServices from "./pages/VcaServicesDashboard";
import CaregiverServices from "./pages/CaregiverServices";
import Flags from "./pages/Flags";
import HouseholdArchivedRegister from "./pages/HouseholdArchivedRegister";
import VcaArchivedRegister from "./pages/VcaArchivedRegister";
import Charts from "./pages/Charts";
import Users from "./pages/Users";
import AddUser from "./pages/AddUser";
import EditUser from "./pages/EditUser";
import Profile from "./pages/Profile";
import HouseholdProfile from "./pages/HouseholdProfile";
import VcaProfile from "./pages/VcaProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import FlaggedRecordForm from "./pages/FlaggedRecordForm";
import WeeklyExtracts from "./pages/WeeklyExtracts";
import SupportCenter from "./pages/SupportCenter";
import Calendar from "./pages/Calendar";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "@/context/ThemeContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
                path="/vca-services"
                element={
                  <ProtectedRoute>
                    <VcaServices />
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
                path="/caregiver-services"
                element={
                  <ProtectedRoute>
                    <CaregiverServices />
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
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
