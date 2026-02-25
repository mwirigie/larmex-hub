import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ArrowLeft, Search, MapPin, BadgeCheck, Briefcase, Star, DollarSign, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "architect", label: "Architect" },
  { value: "structural_engineer", label: "Structural Engineer" },
  { value: "quantity_surveyor", label: "Quantity Surveyor" },
  { value: "site_supervisor", label: "Site Supervisor" },
];

interface Professional {
  id: string;
  user_id: string;
  company_name: string | null;
  specializations: string[] | null;
  years_experience: number | null;
  service_counties: string[] | null;
  is_verified: boolean;
  starting_price: number | null;
  bio: string | null;
  profile?: { full_name: string; avatar_url: string | null };
  avg_rating?: number;
  review_count?: number;
  completed_count?: number;
}

export default function HireProfessional() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [ratingFilter, setRatingFilter] = useState("all");

  // Hire dialog state
  const [hireDialog, setHireDialog] = useState(false);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [reqTitle, setReqTitle] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [reqLocation, setReqLocation] = useState("");
  const [reqBudget, setReqBudget] = useState("");
  const [reqTimeline, setReqTimeline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    setLoading(true);
    const { data: profs } = await supabase
      .from("professional_profiles")
      .select("id, user_id, company_name, specializations, years_experience, service_counties, is_verified, starting_price, bio")
      .eq("is_verified", true);

    if (profs && profs.length > 0) {
      const userIds = profs.map((p) => p.user_id);

      const [profilesRes, reviewsRes, projectsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds),
        supabase.from("reviews").select("professional_id, rating"),
        supabase.from("project_requests").select("professional_id, status").in("professional_id", userIds).eq("status", "completed"),
      ]);

      // Calculate ratings
      const ratingMap = new Map<string, { total: number; count: number }>();
      (reviewsRes.data || []).forEach((r) => {
        const existing = ratingMap.get(r.professional_id) || { total: 0, count: 0 };
        existing.total += r.rating;
        existing.count += 1;
        ratingMap.set(r.professional_id, existing);
      });

      // Count completed projects
      const completedMap = new Map<string, number>();
      (projectsRes.data || []).forEach((p) => {
        completedMap.set(p.professional_id!, (completedMap.get(p.professional_id!) || 0) + 1);
      });

      const merged: Professional[] = profs.map((p) => {
        const rData = ratingMap.get(p.user_id);
        return {
          ...p,
          profile: profilesRes.data?.find((pr) => pr.user_id === p.user_id) || { full_name: "Professional", avatar_url: null },
          avg_rating: rData ? rData.total / rData.count : 0,
          review_count: rData?.count || 0,
          completed_count: completedMap.get(p.user_id) || 0,
        };
      });
      setProfessionals(merged);
    } else {
      setProfessionals([]);
    }
    setLoading(false);
  };

  const filtered = professionals.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || 
      p.profile?.full_name?.toLowerCase().includes(q) ||
      p.company_name?.toLowerCase().includes(q) ||
      p.service_counties?.some((c) => c.toLowerCase().includes(q));
    
    const matchesCategory = category === "all" || p.specializations?.includes(category);
    const matchesRating = ratingFilter === "all" || (p.avg_rating || 0) >= Number(ratingFilter);

    return matchesSearch && matchesCategory && matchesRating;
  });

  const openHireDialog = (pro: Professional) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setSelectedPro(pro);
    setHireDialog(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPro) return;
    setSubmitting(true);

    const { error } = await supabase.from("project_requests").insert({
      client_id: user.id,
      professional_id: selectedPro.user_id,
      title: reqTitle,
      description: reqDesc,
      county: reqLocation,
      budget_kes: reqBudget ? Number(reqBudget) : null,
      timeline: reqTimeline,
      status: "pending",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request sent!", description: "The professional will review your request." });
      setHireDialog(false);
      setReqTitle(""); setReqDesc(""); setReqLocation(""); setReqBudget(""); setReqTimeline("");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <h1 className="font-display text-lg font-bold text-foreground">Hire a Professional</h1>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, county..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Rating" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="3">3+ Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.slice(1).map((c) => (
            <Button
              key={c.value}
              variant={category === c.value ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(category === c.value ? "all" : c.value)}
            >
              {c.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="font-display text-xl font-semibold text-foreground">No professionals found</h2>
            <p className="mt-2 text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((pro, i) => (
              <motion.div
                key={pro.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 overflow-hidden">
                        {pro.profile?.avatar_url ? (
                          <img src={pro.profile.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
                        ) : (
                          <Building2 className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link to={`/professional/${pro.user_id}`} className="truncate font-display font-semibold text-foreground hover:text-primary transition-colors">
                            {pro.profile?.full_name || "Professional"}
                          </Link>
                          <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                        </div>
                        {pro.company_name && (
                          <p className="truncate text-sm text-muted-foreground">{pro.company_name}</p>
                        )}
                      </div>
                    </div>

                    {/* Categories */}
                    {pro.specializations && pro.specializations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {pro.specializations.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs capitalize">
                            {s.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-muted p-2">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3.5 w-3.5 text-accent" />
                          <span className="text-sm font-semibold text-foreground">{(pro.avg_rating || 0).toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{pro.review_count} reviews</p>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <p className="text-sm font-semibold text-foreground">{pro.years_experience || 0}</p>
                        <p className="text-xs text-muted-foreground">Years exp</p>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <p className="text-sm font-semibold text-foreground">{pro.completed_count || 0}</p>
                        <p className="text-xs text-muted-foreground">Projects</p>
                      </div>
                    </div>

                    {/* Starting price */}
                    {pro.starting_price && (
                      <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        Starting from <span className="font-semibold text-foreground">KES {pro.starting_price.toLocaleString()}</span>
                      </div>
                    )}

                    {/* Service areas */}
                    {pro.service_counties && pro.service_counties.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        <MapPin className="mr-1 inline h-3 w-3" />
                        {pro.service_counties.slice(0, 3).join(", ")}
                        {pro.service_counties.length > 3 && ` +${pro.service_counties.length - 3}`}
                      </p>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => openHireDialog(pro)}>
                        Hire
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/professional/${pro.user_id}`}>View Profile</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Hire Dialog */}
      <Dialog open={hireDialog} onOpenChange={setHireDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Hire {selectedPro?.profile?.full_name}</DialogTitle>
            <DialogDescription>Submit a project request to this professional.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="req-title">Project Title *</Label>
              <Input id="req-title" value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} placeholder="e.g. 3-Bedroom House Design" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-desc">Project Description *</Label>
              <Textarea id="req-desc" value={reqDesc} onChange={(e) => setReqDesc(e.target.value)} placeholder="Describe your project requirements..." rows={3} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="req-location">Location</Label>
                <Input id="req-location" value={reqLocation} onChange={(e) => setReqLocation(e.target.value)} placeholder="e.g. Nairobi, Kiambu" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-budget">Budget (KES)</Label>
                <Input id="req-budget" type="number" value={reqBudget} onChange={(e) => setReqBudget(e.target.value)} placeholder="e.g. 500000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-timeline">Timeline</Label>
              <Input id="req-timeline" value={reqTimeline} onChange={(e) => setReqTimeline(e.target.value)} placeholder="e.g. 3 months" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
