import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateEventModal from "@/components/CreateEventModal";

const CallToAction = () => {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-warm opacity-90" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Host Your Own Event?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10">
            Create memorable experiences for your community. It only takes a few minutes 
            to set up and start connecting with people who share your interests.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CreateEventModal
              trigger={
                <Button
                  size="xl"
                  className="bg-card text-foreground hover:bg-card/90 shadow-elevated font-bold"
                >
                  <Plus className="w-5 h-5" />
                  Create Your Event
                </Button>
              }
            />
            <Button
              size="xl"
              variant="outline"
              className="border-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
