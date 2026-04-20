import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { 
  Settings, 
  Bell, 
  Lock, 
  Palette,
  HelpCircle,
  FileText,
  Shield,
  ChevronRight,
  Moon,
  Globe,
  Trash2,
  LogOut
} from 'lucide-react';

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  toggle?: {
    checked: boolean;
    onChange: (checked: boolean) => void;
  };
  comingSoon?: boolean;
}

const SettingItem = ({ icon, label, description, onClick, toggle, comingSoon }: SettingItemProps) => (
  <div 
    className={`flex items-center gap-4 py-3 ${onClick ? 'cursor-pointer hover:bg-muted/50 -mx-4 px-4 rounded-lg' : ''} ${comingSoon ? 'opacity-50' : ''}`}
    onClick={comingSoon ? undefined : onClick}
  >
    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm flex items-center gap-2">
        {label}
        {comingSoon && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded">Soon</span>
        )}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      )}
    </div>
    {toggle ? (
      <Switch
        checked={toggle.checked}
        onCheckedChange={toggle.onChange}
        disabled={comingSoon}
      />
    ) : onClick && !comingSoon ? (
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    ) : null}
  </div>
);

interface SettingsSheetProps {
  trigger?: React.ReactNode;
}

export const SettingsSheet = ({ trigger }: SettingsSheetProps) => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate('/auth');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <button className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left font-medium">Settings</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {/* Notifications */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Notifications
            </p>
            <div className="space-y-1">
              <SettingItem
                icon={<Bell className="w-5 h-5 text-muted-foreground" />}
                label="Push Notifications"
                description="Get notified about events and updates"
                toggle={{
                  checked: pushNotifications,
                  onChange: setPushNotifications,
                }}
              />
              <SettingItem
                icon={<Bell className="w-5 h-5 text-muted-foreground" />}
                label="Email Notifications"
                description="Receive event reminders via email"
                toggle={{
                  checked: emailNotifications,
                  onChange: setEmailNotifications,
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Preferences */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Preferences
            </p>
            <div className="space-y-1">
              <SettingItem
                icon={<Moon className="w-5 h-5 text-muted-foreground" />}
                label="Dark Mode"
                description="Switch between light and dark themes"
                toggle={{
                  checked: darkMode,
                  onChange: setDarkMode,
                }}
                comingSoon
              />
              <SettingItem
                icon={<Globe className="w-5 h-5 text-muted-foreground" />}
                label="Language"
                description="English (US)"
                onClick={() => {}}
                comingSoon
              />
              <SettingItem
                icon={<Palette className="w-5 h-5 text-muted-foreground" />}
                label="Appearance"
                description="Customize the look and feel"
                onClick={() => {}}
                comingSoon
              />
            </div>
          </div>

          <Separator />

          {/* Privacy & Security */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Privacy & Security
            </p>
            <div className="space-y-1">
              <SettingItem
                icon={<Lock className="w-5 h-5 text-muted-foreground" />}
                label="Privacy Settings"
                description="Control who can see your profile"
                onClick={() => {}}
                comingSoon
              />
              <SettingItem
                icon={<Shield className="w-5 h-5 text-muted-foreground" />}
                label="Blocked Users"
                description="Manage blocked accounts"
                onClick={() => {}}
                comingSoon
              />
            </div>
          </div>

          <Separator />

          {/* Support */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Support
            </p>
            <div className="space-y-1">
              <SettingItem
                icon={<HelpCircle className="w-5 h-5 text-muted-foreground" />}
                label="Help & FAQ"
                description="Get answers to common questions"
                onClick={() => {}}
                comingSoon
              />
              <SettingItem
                icon={<FileText className="w-5 h-5 text-muted-foreground" />}
                label="Terms of Service"
                onClick={() => {}}
                comingSoon
              />
              <SettingItem
                icon={<FileText className="w-5 h-5 text-muted-foreground" />}
                label="Privacy Policy"
                onClick={() => {}}
                comingSoon
              />
            </div>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Account
            </p>
            <div className="space-y-1">
              <SettingItem
                icon={<Trash2 className="w-5 h-5 text-destructive" />}
                label="Delete Account"
                description="Permanently delete your account"
                onClick={() => {}}
                comingSoon
              />
            </div>
          </div>

          {/* Sign Out Button */}
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-4">
            GatherUs v1.0.0
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
