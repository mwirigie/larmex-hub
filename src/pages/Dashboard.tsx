import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, FolderOpen, Heart, CreditCard, MessageSquare, Upload, BarChart3, Settings, LogOut, Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const isProf = role === "professional";

  const clientCards = [
    { icon: FolderOpen, title: "My Projects", value: "0", desc: "Active projects" },
    { icon: Heart, title: "Saved Plans", value: "0", desc: "Favorited plans" },
    { icon: CreditCard, title: "Purchases", value: "0", desc: "Plans purchased" },
    { icon: MessageSquare, title: "Messages", value: "0", desc: "Unread messages" },
  ];

  const profCards = [
    { icon: Upload, title: "My Plans", value: "0", desc: "Listed plans" },
    { icon: FolderOpen, title: "Requests", value: "0", desc: "Project requests" },
    { icon: BarChart3, title: "Earnings", value: "KES 0", desc: "Total earnings" },
    { icon: MessageSquare, title: "Messages", value: "0", desc: "Unread messages" },
  ];

  const cards = isProf ? profCards : clientCards;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">JengaHub</span>
          </Link>
          <div className="flex items-center gap-3">
            {isProf && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-primary" /> Professional
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Welcome back, {user.user_metadata?.full_name || "there"}!
            </h1>
            <p className="text-sm text-muted-foreground">
              {isProf ? "Manage your plans, requests, and earnings." : "Track your projects and saved plans."}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-6 flex gap-3">
            {isProf ? (
              <Button asChild>
                <Link to="/plans/new"><Plus className="mr-2 h-4 w-4" /> Upload Plan</Link>
              </Button>
            ) : (
              <>
                <Button asChild>
                  <Link to="/browse">Browse Plans</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/calculator">Cost Calculator</Link>
                </Button>
              </>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                    <card.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
