import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, Briefcase, MapPin, Star, Globe, Shield, DollarSign, Building2, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfData {
  id: string;
  user_id: string;
  company_name: string | null;
  specializations: string[] | null;
  years_experience: number | null;
  service_counties: string[] | null;
  is_verified: boolean;
  license_number: string | null;
  starting_price: number | null;
  bio: string | null;
  website: string | null;
  portfolio: any[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name?: string;
}

export default function ProfessionalPublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [prof, setProf] = useState<ProfData | null>(null);
  const [profileData, setProfileData] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Hire dialog
  const [hireDialog, setHireDialog] = useState(false);
  const [reqTitle, setReqTitle] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [reqLocation, setReqLocation] = useState("");
  const [reqBudget, setReqBudget] = useState("");
  const [reqTimeline, setReqTimeline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);

    const [profRes, profileRes, reviewsRes, completedRes] = await Promise.all([
      supabase.from("professional_profiles").select("*").eq("user_id", userId).eq("is_verified", true).single(),
      supabase.from("profiles").select("full_name, avatar_url").eq("user_id", userId).single(),
      supabase.from("reviews").select("id, rating, comment, created_at, reviewer_id").eq("professional_id", userId).order("created_at", { ascending: false }),
      supabase.from("project_requests").select("id", { count: "exact", head: true }).eq("professional_id", userId).eq("status", "completed"),
    ]);

    if (!profRes.data) {
      setLoading(false);
      return;
    }

    setProf({
      ...profRes.data,
      portfolio: Array.isArray(profRes.data.portfolio) ? profRes.data.portfolio : [],
    });
    setProfileData(profileRes.data);
    setCompletedCount(completedRes.count || 0);

    // Process reviews
    const reviewData = reviewsRes.data || [];
    if (reviewData.length > 0) {
      const reviewerIds = [...new Set(reviewData.map((r) => r.reviewer_id))];
      const { data: reviewerProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", reviewerIds);

      const nameMap = new Map((reviewerProfiles || []).map((p) => [p.user_id, p.full_name]));
      const mapped = reviewData.map((r) => ({
        ...r,
        reviewer_name: nameMap.get(r.reviewer_id) || "Anonymous",
      }));
      setReviews(mapped);

      const totalRating = reviewData.reduce((sum, r) => sum + r.rating, 0);
      setAvgRating(totalRating / reviewData.length);
    }

    setLoading(false);
  };

  const handleHire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !prof) return;
    setSubmitting(true);

    const { error } = await supabase.from("project_requests").insert({
      client_id: user.id,
      professional_id: prof.user_id,
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!prof || !profileData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h2 className="font-display text-xl font-semibold text-foreground">Professional not found</h2>
        <Button asChild><Link to="/professionals">Back to Professionals</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/professionals"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="ml-3 font-display text-lg font-bold text-foreground">Professional Profile</h1>
        </div>
      </header>

      <main className="container max-w-4xl py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Hero Section */}
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
              {profileData.avatar_url ? (
                <img src={profileData.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-2xl font-bold text-foreground">{profileData.full_name}</h1>
                <BadgeCheck className="h-5 w-5 text-primary" />
              </div>
              {prof.company_name && <p className="text-muted-foreground">{prof.company_name}</p>}
              
              {prof.specializations && prof.specializations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {prof.specializations.map((s) => (
                    <Badge key={s} variant="secondary" className="capitalize">{s.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviews.length} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  {prof.years_experience || 0} years experience
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  {completedCount} completed projects
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Button onClick={() => {
                  if (!user) { navigate("/auth"); return; }
                  setHireDialog(true);
                }}>
                  Hire {profileData.full_name.split(" ")[0]}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              {prof.bio && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground whitespace-pre-line">{prof.bio}</p></CardContent>
                </Card>
              )}

              {/* Portfolio */}
              {prof.portfolio && prof.portfolio.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Portfolio</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {prof.portfolio.map((item: any, idx: number) => (
                        <div key={idx} className="overflow-hidden rounded-lg border border-border">
                          {item.image_url && (
                            <img src={item.image_url} alt={item.description || "Portfolio"} className="aspect-video w-full object-cover" />
                          )}
                          {item.description && (
                            <p className="p-3 text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reviews ({reviews.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reviews yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((r) => (
                        <div key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{r.reviewer_name}</p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                              ))}
                            </div>
                          </div>
                          {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                          <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  {prof.starting_price && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Starting Price</p>
                        <p className="font-semibold text-foreground">KES {prof.starting_price.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {prof.license_number && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">License Number</p>
                        <p className="font-medium text-foreground">{prof.license_number}</p>
                      </div>
                    </div>
                  )}
                  {prof.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Website</p>
                        <a href={prof.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{prof.website}</a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {prof.service_counties && prof.service_counties.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-foreground mb-2">Service Areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {prof.service_counties.map((c) => (
                        <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Hire Dialog */}
      <Dialog open={hireDialog} onOpenChange={setHireDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Hire {profileData.full_name}</DialogTitle>
            <DialogDescription>Submit a project request.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleHire} className="space-y-4">
            <div className="space-y-2">
              <Label>Project Title *</Label>
              <Input value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} placeholder="e.g. 3-Bedroom House Design" required />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={reqDesc} onChange={(e) => setReqDesc(e.target.value)} placeholder="Describe your project..." rows={3} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={reqLocation} onChange={(e) => setReqLocation(e.target.value)} placeholder="e.g. Nairobi" />
              </div>
              <div className="space-y-2">
                <Label>Budget (KES)</Label>
                <Input type="number" value={reqBudget} onChange={(e) => setReqBudget(e.target.value)} placeholder="500000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Timeline</Label>
              <Input value={reqTimeline} onChange={(e) => setReqTimeline(e.target.value)} placeholder="e.g. 3 months" />
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
