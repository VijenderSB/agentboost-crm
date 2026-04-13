import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, Plus, X } from 'lucide-react';

interface EyeCentre { id: string; name: string; city: string; }
interface LeadEyeCentre { id: string; eye_centre_id: string; referred_at: string; referred_by: string; }

export default function LeadEyeCentres({ leadId }: { leadId: string }) {
  const { user } = useAuth();
  const [allCentres, setAllCentres] = useState<EyeCentre[]>([]);
  const [linkedCentres, setLinkedCentres] = useState<(LeadEyeCentre & { name: string; city: string })[]>([]);
  const [selectedCentre, setSelectedCentre] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [{ data: centres }, { data: linked }] = await Promise.all([
      supabase.from('eye_centres').select('id, name, city').eq('status', 'active').order('name'),
      supabase.from('lead_eye_centres').select('id, eye_centre_id, referred_at, referred_by').eq('lead_id', leadId),
    ]);

    const centreMap = new Map((centres || []).map((c: any) => [c.id, c]));
    setAllCentres((centres || []) as EyeCentre[]);
    setLinkedCentres(
      (linked || []).map((l: any) => {
        const c = centreMap.get(l.eye_centre_id) as EyeCentre | undefined;
        return { ...l, name: c?.name || 'Unknown', city: c?.city || '' };
      })
    );
  };

  useEffect(() => { fetchData(); }, [leadId]);

  const addReferral = async () => {
    if (!selectedCentre || !user) return;
    setLoading(true);
    const { error } = await supabase.from('lead_eye_centres').insert({
      lead_id: leadId,
      eye_centre_id: selectedCentre,
      referred_by: user.id,
    });
    if (error) {
      if (error.code === '23505') toast.error('Already referred to this Eye Centre');
      else toast.error(error.message);
    } else {
      toast.success('Referred to Eye Centre');
      setSelectedCentre('');
      fetchData();
    }
    setLoading(false);
  };

  const removeReferral = async (id: string) => {
    const { error } = await supabase.from('lead_eye_centres').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Referral removed'); fetchData(); }
  };

  const availableCentres = allCentres.filter(c => !linkedCentres.some(l => l.eye_centre_id === c.id));
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Building2 className="w-4 h-4" /> Eye Centres Referred
      </h3>

      {/* Current referrals */}
      <div className="space-y-2 mb-3">
        {linkedCentres.length === 0 && (
          <p className="text-sm text-muted-foreground">No Eye Centre referral yet.</p>
        )}
        {linkedCentres.map(lc => (
          <div key={lc.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border">
            <div>
              <p className="text-sm font-medium">{lc.name}</p>
              <p className="text-xs text-muted-foreground">
                {lc.city} • Referred {new Date(lc.referred_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            {isAdmin && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeReferral(lc.id)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add referral */}
      {availableCentres.length > 0 && (
        <div className="flex gap-2">
          <Select value={selectedCentre} onValueChange={setSelectedCentre}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select Eye Centre..." />
            </SelectTrigger>
            <SelectContent>
              {availableCentres.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} {c.city ? `(${c.city})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addReferral} disabled={!selectedCentre || loading} size="sm" className="gap-1">
            <Plus className="w-4 h-4" /> Refer
          </Button>
        </div>
      )}
    </div>
  );
}
