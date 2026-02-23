import { useEffect, useState } from "react";
import { Loader2, Search, Check, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfRow {
  id: string;
  user_id: string;
  company_name: string | null;
  is_verified: boolean;
  verification_status: string;
  license_number: string | null;
  years_experience: number | null;
  specializations: string[] | null;
  service_counties: string[] | null;
  created_at: string;
  full_name?: string;
  email?: string;
}

export default function AdminProfessionals() {
  const { toast } = useToast();
  const [profs, setProfs] = useState<ProfRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchProfs();
  }, [filter]);

  const fetchProfs = async () => {
    setLoading(true);
    let query = supabase
      .from("professional_profiles")
      .select("id, user_id, company_name, is_verified, verification_status, license_number, years_experience, specializations, service_counties, created_at")
      .order("created_at", { ascending: false });

    if (filter === "pending" || filter === "approved" || filter === "rejected") {
      query = query.eq("verification_status", filter);
    }

    const { data } = await query;

    // Fetch profile names
    if (data && data.length > 0) {
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      setProfs(data.map(d => ({
        ...d,
        full_name: profileMap.get(d.user_id)?.full_name || "Unknown",
        email: profileMap.get(d.user_id)?.email || null,
      })));
    } else {
      setProfs([]);
    }
    setLoading(false);
  };

  const updateVerification = async (profId: string, userId: string, status: "approved" | "rejected") => {
    setUpdating(profId);
    const isVerified = status === "approved";
    const { error } = await supabase
      .from("professional_profiles")
      .update({ verification_status: status, is_verified: isVerified })
      .eq("id", profId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Professional ${status}` });
      setProfs(prev =>
        prev.map(p => p.id === profId ? { ...p, verification_status: status, is_verified: isVerified } : p)
      );
    }
    setUpdating(null);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "approved": return "bg-emerald-500/10 text-emerald-600";
      case "pending": return "bg-amber-500/10 text-amber-600";
      case "rejected": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filtered = profs.filter(p =>
    (p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.company_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-4">Professional Verification</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search professionals..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No professionals found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((prof) => (
            <Card key={prof.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary shrink-0">
                    {(prof.full_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{prof.full_name}</h3>
                      {prof.is_verified && <Shield className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{prof.email || "No email"}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                      {prof.company_name && <span>🏢 {prof.company_name}</span>}
                      {prof.license_number && <span>📋 {prof.license_number}</span>}
                      {prof.years_experience != null && <span>{prof.years_experience} yrs exp</span>}
                    </div>
                    {prof.specializations && prof.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {prof.specializations.map(s => (
                          <Badge key={s} variant="outline" className="text-xs capitalize">{s.replace("_", " ")}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`${statusColor(prof.verification_status)} capitalize`}>{prof.verification_status}</Badge>
                    {prof.verification_status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => updateVerification(prof.id, prof.user_id, "approved")} disabled={updating === prof.id}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Verify
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateVerification(prof.id, prof.user_id, "rejected")} disabled={updating === prof.id}>
                          <X className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
