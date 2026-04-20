import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { INTERESTS, UOFT_CAMPUSES, APP_NAME } from '@/lib/constants';
import { 
  GraduationCap, 
  ArrowRight, 
  ArrowLeft,
  School,
  BookOpen,
  Heart,
  Calendar,
  CheckCircle2,
  MapPin,
  Phone
} from 'lucide-react';

interface SchoolData {
  id: string;
  name: string;
  level: string;
  city: string | null;
}

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [uoftSchool, setUoftSchool] = useState<SchoolData | null>(null);
  const [formData, setFormData] = useState({
    nickname: '',
    school_id: '',
    graduation_year: new Date().getFullYear() + 4,
    program: '',
    interests: [] as string[],
    availability_weekday: true,
    availability_weekend: true,
    location: '', // This will store the campus
    phone_number: '',
    campuses: [] as string[], // Multi-select campuses
  });
  const [loading, setLoading] = useState(false);
  
  const { updateProfile, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Fetch UofT school
    const fetchUoftSchool = async () => {
      const { data } = await supabase
        .from('schools')
        .select('*')
        .ilike('name', '%toronto%')
        .single();
      
      if (data) {
        setUoftSchool(data);
        setFormData(prev => ({ ...prev, school_id: data.id }));
      }
    };
    
    fetchUoftSchool();
  }, []);

  // Redirect if profile is already complete
  useEffect(() => {
    if (profile?.school_id && profile?.program) {
      navigate('/');
    }
  }, [profile, navigate]);

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const toggleCampus = (campus: string) => {
    setFormData(prev => ({
      ...prev,
      campuses: prev.campuses.includes(campus)
        ? prev.campuses.filter(c => c !== campus)
        : [...prev.campuses, campus]
    }));
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      // Set location based on primary campus selection
      const primaryCampus = formData.campuses[0];
      const campusConfig = UOFT_CAMPUSES.find(c => c.value === primaryCampus);
      const location = campusConfig?.city || formData.campuses.join(', ');

      const { error } = await updateProfile({
        nickname: formData.nickname || null,
        school_id: formData.school_id || null,
        graduation_year: formData.graduation_year,
        program: formData.program || null,
        interests: formData.interests,
        availability_weekday: formData.availability_weekday,
        availability_weekend: formData.availability_weekend,
        location: location || null,
        phone_number: formData.phone_number || null,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save your profile. Please try again.',
        });
      } else {
        await refreshProfile();
        toast({
          title: 'Profile Complete!',
          description: `Welcome to ${APP_NAME}! Start discovering events.`,
        });
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.campuses.length > 0;
      case 2: return formData.program;
      case 3: return formData.interests.length >= 3;
      case 4: return true; // Phone is optional
      case 5: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-6">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-3">Step {step} of 5</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <School className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">Welcome to UofT!</h1>
            <p className="text-muted-foreground mb-8">
              Select your campus(es) to connect with your community
            </p>

            {/* UofT Header */}
            <div className="bg-card rounded-xl border border-primary p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">University of Toronto</p>
                  <p className="text-sm text-muted-foreground">Select your campus below</p>
                </div>
              </div>
            </div>

            {/* Campus Multi-select */}
            <div className="space-y-3">
              {UOFT_CAMPUSES.map((campus) => (
                <button
                  key={campus.value}
                  onClick={() => toggleCampus(campus.value)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    formData.campuses.includes(campus.value)
                      ? 'border-primary bg-primary/5 shadow-soft'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{campus.label}</p>
                      <p className="text-sm text-muted-foreground">{campus.city}</p>
                    </div>
                    {formData.campuses.includes(campus.value) && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {formData.campuses.length > 0 && (
              <p className="text-sm text-primary mt-4">
                {formData.campuses.length} campus{formData.campuses.length > 1 ? 'es' : ''} selected
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">What are you studying?</h1>
            <p className="text-muted-foreground mb-8">
              Connect with students in similar programs
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">Full Name</Label>
                <Input
                  id="nickname"
                  placeholder="Your name"
                  value={formData.nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="program">Program / Major *</Label>
                <Input
                  id="program"
                  placeholder="e.g., Computer Science, Business"
                  value={formData.program}
                  onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Graduation Year</Label>
                <Input
                  id="year"
                  type="number"
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 10}
                  value={formData.graduation_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, graduation_year: parseInt(e.target.value) }))}
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">What interests you?</h1>
            <p className="text-muted-foreground mb-2">
              Pick at least 3 to personalize your feed
            </p>
            <p className="text-sm text-primary mb-6">
              {formData.interests.length} selected
            </p>

            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    formData.interests.includes(interest)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Phone className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">Contact Info</h1>
            <p className="text-muted-foreground mb-8">
              Optional: Add your phone for friend finding
            </p>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                For finding friends and 2-factor verification
              </p>
            </div>

            {/* Show selected campuses */}
            <div className="mt-8">
              <Label className="text-muted-foreground">Your Campuses</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.campuses.map((campus) => {
                  const campusConfig = UOFT_CAMPUSES.find(c => c.value === campus);
                  return (
                    <span key={campus} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {campusConfig?.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">When are you free?</h1>
            <p className="text-muted-foreground mb-8">
              We'll prioritize events that fit your schedule
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setFormData(prev => ({ ...prev, availability_weekday: !prev.availability_weekday }))}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  formData.availability_weekday
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekdays</p>
                    <p className="text-sm text-muted-foreground">Monday - Friday</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    formData.availability_weekday ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}>
                    {formData.availability_weekday && (
                      <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                </div>
              </button>

              <button
                onClick={() => setFormData(prev => ({ ...prev, availability_weekend: !prev.availability_weekend }))}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  formData.availability_weekend
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekends</p>
                    <p className="text-sm text-muted-foreground">Saturday - Sunday</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    formData.availability_weekend ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}>
                    {formData.availability_weekend && (
                      <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 pt-4 border-t border-border bg-background">
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          {step < 5 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 gradient-warm text-primary-foreground"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 gradient-warm text-primary-foreground"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  Start Exploring
                  <GraduationCap className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
