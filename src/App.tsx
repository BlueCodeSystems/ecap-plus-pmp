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
import IndexMotherRegister from "./pages/IndexMotherRegister";
import VcaServices from "./pages/VcaServices";
import CaregiverServices from "./pages/CaregiverServices";
import Flags from "./pages/Flags";
import HouseholdArchivedRegister from "./pages/HouseholdArchivedRegister";
import VcaArchivedRegister from "./pages/VcaArchivedRegister";
import Charts from "./pages/Charts";
import Users from "./pages/Users";
import AddUser from "./pages/AddUser";
import EditUser from "./pages/EditUser";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
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
              path="/index-mothers"
              element={
                <ProtectedRoute>
                  <IndexMotherRegister />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
