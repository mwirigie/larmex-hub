import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ArrowLeft, Upload, Image, X, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const houseTypes = ["bungalow", "maisonette", "apartment", "villa", "townhouse", "mansion", "other"] as const;
const counties = [
  "Nairobi", "Kiambu", "Mombasa", "Nakuru", "Kisumu", "Uasin Gishu", "Machakos",
  "Kajiado", "Nyeri", "Meru", "Kilifi", "Kwale", "Murang'a", "Nyandarua",
  "Laikipia", "Embu", "Kirinyaga", "Tharaka-Nithi",
];

const styles = ["Modern", "Contemporary", "Traditional", "Colonial", "Mediterranean", "Minimalist", "Rustic", "Industrial"];

const planSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title too long"),
  short_description: z.string().trim().max(300, "Short description max 300 chars").optional(),
  description: z.string().trim().max(5000, "Description too long").optional(),
  house_type: z.enum(houseTypes, { required_error: "Select a house type" }),
  bedrooms: z.number().min(0).max(20),
  bathrooms: z.number().min(1).max(20),
  floors: z.number().min(1).max(10),
  area_sqm: z.number().min(10, "Area must be at least 10 m²").max(10000).optional(),
  price_kes: z.number().min(100, "Price must be at least KES 100"),
  estimated_cost: z.number().min(0).optional(),
  county: z.string().optional(),
  land_size: z.string().trim().max(50).optional(),
  style: z.string().optional(),
  features: z.array(z.string().trim().max(100)).max(20).optional(),
});

export default function UploadPlan() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [houseType, setHouseType] = useState<string>("");
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [floors, setFloors] = useState(1);
  const [areaSqm, setAreaSqm] = useState("");
  const [priceKes, setPriceKes] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [county, setCounty] = useState("");
  const [landSize, setLandSize] = useState("");
  const [style, setStyle] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user || role !== "professional") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center p-6">
        <Building2 className="h-12 w-12 text-muted-foreground/30" />
        <h2 className="mt-4 font-display text-xl font-bold">Professional Access Required</h2>
        <p className="mt-2 text-sm text-muted-foreground">Only verified professionals can upload house plans.</p>
        <Button asChild className="mt-4"><Link to="/dashboard">Go to Dashboard</Link></Button>
      </div>
    );
  }

  const handleThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Thumbnail must be under 5MB.", variant: "destructive" });
      return;
    }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < files.length) {
      toast({ title: "Some files skipped", description: "Files over 5MB were excluded.", variant: "destructive" });
    }
    const combined = [...imageFiles, ...validFiles].slice(0, 10);
    setImageFiles(combined);
    setImagePreviews(combined.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Invalid file type", description: "Only PDF files are accepted.", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "PDF must be under 20MB.", variant: "destructive" });
      return;
    }
    setPdfFile(file);
  };

  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (trimmed && features.length < 20 && !features.includes(trimmed)) {
      setFeatures(prev => [...prev, trimmed]);
      setFeatureInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = planSchema.safeParse({
      title,
      short_description: shortDescription || undefined,
      description: description || undefined,
      house_type: houseType || undefined,
      bedrooms,
      bathrooms,
      floors,
      area_sqm: areaSqm ? Number(areaSqm) : undefined,
      price_kes: priceKes ? Number(priceKes) : 0,
      estimated_cost: estimatedCost ? Number(estimatedCost) : undefined,
      county: county || undefined,
      land_size: landSize || undefined,
      style: style || undefined,
      features: features.length > 0 ? features : undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(err => {
        const key = err.path[0]?.toString() || "general";
        fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    try {
      // Upload thumbnail
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        const path = `${user.id}/${Date.now()}-thumb-${thumbnailFile.name}`;
        const { error } = await supabase.storage.from("plan-images").upload(path, thumbnailFile);
        if (error) throw new Error("Thumbnail upload failed: " + error.message);
        const { data: { publicUrl } } = supabase.storage.from("plan-images").getPublicUrl(path);
        thumbnailUrl = publicUrl;
      }

      // Upload additional images
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("plan-images").upload(path, file);
        if (error) continue;
        const { data: { publicUrl } } = supabase.storage.from("plan-images").getPublicUrl(path);
        imageUrls.push(publicUrl);
      }

      // Upload PDF
      let pdfUrl: string | null = null;
      if (pdfFile) {
        const path = `${user.id}/${Date.now()}-${pdfFile.name}`;
        const { error } = await supabase.storage.from("plan-pdfs").upload(path, pdfFile);
        if (error) throw new Error("PDF upload failed: " + error.message);
        pdfUrl = path; // Store path, not public URL (private bucket)
      }

      // Insert plan - plan_code auto-generated by trigger
      const { error: insertError } = await supabase.from("house_plans").insert({
        professional_id: user.id,
        title: parsed.data.title,
        short_description: parsed.data.short_description || null,
        description: parsed.data.description || null,
        house_type: parsed.data.house_type,
        bedrooms: parsed.data.bedrooms,
        bathrooms: parsed.data.bathrooms,
        floors: parsed.data.floors,
        area_sqm: parsed.data.area_sqm || null,
        price_kes: parsed.data.price_kes,
        estimated_cost: parsed.data.estimated_cost || 0,
        county: parsed.data.county || null,
        land_size: parsed.data.land_size || null,
        style: parsed.data.style || null,
        features: parsed.data.features || [],
        thumbnail_url: thumbnailUrl,
        images: imageUrls,
        pdf_url: pdfUrl,
        status: "pending",
      } as any);

      if (insertError) throw new Error(insertError.message);

      toast({ title: "Plan submitted!", description: "Your plan is pending admin review." });
      navigate("/professional-dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/professional-dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <span className="font-display font-bold text-foreground">Upload Plan</span>
          <div className="w-20" />
        </div>
      </header>

      <main className="container max-w-3xl py-6 pb-24">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">Upload House Plan</h1>
          <p className="text-sm text-muted-foreground mt-1">Fill in the details below. Your plan will be reviewed before going live.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Plan Title *</Label>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Modern 3BR Bungalow – Nairobi" maxLength={100} />
                  {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_desc">Short Description</Label>
                  <Input id="short_desc" value={shortDescription} onChange={e => setShortDescription(e.target.value)} placeholder="Brief one-liner for listings..." maxLength={300} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">Full Description</Label>
                  <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the plan, layout, and unique features..." rows={4} maxLength={5000} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>House Type *</Label>
                    <Select value={houseType} onValueChange={setHouseType}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {houseTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.house_type && <p className="text-xs text-destructive">{errors.house_type}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>County</Label>
                    <Select value={county} onValueChange={setCounty}>
                      <SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger>
                      <SelectContent>
                        {counties.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Architectural Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger>
                    <SelectContent>
                      {styles.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Specifications</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Bedrooms *</Label>
                    <Input type="number" value={bedrooms} onChange={e => setBedrooms(Number(e.target.value))} min={0} max={20} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bathrooms *</Label>
                    <Input type="number" value={bathrooms} onChange={e => setBathrooms(Number(e.target.value))} min={1} max={20} />
                  </div>
                  <div className="space-y-2">
                    <Label>Floors *</Label>
                    <Input type="number" value={floors} onChange={e => setFloors(Number(e.target.value))} min={1} max={10} />
                  </div>
                  <div className="space-y-2">
                    <Label>Area (m²)</Label>
                    <Input type="number" value={areaSqm} onChange={e => setAreaSqm(e.target.value)} placeholder="e.g. 150" />
                    {errors.area_sqm && <p className="text-xs text-destructive">{errors.area_sqm}</p>}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3 mt-4">
                  <div className="space-y-2">
                    <Label>Price (KES) *</Label>
                    <Input type="number" value={priceKes} onChange={e => setPriceKes(e.target.value)} placeholder="e.g. 15000" />
                    {errors.price_kes && <p className="text-xs text-destructive">{errors.price_kes}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Est. Construction Cost (KES)</Label>
                    <Input type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} placeholder="e.g. 3500000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Land Size</Label>
                    <Input value={landSize} onChange={e => setLandSize(e.target.value)} placeholder="e.g. 50x100" maxLength={50} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Features</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={featureInput}
                    onChange={e => setFeatureInput(e.target.value)}
                    placeholder="e.g. Open-plan kitchen, Balcony, Garage"
                    maxLength={100}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addFeature}><Plus className="h-4 w-4" /></Button>
                </div>
                {features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {features.map((f, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {f}
                        <button type="button" onClick={() => setFeatures(prev => prev.filter((_, idx) => idx !== i))} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Media */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Media</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Thumbnail */}
                <div className="space-y-2">
                  <Label>Thumbnail Image *</Label>
                  <p className="text-xs text-muted-foreground">Main image shown in browse. Max 5MB.</p>
                  {thumbnailPreview ? (
                    <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-border">
                      <img src={thumbnailPreview} alt="Thumbnail" className="h-full w-full object-cover" onContextMenu={e => e.preventDefault()} />
                      <button type="button" onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }} className="absolute top-2 right-2 rounded-full bg-card/80 p-1.5 backdrop-blur-sm">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 hover:bg-muted transition-colors">
                      <Image className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium text-muted-foreground">Click to upload thumbnail</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
                    </label>
                  )}
                </div>

                {/* Additional Images */}
                <div className="space-y-2">
                  <Label>Additional Images (up to 10)</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                        <img src={src} alt={`Image ${i + 1}`} className="h-full w-full object-cover" onContextMenu={e => e.preventDefault()} />
                        <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 rounded-full bg-card/80 p-1 backdrop-blur-sm">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {imageFiles.length < 10 && (
                      <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border aspect-square bg-muted/50 hover:bg-muted transition-colors">
                        <Plus className="h-5 w-5 text-muted-foreground" />
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
                      </label>
                    )}
                  </div>
                </div>

                {/* PDF */}
                <div className="space-y-2">
                  <Label>Full Plan PDF *</Label>
                  <p className="text-xs text-muted-foreground">The complete plan file buyers will receive. Max 20MB. PDF only. Stored securely.</p>
                  {pdfFile ? (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
                      <Upload className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm text-foreground truncate flex-1">{pdfFile.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{(pdfFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                      <button type="button" onClick={() => setPdfFile(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 p-6 hover:bg-muted transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Click to upload PDF</span>
                      <input type="file" accept=".pdf" className="hidden" onChange={handlePdf} />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Submit Plan for Review
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
