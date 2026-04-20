import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

const MapDiscovery = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="order-2 lg:order-1">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Discover Events
              <br />
              <span className="text-gradient">Around You</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Use our interactive map to find events happening in your neighborhood. 
              Filter by date, category, and distance to find the perfect match for your interests.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl gradient-warm flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Location-Based Discovery</h3>
                  <p className="text-sm text-muted-foreground">
                    See events happening near your current location or explore different areas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl gradient-warm flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Easy Navigation</h3>
                  <p className="text-sm text-muted-foreground">
                    Get directions directly to any event with one-click navigation
                  </p>
                </div>
              </div>
            </div>

            <Button variant="hero" size="lg">
              <MapPin className="w-5 h-5" />
              Explore the Map
            </Button>
          </div>

          {/* Map Preview */}
          <div className="order-1 lg:order-2 relative">
            <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-elevated border border-border bg-muted/50">
              {/* Placeholder Map Visual */}
              <div className="w-full h-full relative bg-gradient-to-br from-secondary/50 to-muted">
                {/* Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div key={i} className="border border-border/30" />
                  ))}
                </div>

                {/* Map Pins */}
                <div className="absolute top-1/4 left-1/3 animate-float">
                  <div className="w-10 h-10 rounded-full gradient-warm flex items-center justify-center shadow-glow">
                    <MapPin className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 animate-float" style={{ animationDelay: "0.5s" }}>
                  <div className="w-10 h-10 rounded-full bg-category-tech flex items-center justify-center shadow-lg">
                    <MapPin className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
                <div className="absolute top-2/3 left-1/4 animate-float" style={{ animationDelay: "1s" }}>
                  <div className="w-10 h-10 rounded-full bg-category-music flex items-center justify-center shadow-lg">
                    <MapPin className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
                <div className="absolute top-1/3 right-1/4 animate-float" style={{ animationDelay: "1.5s" }}>
                  <div className="w-10 h-10 rounded-full bg-category-food flex items-center justify-center shadow-lg">
                    <MapPin className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>

                {/* Center Point */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                  <div className="absolute inset-0 w-4 h-4 rounded-full bg-primary/30 animate-ping" />
                </div>

                {/* Overlay Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-card/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg text-center">
                    <p className="text-sm text-muted-foreground">Connect your location to</p>
                    <p className="font-semibold text-foreground">discover nearby events</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapDiscovery;
