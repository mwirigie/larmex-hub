import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CompletedProject {
  id: string;
  title: string;
  professional_id: string | null;
  professional_name?: string;
  has_review: boolean;
}

export default function ReviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projects, setProjects] = useState<CompletedProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Review dialog
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<CompletedProject | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);

    const { data: completedReqs } = await supabase
      .from("project_requests")
      .select("id, title, professional_id")
      .eq("client_id", user.id)
      .eq("status", "completed");

    if (!completedReqs || completedReqs.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }

    // Check which professionals the user has already reviewed
    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("professional_id")
      .eq("reviewer_id", user.id);
    const reviewedProfessionalIds = new Set((existingReviews || []).map((r) => r.professional_id));

    // Get professional names
    const profIds = [...new Set(completedReqs.filter((r) => r.professional_id).map((r) => r.professional_id!))];
    const { data: profProfiles } = profIds.length > 0 
      ? await supabase.from("profiles").select("user_id, full_name").in("user_id", profIds)
      : { data: [] };
    const nameMap = new Map((profProfiles || []).map((p) => [p.user_id, p.full_name]));

    setProjects(completedReqs.map((r) => ({
      ...r,
      professional_name: r.professional_id ? nameMap.get(r.professional_id) || "Professional" : "Unknown",
      has_review: r.professional_id ? reviewedProfessionalIds.has(r.professional_id) : false,
    })));
    setLoading(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject?.professional_id) return;
    setSubmitting(true);

    const { error } = await supabase.from("reviews").insert({
      reviewer_id: user.id,
      professional_id: selectedProject.professional_id,
      plan_id: null,
      rating,
      comment: comment || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      setReviewDialog(false);
      setRating(5);
      setComment("");
      fetchProjects();
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="sm" asChild><Link to="/dashboard">← Back</Link></Button>
          <h1 className="font-display text-lg font-bold text-foreground">My Reviews</h1>
        </div>
      </header>
      <main className="container max-w-2xl py-6">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Star className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No completed projects to review.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">Professional: {p.professional_name}</p>
                  </div>
                  {p.has_review ? (
                    <span className="text-sm text-muted-foreground">✅ Reviewed</span>
                  ) : (
                    <Button size="sm" onClick={() => { setSelectedProject(p); setReviewDialog(true); }}>
                      Leave Review
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review {selectedProject?.professional_name}</DialogTitle>
            <DialogDescription>Rate your experience with this professional.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setRating(s)}>
                    <Star className={`h-8 w-8 ${s <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comment (optional)</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." rows={3} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
