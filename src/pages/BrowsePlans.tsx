import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Heart, Building2, BedDouble, Bath, Maximize, MapPin, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const counties = ["All Counties", "Nairobi", "Kiambu", "Mombasa", "Nakuru", "Kisumu", "Uasin Gishu", "Machakos", "Kajiado", "Nyeri"];
const houseTypes = ["All Types", "Bungalow", "Maisonette", "Apartment", "Villa", "Townhouse", "Mansion"];

interface PlanWithProfessional {
  id: string;
  title: string;
  house_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  price_kes: number;
  county: string | null;
  thumbnail_url: string | null;
  view_count: number;
  professional_id: string;
}

export default function BrowsePlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [showFilters, setShowFilters] = useState(false);
  const [plans, setPlans] = useState<PlanWithProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPlans();
    if (user) fetchFavorites();
  }, [user]);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("house_plans")
      .select("id, title, house_type, bedrooms, bathrooms, area_sqm, price_kes, county, thumbnail_url, view_count, professional_id")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching plans:", error);
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  };

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("favorites")
      .select("plan_id")
      .eq("user_id", user.id);
    if (data) setFavorites(new Set(data.map((f) => f.plan_id)));
  };

  const toggleFavorite = async (e: React.MouseEvent, planId: string) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Sign in required", description: "Please log in to save plans.", variant: "destructive" });
      return;
    }
    if (favorites.has(planId)) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("plan_id", planId);
      setFavorites((prev) => { const next = new Set(prev); next.delete(planId); return next; });
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, plan_id: planId });
      setFavorites((prev) => new Set(prev).add(planId));
    }
  };

  const filtered = plans.filter((plan) => {
    const matchSearch = plan.title.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === "All Types" || plan.house_type === selectedType.toLowerCase();
    const matchCounty = selectedCounty === "All Counties" || plan.county === selectedCounty;
    return matchSearch && matchType && matchCounty;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="hidden font-display text-lg font-bold text-foreground sm:inline">JengaHub</span>
          </Link>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search house plans..." className="pl-10 h-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
          </Button>
        </div>

        {showFilters && (
          <motion.div className="container border-t border-border py-3" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
            <div className="flex flex-wrap gap-3">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {houseTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {counties.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}
      </header>

      <main className="container py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} plans found</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 font-display text-lg font-semibold text-foreground">No plans found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((plan, i) => (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/plans/${plan.id}`} className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md">
                  <div className="relative aspect-[4/3] bg-muted">
                    {plan.thumbnail_url ? (
                      <img src={plan.thumbnail_url} alt={plan.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted-foreground/30">🏠</div>
                    )}
                    <Badge className="absolute left-3 top-3 bg-card text-foreground capitalize">{plan.house_type}</Badge>
                    <button onClick={(e) => toggleFavorite(e, plan.id)} className="absolute right-3 top-3 rounded-full bg-card/80 p-2 backdrop-blur-sm transition-colors hover:bg-card">
                      <Heart className={`h-4 w-4 ${favorites.has(plan.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">{plan.title}</h3>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{plan.bedrooms} BR</span>
                      <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{plan.bathrooms} BA</span>
                      {plan.area_sqm && <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{plan.area_sqm} m²</span>}
                    </div>
                    {plan.county && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />{plan.county}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-display text-lg font-bold text-foreground">KES {plan.price_kes.toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
