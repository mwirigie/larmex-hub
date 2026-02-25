import { useEffect, useState } from "react";
import { Loader2, Check, X, Eye, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import planPlaceholder from "@/assets/plan-placeholder.jpg";

interface PlanRow {
  id: string;
  title: string;
  house_type: string;
  bedrooms: number;
  bathrooms: number;
  price_kes: number;
  status: string;
  thumbnail_url: string | null;
  county: string | null;
  created_at: string;
  professional_id: string;
  view_count: number;
  download_count: number;
  plan_code: string | null;
  is_featured: boolean;
}

export default function AdminPlans() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, [filter]);

  const fetchPlans = async () => {
    setLoading(true);
    let query = supabase
      .from("house_plans")
      .select("id, title, house_type, bedrooms, bathrooms, price_kes, status, thumbnail_url, county, created_at, professional_id, view_count, download_count, plan_code, is_featured")
      .order("created_at", { ascending: false });

    if (filter === "pending" || filter === "approved" || filter === "rejected" || filter === "draft") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setPlans(data || []);
    setLoading(false);
  };

  const updateStatus = async (planId: string, status: "approved" | "rejected") => {
    setUpdating(planId);
    const { error } = await supabase.from("house_plans").update({ status }).eq("id", planId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Plan ${status}` });
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, status } : p));
    }
    setUpdating(null);
  };

  const deletePlan = async (planId: string) => {
    if (!confirm("Delete this plan permanently?")) return;
    setUpdating(planId);
    const { error } = await supabase.from("house_plans").delete().eq("id", planId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plan deleted" });
      setPlans(prev => prev.filter(p => p.id !== planId));
    }
    setUpdating(null);
  };

  const toggleFeatured = async (planId: string, current: boolean) => {
    setUpdating(planId);
    const { error } = await supabase.from("house_plans").update({ is_featured: !current } as any).eq("id", planId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: !current ? "Plan featured" : "Plan unfeatured" });
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, is_featured: !current } : p));
    }
    setUpdating(null);
  };
  const filtered = plans.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  const statusColor = (s: string) => {
    switch (s) {
      case "approved": return "bg-emerald-500/10 text-emerald-600";
      case "pending": return "bg-amber-500/10 text-amber-600";
      case "rejected": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-4">Manage House Plans</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search plans..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No plans found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((plan) => (
            <Card key={plan.id}>
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
                <img src={plan.thumbnail_url || planPlaceholder} alt={plan.title} className="h-16 w-24 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{plan.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {plan.plan_code && <span className="font-mono">{plan.plan_code}</span>}
                    <span className="capitalize">{plan.house_type}</span>
                    <span>·</span>
                    <span>{plan.bedrooms}BR / {plan.bathrooms}BA</span>
                    <span>·</span>
                    <span>KES {plan.price_kes.toLocaleString()}</span>
                    {plan.county && <><span>·</span><span>{plan.county}</span></>}
                    <span>·</span>
                    <span>{plan.view_count} views · {plan.download_count} downloads</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(plan.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {plan.is_featured && <Badge className="bg-amber-500/10 text-amber-600"><Star className="h-3 w-3 mr-1" />Featured</Badge>}
                  <Badge className={`${statusColor(plan.status)} capitalize`}>{plan.status}</Badge>
                  {plan.status === "pending" && (
                    <>
                      <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => updateStatus(plan.id, "approved")} disabled={updating === plan.id}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateStatus(plan.id, "rejected")} disabled={updating === plan.id}>
                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {plan.status === "approved" && (
                    <Button size="sm" variant="outline" onClick={() => toggleFeatured(plan.id, plan.is_featured)} disabled={updating === plan.id}>
                      <Star className={`h-3.5 w-3.5 mr-1 ${plan.is_featured ? "fill-amber-500 text-amber-500" : ""}`} />
                      {plan.is_featured ? "Unfeature" : "Feature"}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deletePlan(plan.id)} disabled={updating === plan.id}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
