import { Calendar, MapPin, Users, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import eventMusic from "@/assets/event-music.jpg";
import eventTech from "@/assets/event-tech.jpg";
import eventFood from "@/assets/event-food.jpg";
import eventSports from "@/assets/event-sports.jpg";

const events = [
  {
    id: 1,
    title: "Summer Music Festival",
    date: "Jan 15, 2025",
    time: "6:00 PM",
    location: "Central Park, NYC",
    attendees: 234,
    category: "Music",
    image: eventMusic,
    color: "category-music",
  },
  {
    id: 2,
    title: "Tech Startup Networking",
    date: "Jan 18, 2025",
    time: "7:00 PM",
    location: "Innovation Hub, SF",
    attendees: 89,
    category: "Tech",
    image: eventTech,
    color: "category-tech",
  },
  {
    id: 3,
    title: "Wine & Cheese Tasting",
    date: "Jan 20, 2025",
    time: "5:30 PM",
    location: "Vineyard Estate, Napa",
    attendees: 45,
    category: "Food",
    image: eventFood,
    color: "category-food",
  },
  {
    id: 4,
    title: "Sunrise Yoga in the Park",
    date: "Jan 22, 2025",
    time: "6:00 AM",
    location: "Riverside Park",
    attendees: 67,
    category: "Sports",
    image: eventSports,
    color: "category-sports",
  },
];

const EventCard = ({ event, index }: { event: typeof events[0]; index: number }) => {
  return (
    <article
      className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-elevated transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: `hsl(var(--${event.color}) / 0.9)`,
              color: "white",
            }}
          >
            {event.category}
          </span>
        </div>
        <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card hover:shadow-soft transition-all">
          <Heart className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{event.date} · {event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 text-primary" />
            <span>{event.attendees} attending</span>
          </div>
        </div>

        <Button variant="outline" className="w-full">
          View Event
        </Button>
      </div>
    </article>
  );
};

const FeaturedEvents = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Upcoming Events
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Don't miss out on these amazing experiences happening near you
            </p>
          </div>
          <Button variant="hero-outline" size="lg">
            View All Events
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvents;
