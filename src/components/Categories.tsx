import { Music, Laptop, Utensils, Dumbbell, Palette, Users } from "lucide-react";

const categories = [
  { name: "Music", icon: Music, color: "category-music" },
  { name: "Tech", icon: Laptop, color: "category-tech" },
  { name: "Food & Drink", icon: Utensils, color: "category-food" },
  { name: "Sports", icon: Dumbbell, color: "category-sports" },
  { name: "Arts", icon: Palette, color: "category-arts" },
  { name: "Social", icon: Users, color: "category-social" },
];

const Categories = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Explore by Interest
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Find events that match your passions and discover new communities
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <button
              key={category.name}
              className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-elevated transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={`w-14 h-14 rounded-xl bg-${category.color}/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                style={{
                  backgroundColor: `hsl(var(--${category.color}) / 0.1)`,
                }}
              >
                <category.icon
                  className="w-7 h-7"
                  style={{ color: `hsl(var(--${category.color}))` }}
                />
              </div>
              <span className="font-semibold text-foreground">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
