import { useState, useRef } from "react";
import { X, Calendar, MapPin, Clock, Image, Users, Link as LinkIcon, Copy, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, ACCESS_TYPES } from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

type EventCategory = Database["public"]["Enums"]["event_category"];
type EventAccessType = Database["public"]["Enums"]["event_access_type"];

interface CreateEventModalProps {
  trigger?: React.ReactNode;
  onEventCreated?: () => void;
}

const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const CreateEventModal = ({ trigger, onEventCreated }: CreateEventModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("networking");
  const [accessType, setAccessType] = useState<EventAccessType>("open_rsvp");
  const [externalLink, setExternalLink] = useState("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const resetForm = () => {
    setTitle(""); setDate(""); setTime(""); setLocation("");
    setCapacity(""); setDescription(""); setCategory("networking");
    setAccessType("open_rsvp"); setExternalLink("");
    setPosterFile(null); setPosterPreview(null);
    setInviteCode(null); setCopiedCode(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Max 5MB." });
      return;
    }
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleAccessTypeChange = (value: EventAccessType) => {
    setAccessType(value);
    if (value === "invite_only") {
      setInviteCode(generateInviteCode());
    } else {
      setInviteCode(null);
    }
  };

  const copyInviteLink = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setSubmitting(true);

    try {
      let coverImageUrl: string | null = null;

      // Upload poster if selected
      if (posterFile) {
        const ext = posterFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("event-posters")
          .upload(path, posterFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("event-posters")
          .getPublicUrl(path);
        coverImageUrl = urlData.publicUrl;
      }

      const dateTime = new Date(`${date}T${time}`).toISOString();

      const { error } = await supabase.from("events").insert({
        title,
        date_time: dateTime,
        location,
        capacity: capacity ? parseInt(capacity) : null,
        description: description || null,
        category,
        access_type: accessType,
        external_link: externalLink || null,
        cover_image_url: coverImageUrl,
        invite_code: inviteCode,
        host_id: profile.id,
        is_free: true,
      } as any);

      if (error) throw error;

      toast({ title: "Event Created! 🎉", description: "Your event is live." });
      resetForm();
      setIsOpen(false);
      onEventCreated?.();
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create event.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="hero">Create Event</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Create New Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Event Title</label>
            <input type="text" placeholder="Give your event a catchy name" className={inputClass}
              value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Category</label>
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as EventCategory)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="w-4 h-4 inline-block mr-1" /> Date
              </label>
              <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Clock className="w-4 h-4 inline-block mr-1" /> Time
              </label>
              <input type="time" className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <MapPin className="w-4 h-4 inline-block mr-1" /> Location
            </label>
            <input type="text" placeholder="Enter address or venue name" className={inputClass}
              value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>

          {/* Access Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Lock className="w-4 h-4 inline-block mr-1" /> Access Type
            </label>
            <select className={inputClass} value={accessType}
              onChange={(e) => handleAccessTypeChange(e.target.value as EventAccessType)}>
              {ACCESS_TYPES.map(a => <option key={a.value} value={a.value}>{a.label} — {a.description}</option>)}
            </select>
          </div>

          {/* Invite Code (shown for invite_only) */}
          {inviteCode && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Invitation Code
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-center font-mono text-lg tracking-widest">
                  {inviteCode}
                </code>
                <Button type="button" variant="outline" size="icon" onClick={copyInviteLink}>
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Share this code with your invitees</p>
            </div>
          )}

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Users className="w-4 h-4 inline-block mr-1" /> Max Attendees
            </label>
            <input type="number" placeholder="How many people can attend?" min="1" className={inputClass}
              value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea placeholder="Tell people what your event is about..." rows={3}
              className={`${inputClass} resize-none`}
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* External Link */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <LinkIcon className="w-4 h-4 inline-block mr-1" /> External Link
            </label>
            <input type="url" placeholder="Website, Instagram, sign-up form..." className={inputClass}
              value={externalLink} onChange={(e) => setExternalLink(e.target.value)} />
          </div>

          {/* Poster Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Image className="w-4 h-4 inline-block mr-1" /> Event Poster
            </label>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={handleFileChange} />
            {posterPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img src={posterPreview} alt="Poster preview" className="w-full aspect-video object-cover" />
                <button type="button"
                  onClick={() => { setPosterFile(null); setPosterPreview(null); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload poster (max 5MB)</p>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" className="flex-1" disabled={submitting}>
              {submitting ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;
