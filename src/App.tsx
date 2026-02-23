import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import BrowsePlans from "./pages/BrowsePlans";
import PlanDetail from "./pages/PlanDetail";
import Dashboard from "./pages/Dashboard";
import Calculator from "./pages/Calculator";
import Profile from "./pages/Profile";
import UploadPlan from "./pages/UploadPlan";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProfessionals from "./pages/admin/AdminProfessionals";
import AdminTransactions from "./pages/admin/AdminTransactions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/browse" element={<BrowsePlans />} />
              <Route path="/plans/:id" element={<PlanDetail />} />
              <Route path="/plans/new" element={<UploadPlan />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/profile" element={<Profile />} />
              {/* Admin Panel - obscured route */}
              <Route path="/ctrl-panel-lmx" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="plans" element={<AdminPlans />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="professionals" element={<AdminProfessionals />} />
                <Route path="transactions" element={<AdminTransactions />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MobileNav />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
