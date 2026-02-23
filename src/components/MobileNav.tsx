import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Calculator, FolderOpen, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Browse", icon: Search, path: "/browse" },
  { label: "Calculator", icon: Calculator, path: "/calculator" },
  { label: "Projects", icon: FolderOpen, path: "/dashboard" },
  { label: "Profile", icon: User, path: "/profile" },
];

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNav = (path: string) => {
    if ((path === "/dashboard" || path === "/profile") && !user) {
      navigate("/auth");
    } else {
      navigate(path);
    }
  };

  // Don't show on auth or admin pages
  if (location.pathname === "/auth" || location.pathname.startsWith("/ctrl-panel-lmx")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.label}
              onClick={() => handleNav(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
