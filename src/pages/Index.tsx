import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import FeaturedEvents from "@/components/FeaturedEvents";
import MapDiscovery from "@/components/MapDiscovery";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Categories />
        <FeaturedEvents />
        <MapDiscovery />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
