import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, FileText, DollarSign, Shield, Eye, TrendingUp, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  totalUsers: number;
  totalPlans: number;
  pendingPlans: number;
  approvedPlans: number;
  totalProfessionals: number;
  pendingVerifications: number;
  totalRevenue: number;
  totalViews: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [usersRes, plansRes, pendingRes, approvedRes, profsRes, pendVerifRes, revenueRes, viewsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("house_plans").select("id", { count: "exact", head: true }),
      supabase.from("house_plans").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("house_plans").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("professional_profiles").select("id", { count: "exact", head: true }),
      supabase.from("professional_profiles").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
      supabase.from("transactions").select("amount_kes").eq("status", "completed"),
      supabase.from("house_plans").select("view_count"),
    ]);

    const totalRevenue = (revenueRes.data || []).reduce((sum, t) => sum + Number(t.amount_kes), 0);
    const totalViews = (viewsRes.data || []).reduce((sum, p) => sum + (p.view_count || 0), 0);

    setStats({
      totalUsers: usersRes.count || 0,
      totalPlans: plansRes.count || 0,
      pendingPlans: pendingRes.count || 0,
      approvedPlans: approvedRes.count || 0,
      totalProfessionals: profsRes.count || 0,
      pendingVerifications: pendVerifRes.count || 0,
      totalRevenue,
      totalViews,
    });
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!stats) return null;

  const cards = [
    { icon: Users, title: "Total Users", value: stats.totalUsers.toString(), color: "text-blue-500" },
    { icon: FileText, title: "Total Plans", value: stats.totalPlans.toString(), color: "text-emerald-500" },
    { icon: AlertCircle, title: "Pending Plans", value: stats.pendingPlans.toString(), color: "text-amber-500" },
    { icon: CheckCircle2, title: "Approved Plans", value: stats.approvedPlans.toString(), color: "text-emerald-500" },
    { icon: Shield, title: "Professionals", value: stats.totalProfessionals.toString(), color: "text-violet-500" },
    { icon: AlertCircle, title: "Pending Verifications", value: stats.pendingVerifications.toString(), color: "text-amber-500" },
    { icon: DollarSign, title: "Total Revenue", value: `KES ${stats.totalRevenue.toLocaleString()}`, color: "text-emerald-500" },
    { icon: Eye, title: "Total Views", value: stats.totalViews.toLocaleString(), color: "text-blue-500" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Admin Dashboard</h1>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <p className="font-display text-2xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
