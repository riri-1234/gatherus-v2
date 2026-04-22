import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import { ArrowLeft, Loader2, Sparkles, Calendar, MapPin, Users, Check } from 'lucide-react';
import { CATEGORIES, ACCESS_TYPES } from '@/lib/constants';

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 14,
  border: '1.5px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)', color: '#f1f5f9',
  fontSize: 14, outline: 'none', transition: 'border-color .2s', fontFamily: 'inherit',
};
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'rgba(241,245,249,0.5)',
  display: 'block', marginBottom: 6, letterSpacing: '0.04em',
};
const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 18, padding: '18px 16px',
};

const Post = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', date: '', time: '',
    location: '', is_on_campus: true, capacity: '', access_type: 'open_rsvp',
  });

  const set = (key: string, val: string | boolean) => setFormData(prev => ({ ...prev, [key]: val }));

  if (!user || !profile) {
    return (
      <AppLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="text-5xl">📣</div>
          <h2 className="font-bold text-white text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>sign in to create events</h2>
          <button onClick={() => navigate('/auth')} className="px-6 py-3 rounded-2xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', border: 'none', cursor: 'pointer' }}>Sign In</button>
        </div>
      </AppLayout>
    );
  }

  if (!profile.is_verified) {
    return (
      <AppLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="text-5xl">🔒</div>
          <h2 className="font-bold text-white text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>verified organizers only</h2>
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.45)' }}>only verified student orgs can post events.<br />apply through your student union to get verified.</p>
          <button onClick={() => navigate('/onboarding')} className="px-6 py-3 rounded-2xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', border: 'none', cursor: 'pointer' }}>complete profile</button>
        </div>
      </AppLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.date || !formData.time || !formData.location) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill in all required fields.' });
      return;
    }
    setLoading(true);
    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
      const code = formData.access_type !== 'open_rsvp'
        ? `GTHRUS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        : null;
      const { error } = await supabase.from('events').insert({
        host_id: profile.id,
        title: formData.title,
        description: formData.description || null,
        category: formData.category as any,
        date_time: dateTime,
        location: formData.location,
        is_on_campus: formData.is_on_campus,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        access_type: formData.access_type as any,
        school_id: profile.school_id,
        ...(code ? { invite_code: code } : {}),
      });
      if (error) throw error;
      if (code) setGeneratedCode(code);
      setSubmitted(true);
      toast({ title: '🎉 Event created!', description: 'Your event is now live.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create event. Please try again.' });
    } finally {
      setLoading(false); }
  };

  if (submitted) {
    return (
      <AppLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center gap-5">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="text-6xl">🎉</motion.div>
          <h2 className="font-bold text-white text-2xl" style={{ fontFamily: "'Syne', sans-serif" }}>event created!</h2>
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.45)' }}>your event is now live and discoverable</p>
          {generatedCode && (
            <div className="w-full max-w-xs rounded-2xl p-5 text-center" style={{ background: 'rgba(124,58,237,0.12)', border: '1.5px solid rgba(124,58,237,0.35)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(241,245,249,0.45)', letterSpacing: '0.1em' }}>INVITE CODE</p>
              <p className="font-bold text-3xl mb-1" style={{ fontFamily: "'Syne', sans-serif", color: '#c4b5fd', letterSpacing: '0.08em' }}>{generatedCode}</p>
              <p className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>share with your guests · valid 7 days</p>
            </div>
          )}
          <div className="flex gap-3 w-full max-w-xs">
            <button onClick={() => { setSubmitted(false); setGeneratedCode(''); setFormData({ title:'',description:'',category:'',date:'',time:'',location:'',is_on_campus:true,capacity:'',access_type:'open_rsvp' }); }} className="flex-1 py-3 rounded-2xl font-semibold text-sm" style={{ border:'1.5px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'rgba(241,245,249,0.6)',cursor:'pointer'}}>post another</button>
            <button onClick={() => navigate('/my-events')} className="flex-1 py-3 rounded-2xl font-bold text-white text-sm" style={{ background:'linear-gradient(135deg,#7c3aed,#db2777)',border:'none',cursor:'pointer'}}>my events →</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => (e.target.style.borderColor = '#7c3aed');
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)');

  return (
    <AppLayout>
      <header className="sticky top-0 z-40" style={{ background:'rgba(7,9,26,0.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:'rgba(255,255,255,0.06)',border:'none',cursor:'pointer',color:'rgba(241,245,249,0.6)' }}><ArrowLeft className="w-4 h-4"/></button>
          <div>
            <h1 className="font-bold text-white text-base" style={{ fontFamily:"'Syne',sans-serif" }}>launch your event 📣</h1>
            <p className="text-xs" style={{ color:'rgba(241,245,249,0.35)' }}>verified organizer</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-4 pt-5 pb-32 flex flex-col gap-5">
        {/* Basics */}
        <div style={card}>
          <p className="font-bold text-white text-sm mb-4" style={{ fontFamily:"'Syne',sans-serif" }}>the basics</p>
          <div className="flex flex-col gap-4">
            <div><label style={lbl}>event title *</label><input style={inp} placeholder="Give your event a catchy name" value={formData.title} onChange={e=>set('title',e.target.value)} onFocus={focus} onBlur={blur}/></div>
            <div>
              <label style={lbl}>category *</label>
              <select value={formData.category} onChange={e=>set('category',e.target.value)} onFocus={focus} onBlur={blur} style={{...inp,appearance:'none' as const}}>
                <option value="" disabled>Select a category</option>
                {CATEGORIES.map(c=><option key={c.value} value={c.value} style={{background:'#0d1230'}}>{c.label}</option>)}
              </select>
            </div>
            <div><label style={lbl}>description</label><textarea rows={3} placeholder="Tell people what to expect..." value={formData.description} onChange={e=>set('description',e.target.value)} onFocus={focus as any} onBlur={blur as any} style={{...inp,resize:'none' as const,lineHeight:1.5}}/></div>
          </div>
        </div>

        {/* When */}
        <div style={card}>
          <p className="font-bold text-white text-sm mb-4 flex items-center gap-2" style={{ fontFamily:"'Syne',sans-serif" }}><Calendar className="w-4 h-4" style={{color:'#a78bfa'}}/> when</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label style={lbl}>date *</label><input type="date" style={inp} value={formData.date} min={new Date().toISOString().split('T')[0]} onChange={e=>set('date',e.target.value)} onFocus={focus} onBlur={blur}/></div>
            <div><label style={lbl}>time *</label><input type="time" style={inp} value={formData.time} onChange={e=>set('time',e.target.value)} onFocus={focus} onBlur={blur}/></div>
          </div>
        </div>

        {/* Where */}
        <div style={card}>
          <p className="font-bold text-white text-sm mb-4 flex items-center gap-2" style={{ fontFamily:"'Syne',sans-serif" }}><MapPin className="w-4 h-4" style={{color:'#a78bfa'}}/> where</p>
          <div className="flex flex-col gap-3">
            <div><label style={lbl}>location *</label><input style={inp} placeholder="e.g. Robarts Library, Room 123" value={formData.location} onChange={e=>set('location',e.target.value)} onFocus={focus} onBlur={blur}/></div>
            <div className="grid grid-cols-2 gap-2">
              {[{val:true,l:'🎓 on campus'},{val:false,l:'🌆 off campus'}].map(o=>(
                <button key={String(o.val)} type="button" onClick={()=>set('is_on_campus',o.val)} className="py-2.5 rounded-2xl text-sm font-semibold transition-all" style={{ border:`1.5px solid ${formData.is_on_campus===o.val?'#7c3aed':'rgba(255,255,255,0.1)'}`, background:formData.is_on_campus===o.val?'rgba(124,58,237,0.2)':'rgba(255,255,255,0.04)', color:formData.is_on_campus===o.val?'#c4b5fd':'rgba(241,245,249,0.5)',cursor:'pointer' }}>{o.l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Attendance */}
        <div style={card}>
          <p className="font-bold text-white text-sm mb-4 flex items-center gap-2" style={{ fontFamily:"'Syne',sans-serif" }}><Users className="w-4 h-4" style={{color:'#a78bfa'}}/> attendance</p>
          <div className="flex flex-col gap-4">
            <div><label style={lbl}>max capacity (optional)</label><input type="number" style={inp} placeholder="Leave empty for unlimited" value={formData.capacity} min={1} onChange={e=>set('capacity',e.target.value)} onFocus={focus} onBlur={blur}/></div>
            <div>
              <label style={lbl}>access type</label>
              <div className="flex flex-col gap-2">
                {ACCESS_TYPES.map(t=>(
                  <button key={t.value} type="button" onClick={()=>set('access_type',t.value)} className="flex items-start gap-3 p-3 rounded-2xl text-left transition-all" style={{ border:`1.5px solid ${formData.access_type===t.value?'#7c3aed':'rgba(255,255,255,0.08)'}`, background:formData.access_type===t.value?'rgba(124,58,237,0.15)':'rgba(255,255,255,0.03)',cursor:'pointer' }}>
                    <div className="w-5 h-5 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center" style={{ border:`2px solid ${formData.access_type===t.value?'#7c3aed':'rgba(255,255,255,0.2)'}`, background:formData.access_type===t.value?'#7c3aed':'transparent' }}>
                      {formData.access_type===t.value&&<Check className="w-3 h-3 text-white"/>}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{color:formData.access_type===t.value?'#c4b5fd':'#f1f5f9'}}>{t.label}</p>
                      <p className="text-xs mt-0.5" style={{color:'rgba(241,245,249,0.4)'}}>{t.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {formData.access_type!=='open_rsvp'&&(
          <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background:'rgba(124,58,237,0.1)',border:'1px solid rgba(124,58,237,0.25)' }}>
            <span className="text-lg">🔐</span>
            <p className="text-xs" style={{color:'#c4b5fd',lineHeight:1.6}}>an invite code will be auto-generated when you publish. share it with guests via the social tab.</p>
          </div>
        )}
      </form>

      <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 pt-2 z-30" style={{ background:'linear-gradient(to top,#07091a 60%,transparent)' }}>
        <button onClick={handleSubmit} disabled={loading} className="w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ background:'linear-gradient(135deg,#7c3aed,#db2777)',border:'none',cursor:loading?'not-allowed':'pointer',fontFamily:"'Syne',sans-serif",boxShadow:'0 4px 20px rgba(124,58,237,0.4)' }}>
          {loading?<><Loader2 className="w-4 h-4 animate-spin"/>creating…</>:<><Sparkles className="w-4 h-4"/>publish event</>}
        </button>
      </div>
    </AppLayout>
  );
};

export default Post;
