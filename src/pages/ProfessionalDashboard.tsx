import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Save, Loader2, Camera, Shield, Briefcase, Globe, Plus, X, Upload, Star, Check, XCircle, Clock, ArrowLeft, LogOut, FileText, Eye, DollarSign, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PROFESSIONAL_CATEGORIES = [
  { value: "architect", label: "Architect" },
  { value: "structural_engineer", label: "Structural Engineer" },
  { value: "quantity_surveyor", label: "Quantity Surveyor" },
  { value: "site_supervisor", label: "Site Supervisor" },
];

const KENYAN_COUNTIES = [
  "Nairobi", "Kiambu", "Mombasa", "Nakuru", "Kisumu", "Uasin Gishu", "Machakos",
  "Kajiado", "Nyeri", "Meru", "Kilifi", "Kwale", "Murang'a", "Nyandarua",
  "Laikipia", "Embu", "Kirinyaga", "Tharaka-Nithi",
];

interface ProjectRequest {
  id: string;
  title: string;
  description: string | null;
  status: string;
  budget_kes: number | null;
  county: string | null;
  timeline: string | null;
  created_at: string;
  client_name?: string;
}

export default function ProfessionalDashboard() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [licenseNumber, setLicenseNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

  // Requests
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [updatingRequest, setUpdatingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || role !== "professional")) navigate("/auth");
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    if (user && role === "professional") fetchData();
  }, [user, role]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [profRes, reqRes] = await Promise.all([
      supabase.from("professional_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("project_requests").select("*").eq("professional_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (profRes.data) {
      const p = profRes.data;
      setLicenseNumber(p.license_number || "");
      setYearsExperience(p.years_experience?.toString() || "");
      setStartingPrice(p.starting_price?.toString() || "");
      setBio(p.bio || "");
      setWebsite(p.website || "");
      setCompanyName(p.company_name || "");
      setSelectedCategories(p.specializations || []);
      setSelectedCounties(p.service_counties || []);
      setVerificationStatus(p.verification_status);
      setPortfolio(Array.isArray(p.portfolio) ? p.portfolio : []);
    }

    // Enrich requests with client names
    const reqs = reqRes.data || [];
    if (reqs.length > 0) {
      const clientIds = [...new Set(reqs.map((r) => r.client_id))];
      const { data: clientProfiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", clientIds);
      const nameMap = new Map((clientProfiles || []).map((p) => [p.user_id, p.full_name]));
      setRequests(reqs.map((r) => ({ ...r, client_name: nameMap.get(r.client_id) || "Client" })));
    } else {
      setRequests([]);
    }

    setLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("professional_profiles")
      .update({
        license_number: licenseNumber || null,
        years_experience: yearsExperience ? Number(yearsExperience) : null,
        starting_price: startingPrice ? Number(startingPrice) : null,
        bio: bio || null,
        website: website || null,
        company_name: companyName || null,
        specializations: selectedCategories as any,
        service_counties: selectedCounties,
        verification_status: "pending" as any,
        is_verified: false,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setVerificationStatus("pending");
      toast({ title: "Profile saved!", description: "Your profile is pending admin approval." });
    }
    setSaving(false);
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploadingPortfolio(true);

    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("portfolio-images").upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploadingPortfolio(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("portfolio-images").getPublicUrl(filePath);
    const description = prompt("Enter a description for this portfolio item:") || "";

    const newPortfolio = [...portfolio, { image_url: publicUrl, description }];
    
    const { error } = await supabase
      .from("professional_profiles")
      .update({ portfolio: newPortfolio, verification_status: "pending" as any, is_verified: false })
      .eq("user_id", user.id);

    if (!error) {
      setPortfolio(newPortfolio);
      setVerificationStatus("pending");
      toast({ title: "Portfolio updated!", description: "Pending admin approval." });
    }
    setUploadingPortfolio(false);
  };

  const removePortfolioItem = async (index: number) => {
    if (!user) return;
    const newPortfolio = portfolio.filter((_, i) => i !== index);
    await supabase.from("professional_profiles").update({ portfolio: newPortfolio }).eq("user_id", user.id);
    setPortfolio(newPortfolio);
  };

  const handleRequestAction = async (requestId: string, action: "accepted" | "rejected" | "completed") => {
    setUpdatingRequest(requestId);
    const { error } = await supabase.from("project_requests").update({ status: action }).eq("id", requestId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Request ${action}` });
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: action } : r)));
    }
    setUpdatingRequest(null);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleCounty = (county: string) => {
    setSelectedCounties((prev) =>
      prev.includes(county) ? prev.filter((c) => c !== county) : [...prev, county]
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const statusBadge = () => {
    switch (verificationStatus) {
      case "approved": return <Badge className="bg-emerald-500/10 text-emerald-600"><Check className="mr-1 h-3 w-3" /> Approved</Badge>;
      case "rejected": return <Badge className="bg-destructive/10 text-destructive"><XCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-600"><Clock className="mr-1 h-3 w-3" /> Pending Approval</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">Larmex Hub</span>
          </Link>
          <div className="flex items-center gap-3">
            {statusBadge()}
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl font-bold text-foreground">Professional Dashboard</h1>
            <Button asChild>
              <Link to="/messages"><MessageSquare className="mr-2 h-4 w-4" /> Messages</Link>
            </Button>
          </div>

          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">Edit Profile</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Professional Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-medium">Categories *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {PROFESSIONAL_CATEGORIES.map((cat) => (
                          <label key={cat.value} className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted transition-colors">
                            <Checkbox checked={selectedCategories.includes(cat.value)} onCheckedChange={() => toggleCategory(cat.value)} />
                            <span className="text-sm">{cat.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>License Number *</Label>
                        <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="e.g. A1234" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Years of Experience *</Label>
                        <Input type="number" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="e.g. 5" required />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Starting Price (KES) *</Label>
                        <Input type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} placeholder="e.g. 50000" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell clients about yourself..." rows={3} />
                    </div>

                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
                    </div>

                    <div className="space-y-2">
                      <Label>Service Counties</Label>
                      <div className="flex flex-wrap gap-2">
                        {KENYAN_COUNTIES.map((c) => (
                          <Badge
                            key={c}
                            variant={selectedCounties.includes(c) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleCounty(c)}
                          >
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" disabled={saving} className="w-full">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save & Submit for Approval
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Portfolio</CardTitle>
                    <label className="cursor-pointer">
                      <Button asChild variant="outline" size="sm" disabled={uploadingPortfolio}>
                        <span>
                          {uploadingPortfolio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                          Add Item
                        </span>
                      </Button>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePortfolioUpload} />
                    </label>
                  </div>
                </CardHeader>
                <CardContent>
                  {portfolio.length === 0 ? (
                    <div className="py-12 text-center">
                      <Upload className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No portfolio items yet. Upload images of your work.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {portfolio.map((item, idx) => (
                        <div key={idx} className="relative overflow-hidden rounded-lg border border-border">
                          {item.image_url && (
                            <img src={item.image_url} alt="" className="aspect-video w-full object-cover" />
                          )}
                          {item.description && (
                            <p className="p-3 text-sm text-muted-foreground">{item.description}</p>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => removePortfolioItem(idx)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Requests Tab */}
            <TabsContent value="requests">
              {requests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">No project requests yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <Card key={req.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground">{req.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">From: {req.client_name}</p>
                            {req.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{req.description}</p>}
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                              {req.county && <span>📍 {req.county}</span>}
                              {req.budget_kes && <span>💰 KES {req.budget_kes.toLocaleString()}</span>}
                              {req.timeline && <span>⏱ {req.timeline}</span>}
                              <span>{new Date(req.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <Badge className={`capitalize ${
                              req.status === "completed" || req.status === "accepted" ? "bg-emerald-500/10 text-emerald-600" :
                              req.status === "pending" ? "bg-amber-500/10 text-amber-600" :
                              "bg-destructive/10 text-destructive"
                            }`}>{req.status}</Badge>
                            {req.status === "pending" && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="text-emerald-600 h-7 text-xs" 
                                  onClick={() => handleRequestAction(req.id, "accepted")} disabled={updatingRequest === req.id}>
                                  Accept
                                </Button>
                                <Button size="sm" variant="outline" className="text-destructive h-7 text-xs"
                                  onClick={() => handleRequestAction(req.id, "rejected")} disabled={updatingRequest === req.id}>
                                  Reject
                                </Button>
                              </div>
                            )}
                             {req.status === "accepted" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => handleRequestAction(req.id, "completed")} disabled={updatingRequest === req.id}>
                                Mark Complete
                              </Button>
                            )}
                            {(req as any).client_id && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                                <Link to={`/messages/${(req as any).client_id}`} state={{ from: "/professional-dashboard" }}>💬 Message</Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
