import { useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Users, Shield, CreditCard, AlertTriangle, LogOut, Building2, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_BASE = "/ctrl-panel-lmx";

const navItems = [
  { label: "Dashboard", path: ADMIN_BASE, icon: LayoutDashboard },
  { label: "House Plans", path: `${ADMIN_BASE}/plans`, icon: FileText },
  { label: "Users", path: `${ADMIN_BASE}/users`, icon: Users },
  { label: "Professionals", path: `${ADMIN_BASE}/professionals`, icon: Shield },
  { label: "Transactions", path: `${ADMIN_BASE}/transactions`, icon: CreditCard },
];

export default function AdminLayout() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      navigate("/auth");
    }
  }, [user, role, loading, navigate]);

  // Timeout fallback: if loading takes more than 3 seconds, redirect
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        navigate("/auth");
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 w-60 border-r border-border bg-card hidden md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">Admin Panel</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
              (item.path !== ADMIN_BASE && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 space-y-2">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Site
          </Link>
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between px-4">
          <span className="font-display font-bold text-foreground">Admin</span>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex overflow-x-auto border-t border-border px-2 py-1.5 gap-1">
          {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
              (item.path !== ADMIN_BASE && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-60 mt-[6.5rem] md:mt-0">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
