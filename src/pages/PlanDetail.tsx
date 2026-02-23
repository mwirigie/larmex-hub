import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Share2, BedDouble, Bath, Maximize, MapPin, Building2, Shield, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Mock — will be replaced with DB fetch
const mockPlan = {
  id: "1",
  title: "Modern 3BR Bungalow",
  description: "A beautifully designed modern bungalow perfect for a family of four. Features open-plan living, master en-suite, and a spacious kitchen with island. Designed for 50x100 plots with optimal natural lighting and cross-ventilation.",
  house_type: "bungalow",
  bedrooms: 3,
  bathrooms: 2,
  floors: 1,
  area_sqm: 120,
  land_size: "50x100",
  price_kes: 25000,
  county: "Nairobi",
  features: ["Open plan living", "Master en-suite", "Kitchen island", "Utility room", "Parking for 2 cars"],
  professional: { name: "Arch. Wanjiku Kamau", verified: true, rating: 4.8, reviews: 23 },
};

export default function PlanDetail() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/browse" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Heart className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image */}
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
              <div className="absolute inset-0 flex items-center justify-center text-6xl text-muted-foreground/20">
                🏠
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rotate-[-30deg] font-display text-4xl font-bold text-muted-foreground/10 select-none">
                  WATERMARKED PREVIEW
                </span>
              </div>
              <Badge className="absolute left-4 top-4 capitalize">{mockPlan.house_type}</Badge>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{mockPlan.title}</h1>
              <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {mockPlan.county} · {mockPlan.land_size} plot
              </div>

              {/* Specs */}
              <div className="mt-6 grid grid-cols-4 gap-4">
                {[
                  { icon: BedDouble, label: "Bedrooms", value: mockPlan.bedrooms },
                  { icon: Bath, label: "Bathrooms", value: mockPlan.bathrooms },
                  { icon: Maximize, label: "Area", value: `${mockPlan.area_sqm} m²` },
                  { icon: Building2, label: "Floors", value: mockPlan.floors },
                ].map((spec) => (
                  <div key={spec.label} className="rounded-lg border border-border bg-card p-3 text-center">
                    <spec.icon className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-1 text-sm font-semibold text-foreground">{spec.value}</p>
                    <p className="text-xs text-muted-foreground">{spec.label}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <h2 className="font-display text-lg font-semibold text-foreground">Description</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{mockPlan.description}</p>

              <h2 className="mt-6 font-display text-lg font-semibold text-foreground">Features</h2>
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {mockPlan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Price Card */}
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">Plan Price</p>
                <p className="font-display text-3xl font-bold text-foreground">
                  KES {mockPlan.price_kes.toLocaleString()}
                </p>
                <Button className="mt-4 w-full" size="lg">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Purchase Plan
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Instant access to full PDF after payment
                </p>
              </div>

              {/* Professional Card */}
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary">
                    {mockPlan.professional.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-foreground">{mockPlan.professional.name}</p>
                      {mockPlan.professional.verified && (
                        <Shield className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      {mockPlan.professional.rating} ({mockPlan.professional.reviews} reviews)
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="mt-4 w-full">View Profile</Button>
                <Button variant="ghost" className="mt-2 w-full">Send Message</Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-card p-3 md:hidden">
        <div className="container flex items-center justify-between">
          <div>
            <p className="font-display text-xl font-bold text-foreground">KES {mockPlan.price_kes.toLocaleString()}</p>
          </div>
          <Button size="lg">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Purchase
          </Button>
        </div>
      </div>
    </div>
  );
}
