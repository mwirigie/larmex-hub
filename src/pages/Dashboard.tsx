import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, FolderOpen, Heart, CreditCard, MessageSquare,
  LogOut, Loader2, FileText, BarChart3, Shield, Eye,
  ArrowRight, BedDouble, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import planPlaceholder from "@/assets/plan-placeholder.jpg";

interface DashboardStats {
  projects: number;
  favorites: number;
  purchases: number;
  messages: number;
}

interface RecentPurchase {
  id: string;
  amount_kes: number;
  status: string;
  created_at: string;
  plan_id: string;
}

interface RecentRequest {
  id: string;
  title: string;
  status: string;
  budget_kes: number | null;
  county: string | null;
  created_at: string;
  professional_name?: string;
}

export default function Dashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ projects: 0, favorites: 0, purchases: 0, messages: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (!loading && user && role === "admin") navigate("/ctrl-panel-lmx");
    if (!loading && user && role === "professional") navigate("/professional-dashboard");
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user && role === "client") fetchDashboardData();
  }, [user, role]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setStatsLoading(true);

    const [favRes, msgRes, purchRes, reqRes] = await Promise.all([
      supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("is_read", false),
      supabase.from("plan_purchases").select("id, amount_kes, status, created_at, plan_id").eq("client_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("project_requests").select("id, title, status, budget_kes, county, created_at, professional_id").eq("client_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]);

    setStats({
      favorites: favRes.count || 0,
      messages: msgRes.count || 0,
      purchases: (purchRes.data || []).length,
      projects: (reqRes.data || []).length,
    });

    setRecentPurchases(purchRes.data || []);

    // Enrich requests with professional names
    const reqs = reqRes.data || [];
    if (reqs.length > 0) {
      const profIds = [...new Set(reqs.map((r: any) => r.professional_id).filter(Boolean))];
      if (profIds.length > 0) {
        const { data: profProfiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", profIds);
        const nameMap = new Map((profProfiles || []).map((p) => [p.user_id, p.full_name]));
        setRecentRequests(reqs.map((r: any) => ({ ...r, professional_name: nameMap.get(r.professional_id) || "Unassigned" })));
      } else {
        setRecentRequests(reqs);
      }
    } else {
      setRecentRequests([]);
    }

    setStatsLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || role !== "client") return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": case "approved": case "accepted": return "bg-emerald-500/10 text-emerald-600";
      case "pending": return "bg-amber-500/10 text-amber-600";
      case "rejected": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">Larmex Hub</span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">Client</Badge>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Welcome */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Welcome back, {user.user_metadata?.full_name || "there"}!
              </h1>
              <p className="text-sm text-muted-foreground">Track your projects and saved plans.</p>
            </div>
            <div className="flex gap-3">
              <Button asChild><Link to="/messages"><MessageSquare className="mr-2 h-4 w-4" /> Messages</Link></Button>
              <Button asChild variant="secondary"><Link to="/hire">Hire Professional</Link></Button>
              <Button variant="outline" asChild><Link to="/browse">Browse Plans</Link></Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard icon={FolderOpen} title="My Projects" value={stats.projects.toString()} desc="Active projects" loading={statsLoading} />
            <StatCard icon={Heart} title="Saved Plans" value={stats.favorites.toString()} desc="Favorited plans" loading={statsLoading} />
            <StatCard icon={CreditCard} title="Purchases" value={stats.purchases.toString()} desc="Plans purchased" loading={statsLoading} />
            <StatCard icon={MessageSquare} title="Messages" value={stats.messages.toString()} desc="Unread" loading={statsLoading} />
          </div>

          {/* Hire by Category */}
          <div className="mb-6">
            <h2 className="font-display text-lg font-semibold text-foreground mb-3">Hire a Professional</h2>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <Link to="/hire?category=architect" className="rounded-xl border border-border bg-card p-4 text-center hover:shadow-md hover:border-primary/30 transition-all">
                <Building2 className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="font-semibold text-foreground text-sm">Hire Architect</p>
              </Link>
              <Link to="/hire?category=structural_engineer" className="rounded-xl border border-border bg-card p-4 text-center hover:shadow-md hover:border-primary/30 transition-all">
                <Shield className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="font-semibold text-foreground text-sm">Hire Structural Engineer</p>
              </Link>
              <Link to="/hire?category=quantity_surveyor" className="rounded-xl border border-border bg-card p-4 text-center hover:shadow-md hover:border-primary/30 transition-all">
                <BarChart3 className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="font-semibold text-foreground text-sm">Hire Quantity Surveyor</p>
              </Link>
              <Link to="/hire?category=site_supervisor" className="rounded-xl border border-border bg-card p-4 text-center hover:shadow-md hover:border-primary/30 transition-all">
                <Eye className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="font-semibold text-foreground text-sm">Request Site Supervision</p>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="projects">
            <TabsList>
              <TabsTrigger value="projects">My Projects</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>

            {/* Projects Tab */}
            <TabsContent value="projects" className="mt-4">
              {recentRequests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FolderOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <h3 className="font-display font-semibold text-foreground">No projects yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">Start a project by hiring a professional.</p>
                    <Button className="mt-4" asChild><Link to="/hire">Hire Professional</Link></Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {recentRequests.map((req) => (
                    <Card key={req.id}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{req.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            {req.professional_name && <span>Pro: {req.professional_name}</span>}
                            {req.county && <span>{req.county}</span>}
                            {req.budget_kes && <span>KES {req.budget_kes.toLocaleString()}</span>}
                            <span>{new Date(req.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge className={`${getStatusColor(req.status)} capitalize`}>{req.status}</Badge>
                          {(req as any).professional_id && (
                            <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                              <Link to={`/messages/${(req as any).professional_id}`} state={{ from: "/dashboard" }}><Mail className="mr-1 h-3 w-3" /> Message</Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Purchases Tab */}
            <TabsContent value="purchases" className="mt-4">
              {recentPurchases.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <CreditCard className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <h3 className="font-display font-semibold text-foreground">No purchases yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">Browse and purchase house plans.</p>
                    <Button className="mt-4" asChild><Link to="/browse">Browse Plans</Link></Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {recentPurchases.map((p) => (
                    <Card key={p.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-semibold text-foreground">KES {p.amount_kes.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge className={`${getStatusColor(p.status)} capitalize`}>{p.status}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="mt-4">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Heart className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <h3 className="font-display font-semibold text-foreground">Your saved plans</h3>
                  <p className="text-sm text-muted-foreground mt-1">Plans you've favorited will appear here.</p>
                  <Button className="mt-4" asChild><Link to="/browse">Browse Plans</Link></Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, desc, loading }: { icon: any; title: string; value: string; desc: string; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <p className="font-display text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
