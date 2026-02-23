import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Shield, Calculator, Home, ArrowRight, Star, CheckCircle2, Building2, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroBg from "@/assets/hero-bg.jpg";
import categoryBungalow from "@/assets/category-bungalow.jpg";
import categoryMaisonette from "@/assets/category-maisonette.jpg";
import categoryApartment from "@/assets/category-apartment.jpg";
import categoryVilla from "@/assets/category-villa.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stats = [
  { label: "House Plans", value: "500+", icon: Home },
  { label: "Verified Pros", value: "120+", icon: Users },
  { label: "Counties Covered", value: "47", icon: MapPin },
  { label: "Happy Clients", value: "2,000+", icon: Star },
];

const features = [
  {
    icon: Search,
    title: "Browse House Plans",
    description: "Explore hundreds of professionally designed house plans tailored for Kenyan land sizes and building standards.",
  },
  {
    icon: Shield,
    title: "Verified Professionals",
    description: "Every architect and engineer is license-verified. Build with confidence knowing your professional is certified.",
  },
  {
    icon: Calculator,
    title: "Cost Calculator",
    description: "Get instant cost estimates based on your land size, house type, and county. No surprises during construction.",
  },
  {
    icon: Building2,
    title: "Custom Designs",
    description: "Can't find what you need? Request a custom design from verified professionals and bring your vision to life.",
  },
];

const popularTypes = [
  { name: "Bungalows", count: "180+ plans", image: categoryBungalow },
  { name: "Maisonettes", count: "120+ plans", image: categoryMaisonette },
  { name: "Apartments", count: "90+ plans", image: categoryApartment },
  { name: "Villas", count: "60+ plans", image: categoryVilla },
];

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Larmex Hub</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/browse" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Browse Plans</Link>
            <Link to="/browse" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Find Pros</Link>
            <Link to="/calculator" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Calculator</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth?tab=signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero with background image */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
        </div>
        <div className="container relative">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Kenya's #1 Construction Marketplace
            </div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Build Your Dream Home{" "}
              <span className="text-primary">with Confidence</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground md:text-xl">
              Find verified architects, browse professional house plans, and get accurate cost estimates — all in one place.
            </p>
          </motion.div>

          <motion.div
            className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search plans (e.g. 3 bedroom bungalow)"
                className="pl-10 h-12 bg-card/80 backdrop-blur-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="lg" className="h-12" asChild>
              <Link to={`/browse${searchQuery ? `?q=${searchQuery}` : ""}`}>
                Search Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 text-center">
                <stat.icon className="mb-2 h-5 w-5 text-primary" />
                <span className="font-display text-2xl font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="border-t border-border bg-secondary/50 py-16">
        <div className="container">
          <motion.div
            className="mb-10 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display text-3xl font-bold text-foreground">Popular House Types</h2>
            <p className="mt-2 text-muted-foreground">Browse plans by house type to find exactly what you need.</p>
          </motion.div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {popularTypes.map((type, i) => (
              <motion.div
                key={type.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Link
                  to={`/browse?type=${type.name.toLowerCase()}`}
                  className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary hover:shadow-md"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={type.image} alt={type.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-display font-semibold text-foreground">{type.name}</h3>
                    <p className="text-sm text-muted-foreground">{type.count}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container">
          <motion.div
            className="mb-10 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display text-3xl font-bold text-foreground">Why Larmex Hub?</h2>
            <p className="mt-2 text-muted-foreground">Everything you need to plan and build your home in Kenya.</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary py-16">
        <div className="container text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display text-3xl font-bold text-primary-foreground">Ready to Start Building?</h2>
            <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
              Join thousands of Kenyans who have found their perfect house plan and trusted professionals on Larmex Hub.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth?tab=signup">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
                <Link to="/browse">Browse Plans</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Larmex Hub</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/browse" className="hover:text-foreground transition-colors">Browse Plans</Link>
              <Link to="/browse" className="hover:text-foreground transition-colors">Find Professionals</Link>
              <Link to="/calculator" className="hover:text-foreground transition-colors">Cost Calculator</Link>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 Larmex Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
