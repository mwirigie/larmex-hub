import { useEffect, useState } from "react";
import { Loader2, Check, X, Eye, Search, Star, BedDouble, Bath, Maximize, MapPin, Layers, DollarSign, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import planPlaceholder from "@/assets/plan-placeholder.jpg";

interface PlanRow {
  id: string;
  title: string;
  house_type: string;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  area_sqm: number | null;
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
  description: string | null;
  short_description: string | null;
  features: string[] | null;
  images: string[] | null;
  land_size: string | null;
  estimated_cost: number | null;
  style: string | null;
  pdf_url: string | null;
}

interface ProfessionalInfo {
  full_name: string;
  email: string | null;
}

export default function AdminPlans() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [inspecting, setInspecting] = useState<PlanRow | null>(null);
  const [profInfo, setProfInfo] = useState<ProfessionalInfo | null>(null);
  const [loadingProf, setLoadingProf] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [filter]);

  const fetchPlans = async () => {
    setLoading(true);
    let query = supabase
      .from("house_plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter === "pending" || filter === "approved" || filter === "rejected" || filter === "draft") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setPlans((data as PlanRow[]) || []);
    setLoading(false);
  };

  const openInspect = async (plan: PlanRow) => {
    setInspecting(plan);
    setProfInfo(null);
    setLoadingProf(true);
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", plan.professional_id)
      .single();
    setProfInfo(data || { full_name: "Unknown", email: null });
    setLoadingProf(false);
  };

  const updateStatus = async (planId: string, status: "approved" | "rejected") => {
    setUpdating(planId);
    const { error } = await supabase.from("house_plans").update({ status }).eq("id", planId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Plan ${status}` });
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, status } : p));
      if (inspecting?.id === planId) setInspecting(prev => prev ? { ...prev, status } : null);
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
      if (inspecting?.id === planId) setInspecting(null);
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
                  <Button size="sm" variant="outline" onClick={() => openInspect(plan)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Inspect
                  </Button>
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

      {/* Plan Inspection Dialog */}
      <Dialog open={!!inspecting} onOpenChange={(open) => !open && setInspecting(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {inspecting && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{inspecting.title}</DialogTitle>
                <DialogDescription>
                  {inspecting.plan_code && <span className="font-mono mr-2">{inspecting.plan_code}</span>}
                  <Badge className={`${statusColor(inspecting.status)} capitalize`}>{inspecting.status}</Badge>
                </DialogDescription>
              </DialogHeader>

              {/* Thumbnail & Images */}
              <div className="space-y-3">
                <img
                  src={inspecting.thumbnail_url || planPlaceholder}
                  alt={inspecting.title}
                  className="w-full max-h-64 object-cover rounded-lg"
                />
                {inspecting.images && inspecting.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {inspecting.images.map((img, i) => (
                      <img key={i} src={img} alt={`Plan image ${i + 1}`} className="aspect-video w-full object-cover rounded-lg border border-border" />
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Key Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                  <BedDouble className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Bedrooms</p>
                    <p className="font-semibold text-foreground">{inspecting.bedrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                  <Bath className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Bathrooms</p>
                    <p className="font-semibold text-foreground">{inspecting.bathrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                  <Layers className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Floors</p>
                    <p className="font-semibold text-foreground">{inspecting.floors}</p>
                  </div>
                </div>
                {inspecting.area_sqm && (
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                    <Maximize className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Area</p>
                      <p className="font-semibold text-foreground">{inspecting.area_sqm} m²</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                  <DollarSign className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-semibold text-foreground">KES {inspecting.price_kes.toLocaleString()}</p>
                  </div>
                </div>
                {inspecting.estimated_cost && (
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Est. Build Cost</p>
                      <p className="font-semibold text-foreground">KES {inspecting.estimated_cost.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>County: {inspecting.county || "Not specified"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Uploaded: {new Date(inspecting.created_at).toLocaleDateString()}</span>
                </div>
                {inspecting.house_type && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Type: <span className="capitalize">{inspecting.house_type}</span></span>
                    {inspecting.style && <span>· Style: {inspecting.style}</span>}
                  </div>
                )}
                {inspecting.land_size && (
                  <div className="text-muted-foreground">Land Size: {inspecting.land_size}</div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  PDF: {inspecting.pdf_url ? (
                    <>
                      <Badge variant="secondary">Uploaded</Badge>
                      <Button size="sm" variant="outline" className="ml-1" onClick={async () => {
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          if (!session) return;
                          const res = await fetch(
                            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/secure-pdf-download?plan_id=${inspecting.id}`,
                            { headers: { Authorization: `Bearer ${session.access_token}` } }
                          );
                          const json = await res.json();
                          if (json.url) window.open(json.url, "_blank");
                          else toast({ title: "Error", description: json.error || "Could not load PDF", variant: "destructive" });
                        } catch { toast({ title: "Error", description: "Failed to load PDF", variant: "destructive" }); }
                      }}>
                        <FileText className="h-3.5 w-3.5 mr-1" /> View PDF
                      </Button>
                    </>
                  ) : <Badge variant="outline">Not uploaded</Badge>}
                </div>
              </div>

              {/* Description */}
              {(inspecting.short_description || inspecting.description) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Description</h4>
                    {inspecting.short_description && <p className="text-sm text-muted-foreground mb-2">{inspecting.short_description}</p>}
                    {inspecting.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{inspecting.description}</p>}
                  </div>
                </>
              )}

              {/* Features */}
              {inspecting.features && inspecting.features.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Features</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {inspecting.features.map((f, i) => (
                        <Badge key={i} variant="secondary">{f}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Professional Info */}
              <Separator />
              <div>
                <h4 className="font-semibold text-foreground mb-1">Uploaded By</h4>
                {loadingProf ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : profInfo ? (
                  <p className="text-sm text-muted-foreground">{profInfo.full_name}{profInfo.email && ` · ${profInfo.email}`}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Unknown</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{inspecting.view_count} views</span>
                <span>{inspecting.download_count} downloads</span>
              </div>

              {/* Actions */}
              {inspecting.status === "pending" && (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    <Button className="flex-1" onClick={() => updateStatus(inspecting.id, "approved")} disabled={updating === inspecting.id}>
                      <Check className="h-4 w-4 mr-2" /> Approve Plan
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => updateStatus(inspecting.id, "rejected")} disabled={updating === inspecting.id}>
                      <X className="h-4 w-4 mr-2" /> Reject Plan
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
