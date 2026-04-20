import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, MapPin, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpg";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="GatherUs" className="w-10 h-10 rounded-xl object-cover shadow-soft" />
            <span className="font-display text-2xl font-bold text-foreground">
              GatherUs
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-foreground/80 hover:text-primary font-medium transition-colors"
            >
              Discover
            </Link>
            <Link
              to="/events"
              className="text-foreground/80 hover:text-primary font-medium transition-colors"
            >
              Events
            </Link>
            <Link
              to="/map"
              className="text-foreground/80 hover:text-primary font-medium transition-colors flex items-center gap-1"
            >
              <MapPin className="w-4 h-4" />
              Near Me
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="hero-outline" size="default">
              <User className="w-4 h-4" />
              Sign In
            </Button>
            <Button variant="hero" size="default">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-foreground/80 hover:text-primary font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Discover
              </Link>
              <Link
                to="/events"
                className="text-foreground/80 hover:text-primary font-medium transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Events
              </Link>
              <Link
                to="/map"
                className="text-foreground/80 hover:text-primary font-medium transition-colors py-2 flex items-center gap-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <MapPin className="w-4 h-4" />
                Near Me
              </Link>
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                <Button variant="hero-outline" size="default" className="w-full">
                  <User className="w-4 h-4" />
                  Sign In
                </Button>
                <Button variant="hero" size="default" className="w-full">
                  <Plus className="w-4 h-4" />
                  Create Event
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
