import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ArrowLeft, Calculator as CalcIcon, MapPin, Home, Layers, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const houseTypes = [
  { value: "bungalow", label: "Bungalow", baseCostPerSqm: 35000 },
  { value: "maisonette", label: "Maisonette", baseCostPerSqm: 40000 },
  { value: "apartment", label: "Apartment Block", baseCostPerSqm: 32000 },
  { value: "villa", label: "Villa", baseCostPerSqm: 50000 },
];

const materialCategories = [
  { value: "economy", label: "Economy", multiplier: 0.75 },
  { value: "standard", label: "Standard", multiplier: 1.0 },
  { value: "premium", label: "Premium", multiplier: 1.4 },
  { value: "luxury", label: "Luxury", multiplier: 1.9 },
];

const regionMultipliers: Record<string, number> = {
  "Nairobi": 1.2, "Mombasa": 1.15, "Kiambu": 1.1, "Nakuru": 1.0, "Kisumu": 0.95,
  "Uasin Gishu": 0.9, "Machakos": 0.95, "Kajiado": 1.0, "Nyeri": 0.9, "Other": 0.85,
};

interface Estimate {
  foundation: number;
  structure: number;
  roofing: number;
  finishing: number;
  labor: number;
  professionalFees: number;
  total: number;
}

export default function Calculator() {
  const [area, setArea] = useState("");
  const [houseType, setHouseType] = useState("");
  const [material, setMaterial] = useState("");
  const [county, setCounty] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  const calculate = () => {
    const sqm = parseFloat(area);
    if (!sqm || !houseType || !material || !county) return;

    const type = houseTypes.find((t) => t.value === houseType)!;
    const mat = materialCategories.find((m) => m.value === material)!;
    const regionMult = regionMultipliers[county] || 0.85;

    const baseCost = sqm * type.baseCostPerSqm * mat.multiplier * regionMult;

    const result: Estimate = {
      foundation: Math.round(baseCost * 0.15),
      structure: Math.round(baseCost * 0.30),
      roofing: Math.round(baseCost * 0.15),
      finishing: Math.round(baseCost * 0.20),
      labor: Math.round(baseCost * 0.15),
      professionalFees: Math.round(baseCost * 0.05),
      total: Math.round(baseCost),
    };
    setEstimate(result);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <CalcIcon className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">Cost Calculator</span>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
          {/* Input Form */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Hammer className="h-5 w-5 text-primary" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>House Area (m²)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 120"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>House Type</Label>
                  <Select value={houseType} onValueChange={setHouseType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {houseTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Material Category</Label>
                  <Select value={material} onValueChange={setMaterial}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {materialCategories.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>County</Label>
                  <Select value={county} onValueChange={setCounty}>
                    <SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(regionMultipliers).map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" size="lg" onClick={calculate}>
                  <CalcIcon className="mr-2 h-4 w-4" />
                  Calculate Estimate
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {estimate ? (
                  <div className="space-y-3">
                    {[
                      { label: "Foundation", value: estimate.foundation, icon: Layers },
                      { label: "Structure / Walling", value: estimate.structure, icon: Building2 },
                      { label: "Roofing", value: estimate.roofing, icon: Home },
                      { label: "Finishing", value: estimate.finishing, icon: Hammer },
                      { label: "Labor", value: estimate.labor, icon: Hammer },
                      { label: "Professional Fees", value: estimate.professionalFees, icon: CalcIcon },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted p-3">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{item.label}</span>
                        </div>
                        <span className="font-semibold text-foreground">KES {item.value.toLocaleString()}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4">
                      <span className="font-display font-semibold text-foreground">Total Estimate</span>
                      <span className="font-display text-2xl font-bold text-primary">
                        KES {estimate.total.toLocaleString()}
                      </span>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/browse">Find Professionals for This Project</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <CalcIcon className="mb-3 h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm">Fill in the details and click calculate to see your cost breakdown.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
