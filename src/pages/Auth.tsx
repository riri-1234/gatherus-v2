import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Mail, Lock, User, ArrowRight, Sparkles, Megaphone, GraduationCap, ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.jpg';

const studentEmailSchema = z
  .string()
  .email('Please enter a valid email address')
  .refine(
    (email) => email.endsWith('@mail.utoronto.ca'),
    { message: 'Please use your @mail.utoronto.ca email' }
  );

const organizerEmailSchema = z
  .string()
  .email('Please enter a valid email address');

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

type AuthMode = 'select' | 'student' | 'organizer';

const Auth = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('select');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; orgName?: string }>({});

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isOrganizer = authMode === 'organizer';

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const emailResult = (isOrganizer ? organizerEmailSchema : studentEmailSchema).safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (isSignUp) {
      const nameResult = nameSchema.safeParse(name);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
      if (isOrganizer) {
        if (!orgName || orgName.trim().length < 2) {
          newErrors.orgName = 'Organization name must be at least 2 characters';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (isSignUp) {
        const displayName = isOrganizer ? `${name} (${orgName})` : name;
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({ variant: 'destructive', title: 'Account exists', description: 'An account with this email already exists. Please sign in instead.' });
          } else {
            toast({ variant: 'destructive', title: 'Sign up failed', description: error.message });
          }
        } else {
          if (isOrganizer) {
            toast({
              title: 'Application Submitted!',
              description: 'Your organizer account is pending admin verification. You\'ll be notified once approved to start posting events.',
            });
          } else {
            toast({
              title: 'Welcome to GatherUs!',
              description: 'Your account has been created. Let\'s set up your profile!',
            });
          }
          navigate('/onboarding');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ variant: 'destructive', title: 'Sign in failed', description: 'Invalid email or password. Please try again.' });
        } else {
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setOrgName('');
    setErrors({});
    setIsSignUp(false);
  };

  // Role selection screen
  if (authMode === 'select') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 text-center">
          <img src={logo} alt="GatherUs" className="w-20 h-20 mx-auto mb-4 rounded-2xl object-cover shadow-glow" />
          <h1 className="font-display text-3xl font-bold text-foreground">GatherUs</h1>
          <p className="text-muted-foreground mt-2">Campus Events & Student Activities</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => { resetForm(); setAuthMode('student'); }}
            className="w-full bg-card rounded-2xl border border-border p-5 shadow-soft hover:border-primary/40 hover:shadow-elevated transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground">I'm a Student</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Sign in with your @mail.utoronto.ca email</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>

          <button
            onClick={() => { resetForm(); setAuthMode('organizer'); }}
            className="w-full bg-card rounded-2xl border border-border p-5 shadow-soft hover:border-primary/40 hover:shadow-elevated transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/50 flex items-center justify-center group-hover:bg-accent transition-colors">
                <Megaphone className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground">I'm an Organizer</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Clubs, orgs & school groups — create & promote events</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-8 px-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    );
  }

  // Auth form (student or organizer)
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img src={logo} alt="GatherUs" className="w-20 h-20 mx-auto mb-4 rounded-2xl object-cover shadow-glow" />
          <h1 className="font-display text-3xl font-bold text-foreground">GatherUs</h1>
          <p className="text-muted-foreground mt-2">
            {isOrganizer ? 'Organizer Portal' : 'Campus Events & Student Activities'}
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
            {/* Back button */}
            <button
              type="button"
              onClick={() => { resetForm(); setAuthMode('select'); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-2 mb-2">
              {isOrganizer ? (
                <Megaphone className="w-5 h-5 text-primary" />
              ) : (
                <Sparkles className="w-5 h-5 text-primary" />
              )}
              <h2 className="font-display text-xl font-semibold">
                {isSignUp
                  ? isOrganizer ? 'Apply as Organizer' : 'Create Account'
                  : isOrganizer ? 'Organizer Sign In' : 'Welcome Back'}
              </h2>
            </div>

            {isOrganizer && isSignUp && (
              <p className="text-xs text-muted-foreground mb-4">
                Your account will be reviewed by an admin before you can post events.
              </p>
            )}

            {!isOrganizer && (
              <p className="text-xs text-muted-foreground mb-4">
                {isSignUp
                  ? 'Use your @mail.utoronto.ca email to get started.'
                  : 'Sign in with your student email.'}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    {isOrganizer ? 'Your Name' : 'Full Name'}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
              )}

              {isSignUp && isOrganizer && (
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-sm font-medium">
                    Organization / Club Name
                  </Label>
                  <div className="relative">
                    <Megaphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="orgName"
                      type="text"
                      placeholder="e.g. UofT Chess Club"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.orgName && <p className="text-sm text-destructive">{errors.orgName}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={isOrganizer ? 'org@email.com' : 'you@mail.utoronto.ca'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <Button
                type="submit"
                className="w-full gradient-warm text-primary-foreground"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {isSignUp ? (isOrganizer ? 'Submitting...' : 'Creating Account...') : 'Signing In...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isSignUp ? (isOrganizer ? 'Submit Application' : 'Get Started') : 'Sign In'}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setErrors({}); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp ? (
                  <>Already have an account? <span className="text-primary font-medium">Sign In</span></>
                ) : (
                  <>
                    {isOrganizer ? 'New organizer? ' : 'New to GatherUs? '}
                    <span className="text-primary font-medium">
                      {isOrganizer ? 'Apply Here' : 'Create Account'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-6 px-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
