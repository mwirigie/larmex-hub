import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Share2, BedDouble, Bath, Maximize, MapPin, Building2, Shield, Star, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import planPlaceholder from "@/assets/plan-placeholder.jpg";

type HousePlan = Tables<"house_plans">;

interface ProfessionalInfo {
  full_name: string;
  is_verified: boolean;
}

export default function PlanDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<HousePlan | null>(null);
  const [professional, setProfessional] = useState<ProfessionalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (id) fetchPlan(id);
  }, [id]);

  useEffect(() => {
    if (user && id) checkFavorite();
  }, [user, id]);

  const fetchPlan = async (planId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("house_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }
    setPlan(data);

    await supabase.from("house_plans").update({ view_count: (data.view_count || 0) + 1 }).eq("id", planId);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", data.professional_id)
      .single();

    const { data: profProfile } = await supabase
      .from("professional_profiles")
      .select("is_verified")
      .eq("user_id", data.professional_id)
      .single();

    setProfessional({
      full_name: profile?.full_name || "Unknown Professional",
      is_verified: profProfile?.is_verified || false,
    });

    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("professional_id", data.professional_id);

    if (reviews && reviews.length > 0) {
      setReviewCount(reviews.length);
      setAvgRating(Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)));
    }

    setLoading(false);
  };

  const checkFavorite = async () => {
    if (!user || !id) return;
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("plan_id", id)
      .limit(1);
    setIsFavorited((data?.length || 0) > 0);
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please log in to save plans.", variant: "destructive" });
      return;
    }
    if (!id) return;
    if (isFavorited) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("plan_id", id);
      setIsFavorited(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, plan_id: id });
      setIsFavorited(true);
    }
  };

  const handlePurchase = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    toast({ title: "Coming soon", description: "M-Pesa payment integration is coming soon!" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center">
        <Building2 className="h-12 w-12 text-muted-foreground/30" />
        <h2 className="mt-4 font-display text-xl font-bold">Plan not found</h2>
        <Button asChild className="mt-4"><Link to="/browse">Browse Plans</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/browse" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={toggleFavorite}>
              <Heart className={`h-4 w-4 ${isFavorited ? "fill-destructive text-destructive" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
              <img src={plan.thumbnail_url || planPlaceholder} alt={plan.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rotate-[-30deg] font-display text-4xl font-bold text-muted-foreground/10 select-none">LARMEX HUB PREVIEW</span>
              </div>
              <Badge className="absolute left-4 top-4 capitalize">{plan.house_type}</Badge>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{plan.title}</h1>
              <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {plan.county || "Kenya"} {plan.land_size && `· ${plan.land_size} plot`}
              </div>

              <div className="mt-6 grid grid-cols-4 gap-4">
                {[
                  { icon: BedDouble, label: "Bedrooms", value: plan.bedrooms },
                  { icon: Bath, label: "Bathrooms", value: plan.bathrooms },
                  { icon: Maximize, label: "Area", value: plan.area_sqm ? `${plan.area_sqm} m²` : "—" },
                  { icon: Building2, label: "Floors", value: plan.floors },
                ].map((spec) => (
                  <div key={spec.label} className="rounded-lg border border-border bg-card p-3 text-center">
                    <spec.icon className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-1 text-sm font-semibold text-foreground">{spec.value}</p>
                    <p className="text-xs text-muted-foreground">{spec.label}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              {plan.description && (
                <>
                  <h2 className="font-display text-lg font-semibold text-foreground">Description</h2>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{plan.description}</p>
                </>
              )}

              {plan.features && plan.features.length > 0 && (
                <>
                  <h2 className="mt-6 font-display text-lg font-semibold text-foreground">Features</h2>
                  <ul className="mt-2 grid grid-cols-2 gap-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">Plan Price</p>
                <p className="font-display text-3xl font-bold text-foreground">KES {plan.price_kes.toLocaleString()}</p>
                <Button className="mt-4 w-full" size="lg" onClick={handlePurchase}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> Purchase Plan
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">Instant access to full PDF after payment</p>
              </div>

              {professional && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary">
                      {professional.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="font-semibold text-foreground">{professional.full_name}</p>
                        {professional.is_verified && <Shield className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        {avgRating > 0 ? `${avgRating} (${reviewCount} reviews)` : "No reviews yet"}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4 w-full">View Profile</Button>
                  <Button variant="ghost" className="mt-2 w-full">Send Message</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-card p-3 md:hidden">
        <div className="container flex items-center justify-between">
          <p className="font-display text-xl font-bold text-foreground">KES {plan.price_kes.toLocaleString()}</p>
          <Button size="lg" onClick={handlePurchase}>
            <ShoppingCart className="mr-2 h-4 w-4" /> Purchase
          </Button>
        </div>
      </div>
    </div>
  );
}
