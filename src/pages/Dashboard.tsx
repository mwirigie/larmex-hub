import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, FolderOpen, Heart, CreditCard, MessageSquare, Upload, BarChart3, LogOut,
  Shield, Plus, Loader2, Eye, FileText, Star, Clock, DollarSign, TrendingUp,
  CheckCircle2, AlertCircle, ArrowRight, BedDouble
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import planPlaceholder from "@/assets/plan-placeholder.jpg";

interface DashboardStats {
  projects: number;
  favorites: number;
  purchases: number;
  messages: number;
  plans: number;
  requests: number;
  earnings: number;
  views: number;
}

interface RecentPlan {
  id: string;
  title: string;
  house_type: string;
  price_kes: number;
  thumbnail_url: string | null;
  view_count: number;
  status: string;
  bedrooms: number;
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
}

export default function Dashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ projects: 0, favorites: 0, purchases: 0, messages: 0, plans: 0, requests: 0, earnings: 0, views: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentPlans, setRecentPlans] = useState<RecentPlan[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    // If admin, redirect to admin panel
    if (!loading && user && role === "admin") navigate("/ctrl-panel-lmx");
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user, role]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setStatsLoading(true);
    const isProf = role === "professional";

    const [favRes, msgRes, purchRes, planRes, reqRes, earnRes] = await Promise.all([
      supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("is_read", false),
      supabase.from("plan_purchases").select("id, amount_kes, status, created_at, plan_id").eq("client_id", user.id).order("created_at", { ascending: false }).limit(5),
      isProf
        ? supabase.from("house_plans").select("id, title, house_type, price_kes, thumbnail_url, view_count, status, bedrooms").eq("professional_id", user.id).order("created_at", { ascending: false }).limit(6)
        : Promise.resolve({ data: [], count: 0 }),
      supabase.from("project_requests").select("id, title, status, budget_kes, county, created_at")
        .or(isProf ? `professional_id.eq.${user.id}` : `client_id.eq.${user.id}`)
        .order("created_at", { ascending: false }).limit(5),
      isProf
        ? supabase.from("transactions").select("amount_kes").eq("user_id", user.id).eq("status", "completed")
        : Promise.resolve({ data: [] }),
    ]);

    const totalEarnings = (earnRes as any).data?.reduce((sum: number, t: any) => sum + Number(t.amount_kes), 0) || 0;
    const totalViews = isProf ? ((planRes as any).data?.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0) || 0) : 0;

    setStats({
      favorites: favRes.count || 0,
      messages: msgRes.count || 0,
      purchases: (purchRes as any).data?.length || 0,
      plans: isProf ? ((planRes as any).data?.length || 0) : 0,
      requests: (reqRes as any).data?.length || 0,
      projects: (reqRes as any).data?.length || 0,
      earnings: totalEarnings,
      views: totalViews,
    });

    if (isProf) setRecentPlans((planRes as any).data || []);
    setRecentPurchases((purchRes as any).data || []);
    setRecentRequests((reqRes as any).data || []);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": case "approved": return "bg-emerald-500/10 text-emerald-600";
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
            {isProf && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3 text-primary" /> Professional
              </Badge>
            )}
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
              <p className="text-sm text-muted-foreground">
                {isProf ? "Manage your plans, requests, and earnings." : "Track your projects and saved plans."}
              </p>
            </div>
            <div className="flex gap-3">
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
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
            {isProf ? (
              <>
                <StatCard icon={Upload} title="My Plans" value={stats.plans.toString()} desc="Listed plans" loading={statsLoading} />
                <StatCard icon={Eye} title="Total Views" value={stats.views.toLocaleString()} desc="Plan views" loading={statsLoading} />
                <StatCard icon={DollarSign} title="Earnings" value={`KES ${stats.earnings.toLocaleString()}`} desc="Total earnings" loading={statsLoading} />
                <StatCard icon={MessageSquare} title="Messages" value={stats.messages.toString()} desc="Unread" loading={statsLoading} />
              </>
            ) : (
              <>
                <StatCard icon={FolderOpen} title="My Projects" value={stats.projects.toString()} desc="Active projects" loading={statsLoading} />
                <StatCard icon={Heart} title="Saved Plans" value={stats.favorites.toString()} desc="Favorited plans" loading={statsLoading} />
                <StatCard icon={CreditCard} title="Purchases" value={stats.purchases.toString()} desc="Plans purchased" loading={statsLoading} />
                <StatCard icon={MessageSquare} title="Messages" value={stats.messages.toString()} desc="Unread" loading={statsLoading} />
              </>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue={isProf ? "plans" : "projects"}>
            <TabsList>
              {isProf ? (
                <>
                  <TabsTrigger value="plans">My Plans</TabsTrigger>
                  <TabsTrigger value="requests">Requests</TabsTrigger>
                  <TabsTrigger value="earnings">Earnings</TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="purchases">Purchases</TabsTrigger>
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Professional: Plans Tab */}
            {isProf && (
              <TabsContent value="plans" className="mt-4">
                {recentPlans.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Upload className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <h3 className="font-display font-semibold text-foreground">No plans yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">Upload your first house plan to start selling.</p>
                      <Button className="mt-4" asChild><Link to="/plans/new"><Plus className="mr-2 h-4 w-4" /> Upload Plan</Link></Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recentPlans.map((plan) => (
                      <Card key={plan.id} className="overflow-hidden">
                        <div className="aspect-[16/10] relative">
                          <img src={plan.thumbnail_url || planPlaceholder} alt={plan.title} className="h-full w-full object-cover" />
                          <Badge className={`absolute top-2 right-2 ${getStatusColor(plan.status)} capitalize`}>{plan.status}</Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-display font-semibold text-foreground truncate">{plan.title}</h3>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-bold text-foreground">KES {plan.price_kes.toLocaleString()}</span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-3 w-3" />{plan.view_count}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* Requests Tab (shared) */}
            <TabsContent value={isProf ? "requests" : "projects"} className="mt-4">
              {recentRequests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FolderOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <h3 className="font-display font-semibold text-foreground">No {isProf ? "requests" : "projects"} yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isProf ? "Incoming project requests will appear here." : "Start a project request to hire a professional."}
                    </p>
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
                            {req.county && <span>{req.county}</span>}
                            {req.budget_kes && <span>KES {req.budget_kes.toLocaleString()}</span>}
                            <span>{new Date(req.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(req.status)} capitalize shrink-0`}>{req.status}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Professional: Earnings Tab */}
            {isProf && (
              <TabsContent value="earnings" className="mt-4">
                <div className="grid gap-4 sm:grid-cols-3 mb-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Total Earnings</p>
                      <p className="font-display text-2xl font-bold text-foreground mt-1">KES {stats.earnings.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Plans Sold</p>
                      <p className="font-display text-2xl font-bold text-foreground mt-1">{stats.purchases}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">Total Views</p>
                      <p className="font-display text-2xl font-bold text-foreground mt-1">{stats.views.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <TrendingUp className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <h3 className="font-display font-semibold text-foreground">Detailed analytics coming soon</h3>
                    <p className="text-sm text-muted-foreground mt-1">Revenue charts, withdrawal history, and tax summaries.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Client: Purchases Tab */}
            {!isProf && (
              <TabsContent value="purchases" className="mt-4">
                {recentPurchases.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <CreditCard className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <h3 className="font-display font-semibold text-foreground">No purchases yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">Browse and purchase house plans to see them here.</p>
                      <Button className="mt-4" asChild><Link to="/browse">Browse Plans</Link></Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {recentPurchases.map((p) => (
                      <Card key={p.id}>
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
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
            )}

            {/* Client: Favorites Tab */}
            {!isProf && (
              <TabsContent value="favorites" className="mt-4">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Heart className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <h3 className="font-display font-semibold text-foreground">{stats.favorites} saved plans</h3>
                    <p className="text-sm text-muted-foreground mt-1">View your favorited plans in the browse section.</p>
                    <Button className="mt-4" variant="outline" asChild><Link to="/browse">View Saved Plans</Link></Button>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, desc, loading }: { icon: any; title: string; value: string; desc: string; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <p className="font-display text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
