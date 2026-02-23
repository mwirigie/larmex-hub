import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Heart, Building2, BedDouble, Bath, Maximize, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

// Mock data for now — will be replaced with real DB queries
const mockPlans = [
  { id: "1", title: "Modern 3BR Bungalow", house_type: "bungalow", bedrooms: 3, bathrooms: 2, area_sqm: 120, price_kes: 25000, county: "Nairobi", professional: "Arch. Wanjiku K.", verified: true, thumbnail: null },
  { id: "2", title: "Elegant 4BR Maisonette", house_type: "maisonette", bedrooms: 4, bathrooms: 3, area_sqm: 200, price_kes: 45000, county: "Kiambu", professional: "Eng. Omondi J.", verified: true, thumbnail: null },
  { id: "3", title: "Compact 2BR Apartment", house_type: "apartment", bedrooms: 2, bathrooms: 1, area_sqm: 65, price_kes: 15000, county: "Mombasa", professional: "Arch. Kamau P.", verified: false, thumbnail: null },
  { id: "4", title: "Luxury 5BR Villa", house_type: "villa", bedrooms: 5, bathrooms: 4, area_sqm: 350, price_kes: 85000, county: "Nakuru", professional: "Arch. Nyambura M.", verified: true, thumbnail: null },
  { id: "5", title: "Simple 1BR Bungalow", house_type: "bungalow", bedrooms: 1, bathrooms: 1, area_sqm: 45, price_kes: 8000, county: "Kisumu", professional: "Eng. Otieno B.", verified: true, thumbnail: null },
  { id: "6", title: "Family 3BR Townhouse", house_type: "townhouse", bedrooms: 3, bathrooms: 2, area_sqm: 140, price_kes: 35000, county: "Nairobi", professional: "Arch. Wanjiku K.", verified: true, thumbnail: null },
];

const counties = ["All Counties", "Nairobi", "Kiambu", "Mombasa", "Nakuru", "Kisumu", "Uasin Gishu", "Machakos"];
const houseTypes = ["All Types", "Bungalow", "Maisonette", "Apartment", "Villa", "Townhouse"];

export default function BrowsePlans() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = mockPlans.filter((plan) => {
    const matchSearch = plan.title.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === "All Types" || plan.house_type === selectedType.toLowerCase();
    const matchCounty = selectedCounty === "All Counties" || plan.county === selectedCounty;
    return matchSearch && matchType && matchCounty;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <Input
              placeholder="Search house plans..."
              className="pl-10 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            className="container border-t border-border py-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="flex flex-wrap gap-3">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {houseTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {counties.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}
      </header>

      {/* Results */}
      <main className="container py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} plans found</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/plans/${plan.id}`}
                className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted-foreground/30">
                    🏠
                  </div>
                  <Badge className="absolute left-3 top-3 bg-card text-foreground capitalize">
                    {plan.house_type}
                  </Badge>
                  <button
                    onClick={(e) => { e.preventDefault(); }}
                    className="absolute right-3 top-3 rounded-full bg-card/80 p-2 backdrop-blur-sm transition-colors hover:bg-card"
                  >
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                    {plan.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{plan.bedrooms} BR</span>
                    <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{plan.bathrooms} BA</span>
                    <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{plan.area_sqm} m²</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />{plan.county}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-foreground">
                      KES {plan.price_kes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {plan.professional}
                      {plan.verified && <span className="text-primary">✓</span>}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
