import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface EyeCentre {
  id: string;
  name: string;
  city: string;
  status: string;
}

export default function EyeCentreManager() {
  const [centres, setCentres] = useState<EyeCentre[]>([]);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCentres = async () => {
    const { data } = await supabase.from('eye_centres').select('*').order('city').order('name');
    if (data) setCentres(data as EyeCentre[]);
  };

  useEffect(() => { fetchCentres(); }, []);

  const addCentre = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setLoading(true);
    const { error } = await supabase.from('eye_centres').insert({ name: name.trim(), city: city.trim() });
    if (error) toast.error(error.message);
    else { toast.success('Eye Centre added'); setName(''); setCity(''); fetchCentres(); }
    setLoading(false);
  };

  const toggleStatus = async (c: EyeCentre) => {
    const newStatus = c.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('eye_centres').update({ status: newStatus }).eq('id', c.id);
    if (error) toast.error(error.message);
    else { toast.success(`${c.name} ${newStatus}`); fetchCentres(); }
  };

  const deleteCentre = async (c: EyeCentre) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    const { error } = await supabase.from('eye_centres').delete().eq('id', c.id);
    if (error) toast.error(error.message);
    else { toast.success('Deleted'); fetchCentres(); }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <h3 className="font-semibold">Eye Centres</h3>
      <p className="text-xs text-muted-foreground">Manage Lasik Eye Centres for lead referrals</p>

      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[150px]">
          <Label>Centre Name *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Healing Touch Eye Centre" />
        </div>
        <div className="flex-1 min-w-[120px]">
          <Label>City</Label>
          <Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Delhi" />
        </div>
        <Button onClick={addCentre} disabled={loading} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {centres.length === 0 && <p className="text-sm text-muted-foreground">No eye centres added yet.</p>}
        {centres.map(c => (
          <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
            <div>
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.city || 'No city'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={`text-xs ${c.status === 'active' ? 'text-success' : 'text-muted-foreground'}`}
                onClick={() => toggleStatus(c)}
              >
                {c.status === 'active' ? 'Active' : 'Inactive'}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCentre(c)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
