import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, User, Mail, Phone, MapPin, Save, Loader2, Camera, Shield, Briefcase, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const kenyanCounties = [
  "Nairobi", "Kiambu", "Mombasa", "Nakuru", "Kisumu", "Uasin Gishu", "Machakos",
  "Kajiado", "Nyeri", "Meru", "Kilifi", "Kwale", "Murang'a", "Nyandarua",
  "Laikipia", "Embu", "Kirinyaga", "Tharaka-Nithi",
];

interface ProfessionalProfile {
  company_name: string | null;
  is_verified: boolean;
  verification_status: string;
  license_number: string | null;
  years_experience: number | null;
  specializations: string[] | null;
  service_counties: string[] | null;
  website: string | null;
}

export default function Profile() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [profProfile, setProfProfile] = useState<ProfessionalProfile | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
      setCounty(data.county || "");
      setBio(data.bio || "");
      setAvatarUrl(data.avatar_url);
      setEmail(data.email || user.email || "");
    }

    // Fetch professional profile if applicable
    if (role === "professional") {
      const { data: pp } = await supabase
        .from("professional_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (pp) {
        setProfProfile({
          company_name: pp.company_name,
          is_verified: pp.is_verified,
          verification_status: pp.verification_status,
          license_number: pp.license_number,
          years_experience: pp.years_experience,
          specializations: pp.specializations,
          service_counties: pp.service_counties,
          website: pp.website,
        });
      }
    }

    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, county, bio })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const filePath = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    setAvatarUrl(publicUrl);
    toast({ title: "Avatar updated!" });
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const isProfessional = role === "professional";

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
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container max-w-3xl py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-primary" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Camera className="h-3.5 w-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">{fullName || "Your Name"}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="capitalize">{role || "User"}</Badge>
                {isProfessional && profProfile?.is_verified && (
                  <Badge className="bg-primary/10 text-primary">
                    <Shield className="mr-1 h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              {isProfessional && <TabsTrigger value="professional">Professional</TabsTrigger>}
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={email} disabled className="bg-muted" />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
                      </div>
                      <div className="space-y-2">
                        <Label>County</Label>
                        <Select value={county} onValueChange={setCounty}>
                          <SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger>
                          <SelectContent>
                            {kenyanCounties.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />
                    </div>

                    <Button type="submit" disabled={saving} className="w-full">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {isProfessional && (
              <TabsContent value="professional">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Professional Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profProfile ? (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                            <Briefcase className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Company</p>
                              <p className="font-medium text-foreground">{profProfile.company_name || "Not set"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                            <Shield className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Verification</p>
                              <p className="font-medium text-foreground capitalize">{profProfile.verification_status}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                            <User className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Experience</p>
                              <p className="font-medium text-foreground">{profProfile.years_experience ?? 0} years</p>
                            </div>
                          </div>
                          {profProfile.website && (
                            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                              <Globe className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Website</p>
                                <a href={profProfile.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{profProfile.website}</a>
                              </div>
                            </div>
                          )}
                        </div>

                        {profProfile.specializations && profProfile.specializations.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Specializations</p>
                            <div className="flex flex-wrap gap-2">
                              {profProfile.specializations.map((s) => (
                                <Badge key={s} variant="secondary" className="capitalize">{s.replace("_", " ")}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {profProfile.service_counties && profProfile.service_counties.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Service Counties</p>
                            <div className="flex flex-wrap gap-2">
                              {profProfile.service_counties.map((c) => (
                                <Badge key={c} variant="outline">{c}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Separator />
                        <p className="text-sm text-muted-foreground">
                          License: {profProfile.license_number || "Not provided"}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No professional profile found. Contact support to set up your professional account.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
