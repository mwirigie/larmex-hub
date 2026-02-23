import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, FolderOpen, Heart, CreditCard, MessageSquare, Upload, BarChart3, LogOut, Shield, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  projects: number;
  favorites: number;
  purchases: number;
  messages: number;
  plans: number;
  requests: number;
  earnings: number;
}

export default function Dashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ projects: 0, favorites: 0, purchases: 0, messages: 0, plans: 0, requests: 0, earnings: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchStats();
  }, [user, role]);

  const fetchStats = async () => {
    if (!user) return;
    setStatsLoading(true);

    const isProf = role === "professional";

    const [favRes, msgRes, purchRes, planRes, reqRes, earnRes] = await Promise.all([
      supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("is_read", false),
      supabase.from("plan_purchases").select("id", { count: "exact", head: true }).eq("client_id", user.id),
      isProf ? supabase.from("house_plans").select("id", { count: "exact", head: true }).eq("professional_id", user.id) : Promise.resolve({ count: 0 }),
      isProf ? supabase.from("project_requests").select("id", { count: "exact", head: true }).eq("professional_id", user.id) : supabase.from("project_requests").select("id", { count: "exact", head: true }).eq("client_id", user.id),
      isProf ? supabase.from("transactions").select("amount_kes").eq("user_id", user.id).eq("status", "completed") : Promise.resolve({ data: [] }),
    ]);

    const totalEarnings = (earnRes as any).data?.reduce((sum: number, t: any) => sum + Number(t.amount_kes), 0) || 0;

    setStats({
      favorites: favRes.count || 0,
      messages: msgRes.count || 0,
      purchases: purchRes.count || 0,
      plans: (planRes as any).count || 0,
      requests: reqRes.count || 0,
      projects: reqRes.count || 0,
      earnings: totalEarnings,
    });
    setStatsLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const isProf = role === "professional";

  const clientCards = [
    { icon: FolderOpen, title: "My Projects", value: stats.projects.toString(), desc: "Active projects" },
    { icon: Heart, title: "Saved Plans", value: stats.favorites.toString(), desc: "Favorited plans" },
    { icon: CreditCard, title: "Purchases", value: stats.purchases.toString(), desc: "Plans purchased" },
    { icon: MessageSquare, title: "Messages", value: stats.messages.toString(), desc: "Unread messages" },
  ];

  const profCards = [
    { icon: Upload, title: "My Plans", value: stats.plans.toString(), desc: "Listed plans" },
    { icon: FolderOpen, title: "Requests", value: stats.requests.toString(), desc: "Project requests" },
    { icon: BarChart3, title: "Earnings", value: `KES ${stats.earnings.toLocaleString()}`, desc: "Total earnings" },
    { icon: MessageSquare, title: "Messages", value: stats.messages.toString(), desc: "Unread messages" },
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

          <div className="mb-6 flex gap-3">
            {isProf ? (
              <Button asChild>
                <Link to="/plans/new"><Plus className="mr-2 h-4 w-4" /> Upload Plan</Link>
              </Button>
            ) : (
              <>
                <Button asChild><Link to="/browse">Browse Plans</Link></Button>
                <Button variant="outline" asChild><Link to="/calculator">Cost Calculator</Link></Button>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, i) => (
              <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                    <card.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <p className="font-display text-2xl font-bold">{card.value}</p>
                        <p className="text-xs text-muted-foreground">{card.desc}</p>
                      </>
                    )}
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
