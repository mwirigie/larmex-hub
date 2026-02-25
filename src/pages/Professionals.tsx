import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ArrowLeft, MapPin, BadgeCheck, Briefcase, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Professional {
  id: string;
  user_id: string;
  company_name: string | null;
  specializations: string[] | null;
  years_experience: number | null;
  service_counties: string[] | null;
  is_verified: boolean;
  starting_price: number | null;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function Professionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    setLoading(true);
    const { data: profs } = await supabase
      .from("professional_profiles")
      .select("id, user_id, company_name, specializations, years_experience, service_counties, is_verified, starting_price")
      .eq("is_verified", true);

    if (profs && profs.length > 0) {
      const userIds = profs.map((p) => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const merged = profs.map((p) => ({
        ...p,
        profile: profiles?.find((pr) => pr.user_id === p.user_id) || { full_name: "Professional", avatar_url: null },
      }));
      setProfessionals(merged);
    } else {
      setProfessionals([]);
    }
    setLoading(false);
  };

  const filtered = professionals.filter((p) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      p.profile?.full_name?.toLowerCase().includes(q) ||
      p.company_name?.toLowerCase().includes(q) ||
      p.specializations?.some((s) => s.toLowerCase().includes(q)) ||
      p.service_counties?.some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <h1 className="font-display text-lg font-bold text-foreground">Find Professionals</h1>
          </div>
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, county..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Mobile search */}
        <div className="mb-6 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search professionals..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="font-display text-xl font-semibold text-foreground">No professionals found</h2>
            <p className="mt-2 text-muted-foreground">
              {search ? "Try adjusting your search." : "No verified professionals yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((pro, i) => (
              <motion.div
                key={pro.id}
                className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    {pro.profile?.avatar_url ? (
                      <img src={pro.profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5 text-primary" />
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

                {pro.years_experience ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    <Briefcase className="mr-1 inline h-3.5 w-3.5" />
                    {pro.years_experience} years experience
                  </p>
                ) : null}

                {pro.service_counties && pro.service_counties.length > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <MapPin className="mr-1 inline h-3.5 w-3.5" />
                    {pro.service_counties.slice(0, 3).join(", ")}
                    {pro.service_counties.length > 3 && ` +${pro.service_counties.length - 3} more`}
                  </p>
                )}

                {pro.specializations && pro.specializations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {pro.specializations.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs capitalize">
                        {s.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                )}
                {pro.starting_price && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    From <span className="font-semibold text-foreground">KES {pro.starting_price.toLocaleString()}</span>
                  </p>
                )}

                <div className="mt-3">
                  <Button size="sm" className="w-full" asChild>
                    <Link to={`/professional/${pro.user_id}`}>View Profile</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
